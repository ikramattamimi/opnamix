-- ============================================================
-- Baseline schema Opnamix
--
-- Diambil dari project dev (nknedmixkadinfmfxfrk) pada 2026-10-16
-- lewat katalog Postgres (pg_get_functiondef, pg_get_constraintdef,
-- pg_policies, dll.), lalu dirapikan. Tujuannya supaya project
-- Supabase baru bisa dibangun dari repo: `supabase db reset` di lokal
-- atau `supabase db push` ke project kosong.
--
-- JANGAN dijalankan di project yang sudah punya tabel (dev/prod).
-- Di project lama, tandai saja sebagai sudah diterapkan:
--   supabase migration repair --status applied 20260101000000
--
-- Yang sengaja TIDAK ada di sini karena dibuat migration berikutnya
-- (supaya tidak ada create policy/function ganda):
--   * 20261014000000_enable_rls_policies: has_any_role, is_staff,
--     can_edit_transaksi, policy staff/nakes/editor, policy
--     "Authenticated can view profiles", "Authenticated can insert
--     notifications", index user_roles & transaksi.created_by
--   * 20261014010000_update_stock_atomic: update_stock_atomic
--   * 20261016000000_storage_bukti_stok_masuk: bucket + policy upload
--
-- Data master awal (kategori layanan, jenis obat, satuan) dan user
-- admin ada di supabase/seed.sql.
-- ============================================================

create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;

-- ------------------------------------------------------------
-- Sequence untuk tabel lama yang memakai serial
-- ------------------------------------------------------------
create sequence public.service_categories_id_seq as integer;
create sequence public.master_jenis_obat_id_seq;
create sequence public.master_satuan_id_seq;

-- ------------------------------------------------------------
-- Master data
-- ------------------------------------------------------------
create table public.service_categories (
  id integer not null default nextval('public.service_categories_id_seq'::regclass),
  name character varying not null,
  code character varying not null,
  description text,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint service_categories_pkey primary key (id),
  constraint service_categories_code_key unique (code),
  constraint service_categories_name_key unique (name)
);

create table public.master_jenis_obat (
  id bigint not null default nextval('public.master_jenis_obat_id_seq'::regclass),
  kode character varying not null,
  nama_jenis character varying not null,
  deskripsi text,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  created_by uuid,
  updated_by uuid,
  constraint master_jenis_obat_pkey primary key (id),
  constraint master_jenis_obat_kode_key unique (kode),
  constraint master_jenis_obat_created_by_fkey foreign key (created_by) references auth.users(id),
  constraint master_jenis_obat_updated_by_fkey foreign key (updated_by) references auth.users(id)
);

create table public.master_satuan (
  id bigint not null default nextval('public.master_satuan_id_seq'::regclass),
  kode character varying not null,
  nama_satuan character varying not null,
  deskripsi text,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  created_by uuid,
  updated_by uuid,
  constraint master_satuan_pkey primary key (id),
  constraint master_satuan_kode_key unique (kode),
  constraint master_satuan_created_by_fkey foreign key (created_by) references auth.users(id),
  constraint master_satuan_updated_by_fkey foreign key (updated_by) references auth.users(id)
);

alter sequence public.service_categories_id_seq owned by public.service_categories.id;
alter sequence public.master_jenis_obat_id_seq owned by public.master_jenis_obat.id;
alter sequence public.master_satuan_id_seq owned by public.master_satuan.id;

create table public.master_jasa (
  id bigint generated always as identity not null,
  kode text not null,
  nama text not null,
  harga numeric default 0,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  created_by uuid,
  updated_at timestamp with time zone default now(),
  updated_by uuid,
  deleted_at timestamp with time zone,
  category_id integer,
  constraint master_jasa_pkey primary key (id),
  constraint master_jasa_kode_key unique (kode),
  constraint master_jasa_category_id_fkey foreign key (category_id) references public.service_categories(id)
);

