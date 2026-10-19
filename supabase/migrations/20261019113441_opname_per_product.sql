-- ============================================================
-- Opname per produk (Fase 6a redesain UI).
--
-- 1. Kunci per produk. Sebelumnya selama ada opname
--    'sedang_dilaksanakan' semua perubahan stok ditolak dan seluruh
--    aplikasi dikunci (OpnameLockPage). Sekarang hanya produk yang ada di
--    detail opname aktif yang ditolak; produk lain tetap bisa masuk/keluar.
--    Beberapa opname boleh berjalan bersamaan selama produknya tidak sama.
-- 2. Opname cepat tanpa jadwal: kolom opname.nama, dan RPC start_opname
--    yang membuat opname + detail dan langsung mengunci produknya.
-- 3. Produk yang belum dihitung tidak lagi tercatat stok fisik 0:
--    stok_fisik dan selisih null sampai diisi. finish_opname menolak
--    opname yang masih punya produk kosong.
-- 4. Alasan selisih berupa kode pilihan (alasan_kode) + catatan bebas
--    (catatan). Kolom alasan tetap diisi label alasan untuk laporan lama.
-- 5. Opname selesai tidak bisa diubah atau dihapus (trigger).
-- 6. Cakupan jadwal per kategori: opname_schedule.kategori.
-- ============================================================

-- ------------------------------------------------------------
-- Kolom baru
-- ------------------------------------------------------------
alter table public.opname add column if not exists nama text;
alter table public.opname_detail add column if not exists alasan_kode text;
alter table public.opname_detail add column if not exists catatan text;
-- Array JSON kategori (master_obat.jenis). null = tidak dibatasi kategori
alter table public.opname_schedule add column if not exists kategori jsonb;

alter table public.opname_detail
  add constraint opname_detail_alasan_kode_check
  check (alasan_kode is null or alasan_kode in (
    'belum_dicatat', 'rusak', 'kedaluwarsa', 'salah_hitung', 'salah_input', 'hilang', 'lainnya'
  ));

-- ------------------------------------------------------------
-- Kunci per produk
-- ------------------------------------------------------------

-- Tetap dipanggil update_stock_atomic: ambil lock SHARED supaya transaksi
-- stok tidak bentrok dengan opname yang sedang dimulai. Penolakan per
-- produk ada di trigger master_obat di bawah.
create or replace function public.assert_no_active_opname()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock_shared(public.opname_stock_lock_key());
end;
$$;

-- Opname aktif yang sedang menghitung produk ini, atau null
create or replace function public.active_opname_for_product(p_obat_id bigint)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select o.id
    from public.opname o
    join public.opname_detail d on d.opname_id = o.id
   where o.status = 'sedang_dilaksanakan'
     and o.deleted_at is null
     and d.obat_id = p_obat_id
   order by o.id
   limit 1;
$$;

revoke execute on function public.active_opname_for_product(bigint) from public, anon;
grant execute on function public.active_opname_for_product(bigint) to authenticated;

create or replace function public.guard_master_obat_qty()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_opname_id bigint;
begin
  if new.qty is distinct from old.qty
     and coalesce(current_setting('app.opname_finishing', true), '') <> 'on' then
    perform pg_advisory_xact_lock_shared(public.opname_stock_lock_key());
    v_opname_id := public.active_opname_for_product(new.id);
    if v_opname_id is not null then
      raise exception 'Stok % sedang dikunci karena opname OPN-% sedang berjalan', new.nama, v_opname_id
        using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

-- Saat opname menjadi aktif: tunggu transaksi stok yang sedang berjalan.
-- Tidak lagi membatasi satu opname aktif; bentrok produk dicek saat detail
-- dibuat (replace_opname_details).
create or replace function public.guard_opname_activation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'sedang_dilaksanakan' and new.deleted_at is null
     and (tg_op = 'INSERT' or old.status is distinct from new.status or old.deleted_at is not null) then
    perform pg_advisory_xact_lock(public.opname_stock_lock_key());
  end if;
  return new;
end;
$$;

