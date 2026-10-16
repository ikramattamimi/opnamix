-- ============================================================
-- process_stock_out_request: proses permintaan stok keluar
-- ('diajukan' -> 'selesai') dalam satu transaksi.
--
-- Dipanggil dari lib/api.ts lewat
--   supabase.rpc('process_stock_out_request', {
--     p_nomor, p_diskon, p_total, p_biaya_layanan })
--
-- * Baris transaksi dikunci FOR UPDATE. Kalau dua tab memproses
--   permintaan yang sama, tab kedua menunggu lalu ditolak karena status
--   sudah bukan 'diajukan'; stok hanya berkurang sekali.
-- * Pengurangan stok (update_stock_atomic) dan perubahan status
--   berhasil bersama atau batal bersama, jadi tidak perlu lagi
--   mengembalikan stok dari client.
-- * p_diskon / p_total / p_biaya_layanan null => nilai lama dipakai.
-- ============================================================

create or replace function public.process_stock_out_request(
  p_nomor text,
  p_diskon numeric default null,
  p_total numeric default null,
  p_biaya_layanan numeric default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id bigint;
  v_status text;
  v_items jsonb;
begin
  if not public.is_staff() then
    raise exception 'Tidak punya akses memproses permintaan' using errcode = '42501';
  end if;

  select id, status into v_id, v_status
    from public.transaksi
   where nomor = p_nomor
     and deleted_at is null
     for update;

  if not found then
    raise exception 'Permintaan % tidak ditemukan', p_nomor using errcode = 'P0002';
  elsif v_status is distinct from 'diajukan' then
    raise exception 'Permintaan ini sudah diproses sebelumnya.' using errcode = 'P0001';
  end if;

  select jsonb_agg(jsonb_build_object('product_id', d.obat_id, 'quantity', d.qty))
    into v_items
    from public.transaksi_detail d
   where d.transaksi_id = v_id;

  if v_items is not null then
    perform public.update_stock_atomic(v_items, 'keluar');
  end if;

  update public.transaksi
     set status = 'selesai',
         processed_at = now(),
         processed_by = (select auth.uid()),
         diskon = coalesce(p_diskon, diskon),
         total = coalesce(p_total, total),
         biaya_layanan = coalesce(p_biaya_layanan, biaya_layanan)
   where id = v_id;
end;
$$;

revoke execute on function public.process_stock_out_request(text, numeric, numeric, numeric) from public, anon;
grant execute on function public.process_stock_out_request(text, numeric, numeric, numeric) to authenticated;