create table public.master_obat (
  id bigint generated always as identity not null,
  kode text not null,
  nama text not null,
  jenis text,
  satuan text,
  buffer_stok integer default 0,
  harga numeric default 0,
  qty integer default 0,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  created_by uuid,
  updated_at timestamp with time zone default now(),
  updated_by uuid,
  deleted_at timestamp with time zone,
  jenis_obat_id bigint,
  satuan_id bigint,
  merek character varying,
  kandungan text,
  constraint master_obat_pkey primary key (id),
  constraint master_obat_kode_key unique (kode),
  constraint master_obat_jenis_obat_id_fkey foreign key (jenis_obat_id) references public.master_jenis_obat(id),
  constraint master_obat_satuan_id_fkey foreign key (satuan_id) references public.master_satuan(id)
);

comment on column public.master_obat.merek is 'Merek/brand obat (e.g., Sanbe, Kimia Farma)';
comment on column public.master_obat.kandungan is 'Kandungan/komposisi obat (e.g., Paracetamol 500mg)';

-- ------------------------------------------------------------
-- User: profil dan role (role dibaca dari user_roles, bukan metadata)
-- ------------------------------------------------------------
create table public.profiles (
  id uuid not null,
  email text not null,
  full_name text,
  role text,
  avatar_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint profiles_pkey primary key (id),
  constraint profiles_email_key unique (email),
  constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade,
  constraint profiles_role_check check (role = any (array['admin'::text, 'nakes'::text, 'apoteker'::text, 'farmasi'::text]))
);

create table public.user_roles (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  role text not null,
  created_at timestamp with time zone default now(),
  constraint user_roles_pkey primary key (id),
  constraint user_roles_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade,
  constraint user_roles_user_id_fkey1 foreign key (user_id) references public.profiles(id) on delete cascade,
  constraint user_roles_role_check check (role = any (array['admin'::text, 'nakes'::text, 'apoteker'::text, 'farmasi'::text]))
);

create table public.notifications (
  id bigint generated always as identity not null,
  user_id uuid,
  target_role text,
  type text not null,
  title text not null,
  message text not null,
  data jsonb default '{}'::jsonb,
  is_read boolean default false,
  created_at timestamp with time zone default now(),
  constraint notifications_pkey primary key (id),
  constraint notifications_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade,
  constraint notifications_target_role_check check (target_role is null or target_role = any (array['admin'::text, 'nakes'::text, 'apoteker'::text, 'farmasi'::text]))
);

-- ------------------------------------------------------------
-- Opname
-- ------------------------------------------------------------
create table public.opname_schedule (
  id bigint generated always as identity not null,
  nama text not null,
  tanggal_audit integer,
  obat_ids jsonb,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  created_by uuid,
  updated_at timestamp with time zone default now(),
  updated_by uuid,
  deleted_at timestamp with time zone,
  waktu_jam smallint,
  waktu_menit smallint,
  pengulangan text,
  durasi_pengerjaan integer,
  constraint opname_schedule_pkey primary key (id),
  constraint opname_schedule_tanggal_audit_check check (tanggal_audit >= 1 and tanggal_audit <= 28)
);

create table public.opname (
  id bigint generated always as identity not null,
  schedule_id bigint,
  status text default 'belum_dilaksanakan'::text,
  tanggal timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  created_by uuid,
  updated_at timestamp with time zone default now(),
  updated_by uuid,
  deleted_at timestamp with time zone,
  tanggal_jadwal date,
  current_step smallint default 1,
  selected_obat_ids jsonb,
  completed_at timestamp with time zone,
  obat_ids jsonb,
  constraint opname_pkey primary key (id),
  constraint opname_schedule_id_fkey foreign key (schedule_id) references public.opname_schedule(id)
);

comment on column public.opname.obat_ids is 'JSON array of obat IDs that were finally selected for this opname instance';

create table public.opname_detail (
  id bigint generated always as identity not null,
  opname_id bigint,
  obat_id bigint,
  stok_fisik integer,
  stok_sistem integer,
  selisih integer,
  status text default 'pending'::text,
  alasan text,
  stok_final integer,
  created_at timestamp with time zone default now(),
  created_by uuid,
  updated_at timestamp with time zone default now(),
  updated_by uuid,
  deleted_at timestamp with time zone,
  constraint opname_detail_pkey primary key (id),
  constraint opname_detail_obat_id_fkey foreign key (obat_id) references public.master_obat(id),
  constraint opname_detail_opname_id_fkey foreign key (opname_id) references public.opname(id)
);