-- ------------------------------------------------------------
-- Detail: produk kosong = belum dihitung, dan cek bentrok produk
-- ------------------------------------------------------------
create or replace function public.replace_opname_details(p_opname_id bigint, p_obat_ids jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_clash record;
begin
  if p_obat_ids is null or jsonb_typeof(p_obat_ids) <> 'array' or jsonb_array_length(p_obat_ids) = 0 then
    raise exception 'Pilih minimal satu produk untuk opname' using errcode = '22023';
  end if;

  -- Serialisasi dengan opname lain yang sedang dimulai dan transaksi stok
  perform pg_advisory_xact_lock(public.opname_stock_lock_key());

  select m.nama, o.id as opname_id into v_clash
    from public.opname_detail d
    join public.opname o on o.id = d.opname_id
    join public.master_obat m on m.id = d.obat_id
   where o.status = 'sedang_dilaksanakan'
     and o.deleted_at is null
     and o.id <> p_opname_id
     and d.obat_id in (select (e #>> '{}')::bigint from jsonb_array_elements(p_obat_ids) e)
   limit 1;

  if found then
    raise exception '% sedang dihitung di opname OPN-%. Selesaikan opname itu dulu', v_clash.nama, v_clash.opname_id
      using errcode = 'P0001';
  end if;

  delete from public.opname_detail where opname_id = p_opname_id;

  insert into public.opname_detail (opname_id, obat_id, stok_sistem, stok_fisik, selisih, status)
  select p_opname_id, m.id, coalesce(m.qty, 0), null, null, 'pending'
    from public.master_obat m
   where m.id in (select (e #>> '{}')::bigint from jsonb_array_elements(p_obat_ids) e)
   order by m.id;
end;
$$;

-- ------------------------------------------------------------
-- Mulai opname dalam satu langkah: buat header + detail, kunci produk
-- ------------------------------------------------------------
create or replace function public.start_opname(p_nama text, p_schedule_id bigint, p_obat_ids jsonb)
returns bigint
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id bigint;
begin
  if not public.is_staff() then
    raise exception 'Tidak punya akses memulai opname' using errcode = '42501';
  end if;

  insert into public.opname (nama, schedule_id, status, current_step, tanggal_jadwal,
                             selected_obat_ids, obat_ids)
  values (nullif(trim(p_nama), ''), p_schedule_id, 'sedang_dilaksanakan', 2, current_date,
          p_obat_ids, p_obat_ids)
  returning id into v_id;

  perform public.replace_opname_details(v_id, p_obat_ids);
  return v_id;
end;
$$;

revoke execute on function public.start_opname(text, bigint, jsonb) from public, anon;
grant execute on function public.start_opname(text, bigint, jsonb) to authenticated;

-- ------------------------------------------------------------
-- Simpan input: tambah reason_code dan note. physical_stock null
-- mengosongkan hitungan (belum dihitung).
-- ------------------------------------------------------------
create or replace function public.save_opname_details(p_opname_id bigint, p_step smallint, p_updates jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_expected integer;
  v_updated integer;
begin
  perform public.lock_editable_opname(p_opname_id);

  if p_step is not null then
    if p_step not between 1 and 3 then
      raise exception 'Langkah opname tidak valid: %', p_step using errcode = '22023';
    end if;
    update public.opname set current_step = p_step where id = p_opname_id;
  end if;

  if p_updates is null or jsonb_typeof(p_updates) <> 'array' or jsonb_array_length(p_updates) = 0 then
    return;
  end if;

  select count(distinct e->>'detail_id') into v_expected from jsonb_array_elements(p_updates) e;

  with u as (
    select (e->>'detail_id')::bigint as detail_id,
           e ? 'physical_stock' as has_fisik,
           (e->>'physical_stock')::integer as stok_fisik,
           e ? 'stok_final' as has_final,
           (e->>'stok_final')::integer as stok_final,
           e ? 'reason' as has_reason,
           e->>'reason' as alasan,
           e ? 'reason_code' as has_code,
           e->>'reason_code' as alasan_kode,
           e ? 'note' as has_note,
           e->>'note' as catatan
      from jsonb_array_elements(p_updates) e
  )
  update public.opname_detail d
     set stok_fisik = case when u.has_fisik then u.stok_fisik else d.stok_fisik end,
         selisih = case when u.has_fisik then u.stok_fisik - d.stok_sistem else d.selisih end,
         status = case
                    when u.has_fisik then case when u.stok_fisik - d.stok_sistem = 0 then 'sesuai' else 'pending' end
                    else d.status
                  end,
         stok_final = case when u.has_final then u.stok_final
                           when u.has_fisik then null
                           else d.stok_final end,
         alasan = case when u.has_reason then u.alasan else d.alasan end,
         alasan_kode = case when u.has_code then nullif(u.alasan_kode, '') else d.alasan_kode end,
         catatan = case when u.has_note then nullif(u.catatan, '') else d.catatan end
    from u
   where d.id = u.detail_id
     and d.opname_id = p_opname_id;

  get diagnostics v_updated = row_count;

  if v_updated <> v_expected then
    raise exception 'Sebagian detail tidak termasuk opname OPN-%', p_opname_id using errcode = '22023';
  end if;
end;
$$;

-- ------------------------------------------------------------
-- finish_opname: semua produk harus dihitung, selisih harus beralasan
-- ------------------------------------------------------------
create or replace function public.finish_opname(p_opname_id bigint)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_status text;
  v_item record;
  v_missing text;
begin
  if not public.is_staff() then
    raise exception 'Tidak punya akses menyelesaikan opname' using errcode = '42501';
  end if;

  select status into v_status
    from public.opname
   where id = p_opname_id
     and deleted_at is null
     for update;

  if not found then
    raise exception 'Opname OPN-% tidak ditemukan', p_opname_id using errcode = 'P0002';
  elsif v_status is distinct from 'sedang_dilaksanakan' then
    raise exception 'Opname OPN-% sudah diselesaikan atau belum dimulai', p_opname_id using errcode = 'P0001';
  end if;

  select m.nama into v_missing
    from public.opname_detail d
    join public.master_obat m on m.id = d.obat_id
   where d.opname_id = p_opname_id and d.stok_fisik is null
   limit 1;
  if found then
    raise exception 'Stok fisik % belum diisi', v_missing using errcode = '22023';
  end if;

  select m.nama into v_missing
    from public.opname_detail d
    join public.master_obat m on m.id = d.obat_id
   where d.opname_id = p_opname_id
     and coalesce(d.stok_final, d.stok_fisik) <> d.stok_sistem
     and d.alasan_kode is null and coalesce(trim(d.alasan), '') = ''
   limit 1;
  if found then
    raise exception 'Selisih % belum diberi alasan', v_missing using errcode = '22023';
  end if;

  update public.opname_detail
     set stok_final = coalesce(stok_final, stok_fisik),
         selisih = coalesce(stok_final, stok_fisik) - stok_sistem,
         status = case when coalesce(stok_final, stok_fisik) = stok_sistem then 'sesuai' else 'disesuaikan' end
   where opname_id = p_opname_id;

  perform set_config('app.opname_finishing', 'on', true);

  for v_item in
    select d.obat_id, d.stok_final, m.nama
      from public.opname_detail d
      join public.master_obat m on m.id = d.obat_id
     where d.opname_id = p_opname_id
     order by d.obat_id, d.id
  loop
    update public.master_obat set qty = v_item.stok_final where id = v_item.obat_id;
    if not found then
      raise exception 'Tidak punya akses mengubah stok %', v_item.nama using errcode = '42501';
    end if;
  end loop;

  perform set_config('app.opname_finishing', 'off', true);

  update public.opname
     set status = 'selesai', current_step = 3, completed_at = now()
   where id = p_opname_id;
end;
$$;

-- ------------------------------------------------------------
-- Opname selesai tidak bisa diubah atau dihapus
-- ------------------------------------------------------------
create or replace function public.guard_finished_opname()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'selesai' then
    if tg_op = 'DELETE'
       or new.status is distinct from old.status
       or new.deleted_at is distinct from old.deleted_at then
      raise exception 'Opname OPN-% sudah selesai dan tidak dapat diubah atau dihapus', old.id
        using errcode = 'P0001';
    end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger trg_guard_finished_opname
  before update or delete on public.opname
  for each row execute function public.guard_finished_opname();

create or replace function public.guard_finished_opname_detail()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_status text;
begin
  select o.status into v_status from public.opname o where o.id = old.opname_id;
  if v_status = 'selesai' then
    raise exception 'Detail opname OPN-% sudah final', old.opname_id using errcode = 'P0001';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger trg_guard_finished_opname_detail
  before update or delete on public.opname_detail
  for each row execute function public.guard_finished_opname_detail();

-- ------------------------------------------------------------
-- Hak akses fungsi yang diganti
-- ------------------------------------------------------------
do $$
declare
  f text;
begin
  foreach f in array array[
    'public.assert_no_active_opname()',
    'public.replace_opname_details(bigint, jsonb)',
    'public.save_opname_details(bigint, smallint, jsonb)',
    'public.finish_opname(bigint)'
  ]
  loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
