-- ============================================================
-- Kunci stok selama opname berjalan, ditegakkan di database.
--
-- Aturan bisnis: selama ada opname berstatus 'sedang_dilaksanakan'
-- (belum dihapus), semua perubahan master_obat.qty ditolak, dari
-- opname dimulai sampai 'selesai' atau dihapus. Sebelumnya kunci
-- hanya ada di UI (OpnameLockPage, polling 30 detik) dan hanya di
-- current_step = 2.
--
-- * assert_no_active_opname(): raise kalau ada opname aktif.
-- * update_stock_atomic memanggilnya di awal, sehingga semua RPC
--   yang mengubah stok ikut terkunci.
-- * Trigger before update of qty di master_obat menutup jalur lain
--   (update langsung dari client, increment/decrement_obat_qty).
--   Pengecualian: finish_opname menyalakan
--   set_config('app.opname_finishing', 'on', true) di transaksinya.
-- * Permintaan stok keluar 'diajukan' tetap boleh dibuat selama
--   opname; memprosesnya otomatis ditolak oleh kunci ini.
--
-- Race condition saat opname mulai: transaksi stok mengambil advisory
-- lock SHARED, sedangkan perubahan status opname menjadi
-- 'sedang_dilaksanakan' mengambil lock EXCLUSIVE yang sama. Opname baru
-- aktif setelah transaksi stok yang sedang jalan commit, dan transaksi
-- stok berikutnya menunggu lalu melihat status opname yang baru.
-- Dengan begitu snapshot stok_sistem tidak bisa basi.
-- ============================================================

-- Kunci advisory dipakai bersama oleh transaksi stok dan opname
create or replace function public.opname_stock_lock_key()
returns bigint
language sql
immutable
set search_path = ''
as $$
  select 7281001::bigint;
$$;

create or replace function public.assert_no_active_opname()
returns void
language plpgsql
-- definer: pengecekan tidak boleh bergantung pada policy SELECT opname
security definer
set search_path = ''
as $$
declare
  v_opname_id bigint;
begin
  perform pg_advisory_xact_lock_shared(public.opname_stock_lock_key());

  select o.id into v_opname_id
    from public.opname o
   where o.status = 'sedang_dilaksanakan'
     and o.deleted_at is null
   order by o.id
   limit 1;

  if v_opname_id is not null then
    raise exception 'Stok sedang dikunci karena opname OPN-% sedang berjalan', v_opname_id
      using errcode = 'P0001';
  end if;
end;
$$;

revoke execute on function public.assert_no_active_opname() from public, anon;
grant execute on function public.assert_no_active_opname() to authenticated;

-- ------------------------------------------------------------
-- update_stock_atomic: sama seperti 20261014010000, ditambah cek kunci
-- ------------------------------------------------------------
create or replace function public.update_stock_atomic(p_items jsonb, p_tipe text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_item record;
  v_nama text;
  v_stok integer;
begin
  perform public.assert_no_active_opname();

  if p_tipe not in ('masuk', 'keluar') then
    raise exception 'Tipe stok tidak valid: %', p_tipe using errcode = '22023';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Daftar item kosong' using errcode = '22023';
  end if;

  -- Gabungkan item dengan obat yang sama, proses berurutan per id
  -- supaya urutan lock konsisten (mencegah deadlock).
  for v_item in
    select (e->>'product_id')::bigint as product_id,
           sum((e->>'quantity')::integer) as quantity
    from jsonb_array_elements(p_items) e
    group by 1
    order by 1
  loop
    if v_item.product_id is null or v_item.quantity is null or v_item.quantity <= 0 then
      raise exception 'Item stok tidak valid' using errcode = '22023';
    end if;

    if p_tipe = 'keluar' then
      update public.master_obat
         set qty = coalesce(qty, 0) - v_item.quantity
       where id = v_item.product_id
         and coalesce(qty, 0) >= v_item.quantity;
    else
      update public.master_obat
         set qty = coalesce(qty, 0) + v_item.quantity
       where id = v_item.product_id;
    end if;

    if not found then
      select nama, coalesce(qty, 0) into v_nama, v_stok
        from public.master_obat
       where id = v_item.product_id;

      if v_nama is null then
        raise exception 'Obat ID % tidak ditemukan', v_item.product_id using errcode = 'P0002';
      elsif p_tipe = 'keluar' and v_stok < v_item.quantity then
        raise exception 'Stok tidak cukup untuk %. Tersedia: %, diminta: %',
          v_nama, v_stok, v_item.quantity using errcode = 'P0001';
      else
        -- Baris terlihat tapi tidak bisa diubah => ditolak RLS
        raise exception 'Tidak punya akses mengubah stok %', v_nama using errcode = '42501';
      end if;
    end if;
  end loop;
end;
$$;

revoke execute on function public.update_stock_atomic(jsonb, text) from public, anon;
grant execute on function public.update_stock_atomic(jsonb, text) to authenticated;

-- ------------------------------------------------------------
-- Trigger master_obat: tolak perubahan qty selama opname aktif
-- ------------------------------------------------------------
create or replace function public.guard_master_obat_qty()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.qty is distinct from old.qty
     and coalesce(current_setting('app.opname_finishing', true), '') <> 'on' then
    perform public.assert_no_active_opname();
  end if;
  return new;
end;
$$;

create trigger trg_guard_master_obat_qty
  before update of qty on public.master_obat
  for each row execute function public.guard_master_obat_qty();

-- ------------------------------------------------------------
-- Trigger opname: serialisasi saat opname menjadi aktif, dan hanya
-- boleh ada satu opname aktif dalam satu waktu
-- ------------------------------------------------------------
create or replace function public.guard_opname_activation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_other_id bigint;
begin
  if new.status = 'sedang_dilaksanakan' and new.deleted_at is null
     and (tg_op = 'INSERT' or old.status is distinct from new.status or old.deleted_at is not null) then
    -- Tunggu transaksi stok yang sedang berjalan selesai
    perform pg_advisory_xact_lock(public.opname_stock_lock_key());

    select o.id into v_other_id
      from public.opname o
     where o.status = 'sedang_dilaksanakan'
       and o.deleted_at is null
       and o.id <> new.id
     limit 1;

    if v_other_id is not null then
      raise exception 'Opname OPN-% masih berjalan. Selesaikan atau hapus dulu sebelum memulai opname lain', v_other_id
        using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_guard_opname_activation
  before insert or update of status, deleted_at on public.opname
  for each row execute function public.guard_opname_activation();