-- ------------------------------------------------------------
-- Transaksi stok masuk/keluar
-- ------------------------------------------------------------
create table public.transaksi (
  id bigint generated by default as identity not null,
  nomor text,
  tanggal timestamp with time zone default now(),
  tipe text,
  bukti text,
  nama_pasien text,
  jasa_id bigint,
  keterangan text,
  status text default 'diajukan'::text,
  total numeric default 0,
  diskon numeric default 0,
  processed_by uuid,
  processed_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  created_by uuid,
  updated_at timestamp with time zone default now(),
  updated_by uuid,
  deleted_at timestamp with time zone,
  tipe_sumber text,
  tanggal_lahir_pasien date,
  nama_nakes text,
  biaya_layanan numeric not null default 0,
  constraint transaksi_pkey primary key (id),
  constraint transaksi_nomor_key unique (nomor),
  constraint transaksi_jasa_id_fkey foreign key (jasa_id) references public.master_jasa(id),
  constraint transaksi_tipe_check check (tipe = any (array['masuk'::text, 'keluar'::text]))
);

comment on column public.transaksi.tanggal_lahir_pasien is 'Tanggal lahir pasien untuk transaksi';

create table public.transaksi_detail (
  id bigint generated always as identity not null,
  transaksi_id bigint not null,
  transaksi_nomor text,
  obat_id bigint,
  qty integer not null,
  expire_date date,
  batch text,
  harga numeric,
  subtotal numeric,
  constraint transaksi_detail_pkey primary key (id),
  constraint transaksi_detail_obat_id_fkey foreign key (obat_id) references public.master_obat(id),
  constraint transaksi_detail_transaksi_id_fkey foreign key (transaksi_id) references public.transaksi(id),
  constraint transaksi_detail_transaksi_nomor_fkey foreign key (transaksi_nomor) references public.transaksi(nomor)
);

create table public.transaksi_jasa (
  id bigint generated always as identity not null,
  transaksi_id bigint not null,
  transaksi_nomor text,
  jasa_id bigint not null,
  qty integer default 1,
  harga_jasa numeric,
  subtotal numeric,
  created_at timestamp with time zone default now(),
  created_by uuid,
  updated_at timestamp with time zone default now(),
  updated_by uuid,
  deleted_at timestamp with time zone,
  constraint transaksi_jasa_pkey primary key (id),
  constraint transaksi_jasa_created_by_fkey foreign key (created_by) references auth.users(id),
  constraint transaksi_jasa_jasa_id_fkey foreign key (jasa_id) references public.master_jasa(id),
  constraint transaksi_jasa_transaksi_id_fkey foreign key (transaksi_id) references public.transaksi(id),
  constraint transaksi_jasa_transaksi_nomor_fkey foreign key (transaksi_nomor) references public.transaksi(nomor),
  constraint transaksi_jasa_updated_by_fkey foreign key (updated_by) references auth.users(id)
);

-- ------------------------------------------------------------
-- Fungsi (definisi sama persis dengan dev)
-- ------------------------------------------------------------
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

create or replace function public.generate_transaksi_nomor()
returns trigger
language plpgsql
as $function$
DECLARE
    date_part TEXT;
    sequence_part INT;
    new_nomor TEXT;
BEGIN
    IF NEW.nomor IS NOT NULL THEN
        RETURN NEW;
    END IF;
    date_part := to_char(COALESCE(NEW.tanggal, NOW()), 'YYYYMMDD');
    SELECT COUNT(*) + 1 INTO sequence_part
    FROM transaksi
    WHERE to_char(tanggal, 'YYYYMMDD') = date_part;
    new_nomor := 'TR-' || date_part || '-' || lpad(sequence_part::text, 4, '0');
    WHILE EXISTS (SELECT 1 FROM transaksi WHERE nomor = new_nomor) LOOP
        sequence_part := sequence_part + 1;
        new_nomor := 'TR-' || date_part || '-' || lpad(sequence_part::text, 4, '0');
    END LOOP;
    NEW.nomor := new_nomor;
    RETURN NEW;
