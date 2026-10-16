-- ============================================================
-- Enable RLS + role-based policies
--
-- Prinsip:
--   * anon (belum login)  : tidak punya akses sama sekali.
--   * authenticated       : boleh MEMBACA data operasional (dashboard
--                           dipakai semua role).
--   * staff (admin, farmasi, apoteker) : boleh menulis master data,
--                           stok masuk/keluar, dan opname.
--   * nakes               : hanya boleh membuat & mengedit permintaan
--                           (transaksi status 'diajukan') miliknya sendiri.
--   * service_role        : bypass RLS (dipakai UserManagement).
--
-- Role diambil dari public.user_roles (bukan user_metadata, karena
-- user_metadata bisa diubah sendiri oleh user lewat auth.updateUser).
-- ============================================================

-- ------------------------------------------------------------
-- Helper: cek role user yang sedang login
-- ------------------------------------------------------------
create or replace function public.has_any_role(p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.role = any (p_roles)
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_any_role(array['admin', 'farmasi', 'apoteker']);
$$;

revoke execute on function public.has_any_role(text[]) from public, anon;
revoke execute on function public.is_staff() from public, anon;
grant execute on function public.has_any_role(text[]) to authenticated;
grant execute on function public.is_staff() to authenticated;

-- ------------------------------------------------------------
-- Enable RLS
-- ------------------------------------------------------------
alter table public.master_obat        enable row level security;
alter table public.master_jasa        enable row level security;
alter table public.service_categories enable row level security;
alter table public.transaksi          enable row level security;
alter table public.transaksi_detail   enable row level security;
alter table public.transaksi_jasa     enable row level security;
alter table public.opname_schedule    enable row level security;
alter table public.opname             enable row level security;
alter table public.opname_detail      enable row level security;

-- Tabel backup (hanya ada di prod): RLS on tanpa policy => hanya service_role
alter table if exists public.backup_transaksi_duplikat_20260615        enable row level security;
alter table if exists public.backup_transaksi_detail_duplikat_20260615 enable row level security;
alter table if exists public.backup_transaksi_jasa_duplikat_20260615   enable row level security;

-- View (hanya ada di prod): tanpa security_invoker, view berjalan sebagai
-- owner (postgres) sehingga melewati RLS master_obat
alter view if exists public.v_master_obat_lengkap set (security_invoker = on);

-- ------------------------------------------------------------
-- Master data: baca = semua user login, tulis = staff
-- (hapus dilakukan sebagai soft delete lewat UPDATE)
-- ------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'master_obat', 'master_jasa', 'service_categories',
    'opname_schedule', 'opname', 'opname_detail'
  ]
  loop
    execute format('create policy "authenticated can read" on public.%I for select to authenticated using (true)', t);
    execute format('create policy "staff can insert" on public.%I for insert to authenticated with check ((select public.is_staff()))', t);
    execute format('create policy "staff can update" on public.%I for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()))', t);
    execute format('create policy "staff can delete" on public.%I for delete to authenticated using ((select public.is_staff()))', t);
  end loop;
end $$;

-- ------------------------------------------------------------
-- transaksi
-- ------------------------------------------------------------
create policy "authenticated can read"
  on public.transaksi for select to authenticated
  using (true);

create policy "staff can insert"
  on public.transaksi for insert to authenticated
  with check ((select public.is_staff()));

create policy "nakes can insert own request"
  on public.transaksi for insert to authenticated
  with check (
    (select public.has_any_role(array['nakes']))
    and created_by = (select auth.uid())
    and status = 'diajukan'
  );

create policy "staff can update"
  on public.transaksi for update to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

create policy "nakes can update own pending request"
  on public.transaksi for update to authenticated
  using (
    (select public.has_any_role(array['nakes']))
    and created_by = (select auth.uid())
    and status = 'diajukan'
  )
  with check (
    created_by = (select auth.uid())
    and status = 'diajukan'
  );

create policy "staff can delete"
  on public.transaksi for delete to authenticated
  using ((select public.is_staff()));

-- ------------------------------------------------------------
-- transaksi_detail & transaksi_jasa
-- nakes hanya boleh mengubah item milik permintaan 'diajukan' miliknya
-- ------------------------------------------------------------
create or replace function public.can_edit_transaksi(p_transaksi_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_staff()
      or exists (
        select 1
        from public.transaksi t
        where t.id = p_transaksi_id
          and t.created_by = (select auth.uid())
          and t.status = 'diajukan'
          and public.has_any_role(array['nakes'])
      );
$$;

revoke execute on function public.can_edit_transaksi(bigint) from public, anon;
grant execute on function public.can_edit_transaksi(bigint) to authenticated;

do $$
declare
  t text;
begin
  foreach t in array array['transaksi_detail', 'transaksi_jasa']
  loop
    execute format('create policy "authenticated can read" on public.%I for select to authenticated using (true)', t);
    execute format('create policy "editor can insert" on public.%I for insert to authenticated with check (public.can_edit_transaksi(transaksi_id))', t);
    execute format('create policy "editor can update" on public.%I for update to authenticated using (public.can_edit_transaksi(transaksi_id)) with check (public.can_edit_transaksi(transaksi_id))', t);
    execute format('create policy "editor can delete" on public.%I for delete to authenticated using (public.can_edit_transaksi(transaksi_id))', t);
  end loop;
end $$;

-- ------------------------------------------------------------
-- Perbaikan policy lama
-- ------------------------------------------------------------

-- profiles: jangan bisa dibaca anon (berisi email)
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
create policy "Authenticated can view profiles"
  on public.profiles for select to authenticated
  using (true);

-- notifications: sebelumnya role "public" => anon bisa insert & baca broadcast
drop policy if exists "Service role can insert notifications" on public.notifications;
create policy "Authenticated can insert notifications"
  on public.notifications for insert to authenticated
  with check (true);

alter policy "Users can view notifications for them"
  on public.notifications to authenticated;
alter policy "Users can mark notifications as read"
  on public.notifications to authenticated;

-- master_jenis_obat & master_satuan: sebelumnya cek role dari
-- raw_user_meta_data, yang bisa diubah user sendiri => ganti ke user_roles
drop policy if exists "Allow insert for admin" on public.master_jenis_obat;
drop policy if exists "Allow update for admin" on public.master_jenis_obat;
drop policy if exists "Allow delete for admin" on public.master_jenis_obat;
drop policy if exists "Allow insert for admin" on public.master_satuan;
drop policy if exists "Allow update for admin" on public.master_satuan;
drop policy if exists "Allow delete for admin" on public.master_satuan;

do $$
declare
  t text;
begin
  foreach t in array array['master_jenis_obat', 'master_satuan']
  loop
    execute format('create policy "staff can insert" on public.%I for insert to authenticated with check ((select public.is_staff()))', t);
    execute format('create policy "staff can update" on public.%I for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()))', t);
    execute format('create policy "admin can delete" on public.%I for delete to authenticated using ((select public.has_any_role(array[''admin''])))', t);
  end loop;
end $$;

-- ------------------------------------------------------------
-- Index pendukung lookup policy
-- ------------------------------------------------------------
create index if not exists user_roles_user_id_role_idx on public.user_roles (user_id, role);
create index if not exists transaksi_created_by_idx on public.transaksi (created_by);
