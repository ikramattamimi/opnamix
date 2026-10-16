-- ============================================================
-- update_pending_stock_out_request: edit permintaan stok keluar yang
-- masih 'diajukan' dalam satu transaksi.
--
-- Dipanggil dari lib/api.ts lewat
--   supabase.rpc('update_pending_stock_out_request', { p_nomor, p_payload })
--
-- p_payload:
--   { tanggal, nama_pasien, tanggal_lahir_pasien, nama_nakes, total,
--     diskon, biaya_layanan,
--     items: [{ product_id, quantity, price }],
--     services: [{ service_id, price }] }
--
-- * Baris transaksi dikunci FOR UPDATE; ditolak kalau status sudah
--   bukan 'diajukan' (mis. baru saja diproses di tab lain).
-- * Header diganti, lalu item dan jasa dihapus dan di-insert ulang.
--   Kalau ada langkah yang gagal, semuanya batal, jadi tidak ada item
--   yang hilang atau dobel.
-- * SECURITY INVOKER: nakes hanya bisa mengedit permintaan miliknya.
-- ============================================================

create or replace function public.update_pending_stock_out_request(p_nomor text, p_payload jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_id bigint;
  v_status text;
begin
  select id, status into v_id, v_status
    from public.transaksi
   where nomor = p_nomor
     and deleted_at is null;

  if not found then
    raise exception 'Permintaan tidak ditemukan.' using errcode = 'P0002';
  end if;

  -- Baca ulang dengan lock. Bagi nakes, baris yang sudah diproses tidak
  -- lolos policy UPDATE, jadi bisa "tidak ditemukan" di sini.
  if v_status = 'diajukan' then
    select status into v_status
      from public.transaksi
     where id = v_id
       for update;

    if not found then
      raise exception 'Tidak punya akses mengedit permintaan ini.' using errcode = '42501';
    end if;
  end if;

  if v_status is distinct from 'diajukan' then
    raise exception 'Permintaan yang sudah diproses tidak dapat diedit.' using errcode = 'P0001';
  end if;

  update public.transaksi
     set tanggal = coalesce(nullif(p_payload->>'tanggal', '')::timestamptz, tanggal),
         nama_pasien = p_payload->>'nama_pasien',
         tanggal_lahir_pasien = nullif(p_payload->>'tanggal_lahir_pasien', '')::date,
         nama_nakes = nullif(p_payload->>'nama_nakes', ''),
         total = coalesce((p_payload->>'total')::numeric, 0),
         diskon = coalesce((p_payload->>'diskon')::numeric, 0),
         biaya_layanan = coalesce((p_payload->>'biaya_layanan')::numeric, 0)
   where id = v_id;

  delete from public.transaksi_detail where transaksi_id = v_id;
  delete from public.transaksi_jasa where transaksi_id = v_id;

  perform public.insert_transaksi_items(v_id, p_nomor, p_payload->'items', p_payload->'services');
end;
$$;

revoke execute on function public.update_pending_stock_out_request(text, jsonb) from public, anon;
grant execute on function public.update_pending_stock_out_request(text, jsonb) to authenticated;