END;
$function$;

-- Membuat baris profiles setiap ada user baru di auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'apoteker'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$function$;

-- Fungsi lama, tidak dipakai aplikasi lagi (diganti update_stock_atomic).
-- Tetap dibuat supaya schema sama dengan dev/prod.
create or replace function public.increment_obat_qty(obat_id integer, qty_change integer)
returns void
language plpgsql
as $function$
BEGIN
  UPDATE master_obat SET qty = qty + qty_change, updated_at = NOW() WHERE id = obat_id;
END;
$function$;

create or replace function public.decrement_obat_qty(obat_id integer, qty_change integer)
returns void
language plpgsql
as $function$
BEGIN
  UPDATE master_obat SET qty = qty - qty_change, updated_at = NOW() WHERE id = obat_id;
END;
$function$;

create or replace function public.notify_low_stock()
returns trigger
language plpgsql
as $function$
BEGIN
  IF OLD.qty IS DISTINCT FROM NEW.qty THEN
    IF NEW.qty = 0 AND OLD.qty > 0 THEN
      INSERT INTO notifications (user_id, target_role, type, title, message, data)
      VALUES (NULL, 'admin', 'STOCK_EMPTY', 'Stok Habis!',
        '🚨 STOK HABIS: ' || NEW.nama || ' (Kode: ' || NEW.kode || ') sudah 0!',
        jsonb_build_object('obat_id', NEW.id, 'nama', NEW.nama, 'kode', NEW.kode, 'qty', NEW.qty));
    ELSIF NEW.qty > 0 AND NEW.qty <= COALESCE(NEW.buffer_stok, 0) AND (OLD.qty > COALESCE(OLD.buffer_stok, 0) OR OLD.qty > NEW.qty) THEN
      INSERT INTO notifications (user_id, target_role, type, title, message, data)
      VALUES (NULL, 'admin', 'STOCK_LOW', 'Stok Rendah',
        '⚠️ Stok ' || NEW.nama || ' tinggal ' || NEW.qty || ' (minimum: ' || COALESCE(NEW.buffer_stok, 0) || ')',
        jsonb_build_object('obat_id', NEW.id, 'nama', NEW.nama, 'kode', NEW.kode, 'qty', NEW.qty, 'buffer_stok', COALESCE(NEW.buffer_stok, 0)));
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

create or replace function public.notify_master_jasa_added()
returns trigger
language plpgsql
as $function$
BEGIN
  INSERT INTO notifications (user_id, target_role, type, title, message, data)
  VALUES
    (NULL, 'admin', 'SERVICE_ADDED', 'Jasa Baru Ditambahkan', '🆕 Jasa baru: ' || NEW.nama, jsonb_build_object('jasa_id', NEW.id, 'nama', NEW.nama)),
    (NULL, 'apoteker', 'SERVICE_ADDED', 'Jasa Baru Ditambahkan', '🆕 Jasa baru: ' || NEW.nama, jsonb_build_object('jasa_id', NEW.id, 'nama', NEW.nama));
  RETURN NEW;
END;
$function$;

create or replace function public.notify_master_obat_change()
returns trigger
language plpgsql
as $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications (user_id, target_role, type, title, message, data)
    VALUES
      (NULL, 'admin', 'PRODUCT_ADDED', 'Produk Baru Ditambahkan',
       '🆕 Produk baru: ' || NEW.nama || ' (' || COALESCE(NEW.kode, '-') || ')',
       jsonb_build_object('obat_id', NEW.id, 'nama', NEW.nama, 'kode', NEW.kode)),
      (NULL, 'apoteker', 'PRODUCT_ADDED', 'Produk Baru Ditambahkan',
       '🆕 Produk baru: ' || NEW.nama || ' (' || COALESCE(NEW.kode, '-') || ')',
       jsonb_build_object('obat_id', NEW.id, 'nama', NEW.nama, 'kode', NEW.kode));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO notifications (user_id, target_role, type, title, message, data)
    VALUES (NULL, 'admin', 'PRODUCT_DELETED', 'Produk Dihapus',
      '🗑️ Produk dihapus: ' || OLD.nama || ' (' || COALESCE(OLD.kode, '-') || ')',
      jsonb_build_object('obat_id', OLD.id, 'nama', OLD.nama, 'kode', OLD.kode));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

