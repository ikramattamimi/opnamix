-- ============================================================
-- update_stock_atomic: ubah stok beberapa obat sekaligus secara atomik.
--
-- Dipanggil dari lib/api.ts lewat supabase.rpc('update_stock_atomic', {
--   p_items: [{ product_id, quantity }], p_tipe: 'masuk' | 'keluar' })
--
-- * Stok dihitung di database (qty = qty +/- n), jadi aman saat dua
--   transaksi berjalan bersamaan.
-- * Stok keluar ditolak bila stok tidak cukup; semua item dibatalkan.
-- * SECURITY INVOKER: tetap tunduk pada RLS master_obat, jadi hanya
--   staff (admin/farmasi/apoteker) yang bisa mengubah stok.
-- * search_path = public (bukan ''): trigger lama di master_obat
--   (notify_low_stock, dll.) memakai nama tabel tanpa schema dan ikut
--   mewarisi search_path fungsi ini.
-- ============================================================

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