create or replace function public.notify_new_transaction()
returns trigger
language plpgsql
as $function$
BEGIN
  IF NEW.tipe = 'keluar' AND NEW.tipe_sumber = 'PENGAJUAN_NAKES' AND NEW.status = 'diajukan' THEN
    INSERT INTO notifications (user_id, target_role, type, title, message, data)
    VALUES
      (NULL, 'admin', 'STOCK_OUT_REQUEST', 'Pengajuan Stok Keluar Baru',
       '📋 Permintaan obat baru untuk pasien ' || COALESCE(NEW.nama_pasien, 'N/A'),
       jsonb_build_object('transaksi_nomor', NEW.nomor, 'transaksi_id', NEW.id, 'nama_pasien', NEW.nama_pasien)),
      (NULL, 'apoteker', 'STOCK_OUT_REQUEST', 'Pengajuan Stok Keluar Baru',
       '📋 Permintaan obat baru untuk pasien ' || COALESCE(NEW.nama_pasien, 'N/A'),
       jsonb_build_object('transaksi_nomor', NEW.nomor, 'transaksi_id', NEW.id, 'nama_pasien', NEW.nama_pasien));
  END IF;
  IF NEW.tipe = 'masuk' AND NEW.status = 'selesai' THEN
    INSERT INTO notifications (user_id, target_role, type, title, message, data)
    VALUES (NULL, 'admin', 'STOCK_IN', 'Stok Masuk Dicatat',
      '📦 Stok masuk baru: ' || NEW.nomor || ' telah diterima',
      jsonb_build_object('transaksi_nomor', NEW.nomor, 'transaksi_id', NEW.id));
  END IF;
  IF NEW.tipe = 'keluar' AND NEW.tipe_sumber = 'KASIR_LANGSUNG' AND NEW.status = 'selesai' THEN
    INSERT INTO notifications (user_id, target_role, type, title, message, data)
    VALUES (NULL, 'admin', 'STOCK_OUT_DIRECT', 'Pengeluaran Stok Langsung',
      '💊 Pengeluaran langsung: ' || NEW.nomor || ' — pasien ' || COALESCE(NEW.nama_pasien, 'N/A'),
      jsonb_build_object('transaksi_nomor', NEW.nomor, 'transaksi_id', NEW.id, 'nama_pasien', NEW.nama_pasien));
  END IF;
  RETURN NEW;
END;
$function$;

create or replace function public.notify_opname_status_change()
returns trigger
language plpgsql
as $function$
BEGIN
  -- OPNAME_STARTED dihapus, dihandle oleh notifikasi OPNAME_STEP_CHANGED dari frontend
  -- OPNAME_COMPLETED dihapus sebelumnya, dihandle oleh frontend
  -- Fungsi ini dipertahankan untuk kemungkinan penambahan logika di masa depan
  RETURN NEW;
END;
$function$;

create or replace function public.notify_stock_out_processed()
returns trigger
language plpgsql
as $function$
BEGIN
  IF OLD.status = 'diajukan' AND NEW.status = 'selesai' AND NEW.tipe = 'keluar' THEN
    IF NEW.created_by IS NOT NULL THEN
      INSERT INTO notifications (user_id, target_role, type, title, message, data)
      VALUES (NEW.created_by, NULL, 'STOCK_OUT_PROCESSED', 'Permintaan Stok Diproses',
        '✅ Permintaan ' || NEW.nomor || ' untuk pasien ' || COALESCE(NEW.nama_pasien, 'N/A') || ' sudah diproses',
        jsonb_build_object('transaksi_nomor', NEW.nomor, 'transaksi_id', NEW.id, 'status', NEW.status));
    ELSE
      INSERT INTO notifications (user_id, target_role, type, title, message, data)
      VALUES (NULL, 'nakes', 'STOCK_OUT_PROCESSED', 'Permintaan Stok Diproses',
        '✅ Permintaan ' || NEW.nomor || ' untuk pasien ' || COALESCE(NEW.nama_pasien, 'N/A') || ' sudah diproses',
        jsonb_build_object('transaksi_nomor', NEW.nomor, 'transaksi_id', NEW.id, 'status', NEW.status));
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- ------------------------------------------------------------
-- Trigger
-- ------------------------------------------------------------
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger trg_notify_master_jasa_added after insert on public.master_jasa for each row execute function public.notify_master_jasa_added();
create trigger update_master_jasa_modtime before update on public.master_jasa for each row execute function public.update_updated_at_column();

create trigger update_master_jenis_obat_updated_at before update on public.master_jenis_obat for each row execute function public.update_updated_at_column();
create trigger update_master_satuan_updated_at before update on public.master_satuan for each row execute function public.update_updated_at_column();

create trigger trg_notify_low_stock after update on public.master_obat for each row execute function public.notify_low_stock();
create trigger trg_notify_master_obat_change after insert or delete on public.master_obat for each row execute function public.notify_master_obat_change();
create trigger update_master_obat_modtime before update on public.master_obat for each row execute function public.update_updated_at_column();

create trigger trg_notify_opname_status_change after insert or update on public.opname for each row execute function public.notify_opname_status_change();
create trigger update_opname_modtime before update on public.opname for each row execute function public.update_updated_at_column();
create trigger update_opname_detail_modtime before update on public.opname_detail for each row execute function public.update_updated_at_column();
create trigger update_opname_schedule_modtime before update on public.opname_schedule for each row execute function public.update_updated_at_column();

create trigger trg_notify_new_transaction after insert on public.transaksi for each row execute function public.notify_new_transaction();
create trigger trg_notify_stock_out_processed after update on public.transaksi for each row execute function public.notify_stock_out_processed();
create trigger trigger_generate_transaksi_nomor before insert on public.transaksi for each row execute function public.generate_transaksi_nomor();
create trigger update_transaksi_modtime before update on public.transaksi for each row execute function public.update_updated_at_column();

-- ------------------------------------------------------------
-- RLS untuk tabel yang tidak diurus 20261014000000_enable_rls_policies
-- (tabel lain di-enable di migration itu)
-- ------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.user_roles        enable row level security;
alter table public.notifications     enable row level security;
alter table public.master_jenis_obat enable row level security;
alter table public.master_satuan     enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile."
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can read own roles"
  on public.user_roles for select
  using (auth.uid() = user_id);

create policy "Authenticated users can read all roles"
  on public.user_roles for select to authenticated
  using (true);

create policy "Service role full access"
  on public.user_roles for all to service_role
  using (true) with check (true);

-- Role-nya diubah ke authenticated oleh 20261014000000_enable_rls_policies
create policy "Users can view notifications for them"
  on public.notifications for select
  using ((auth.uid() = user_id) or ((user_id is null) and (target_role is not null)) or ((user_id is null) and (target_role is null)));

create policy "Users can mark notifications as read"
  on public.notifications for update
  using ((auth.uid() = user_id) or ((user_id is null) and (target_role is not null)) or ((user_id is null) and (target_role is null)))
  with check ((auth.uid() = user_id) or ((user_id is null) and (target_role is not null)) or ((user_id is null) and (target_role is null)));

create policy "Allow read for authenticated users"
  on public.master_jenis_obat for select to authenticated
  using (true);

create policy "Allow read for authenticated users"
  on public.master_satuan for select to authenticated
  using (true);

-- ------------------------------------------------------------
-- Realtime
--   notifications : NotificationProvider
--   transaksi     : sudah ada di dev/prod
--   opname        : kunci opname realtime (fase 5 T3)
-- ------------------------------------------------------------
alter publication supabase_realtime add table public.notifications, public.transaksi, public.opname;
