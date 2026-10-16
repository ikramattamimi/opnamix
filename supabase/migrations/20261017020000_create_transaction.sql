-- ============================================================
-- create_transaction: simpan transaksi stok masuk/keluar dalam satu
-- transaksi database.
--
-- Dipanggil dari lib/api.ts lewat
--   supabase.rpc('create_transaction', { p_payload })
--
-- p_payload:
--   { nomor, tanggal, tipe, tipe_sumber, status, nama_pasien,
--     tanggal_lahir_pasien, keterangan, bukti, total, diskon,
--     biaya_layanan, nama_nakes,
--     items:    [{ product_id, quantity, price, batch, expiry_date }],
--     services: [{ service_id, price }] }
--
-- * Header, transaksi_detail, dan transaksi_jasa di-insert bersama.
--   Kalau status 'selesai', stok diubah lewat update_stock_atomic di
--   transaksi yang sama. Stok tidak cukup / opname aktif => semua batal,
--   tidak ada baris transaksi yatim.
-- * created_by diambil dari auth.uid(), bukan dari client.
-- * SECURITY INVOKER: tetap tunduk pada RLS (nakes hanya boleh membuat
--   permintaan 'diajukan' miliknya sendiri).
-- ============================================================

-- Helper: insert item obat dan jasa untuk satu transaksi.
-- Dipakai juga oleh update_pending_stock_out_request.
create or replace function public.insert_transaksi_items(
  p_transaksi_id bigint,
  p_nomor text,
  p_items jsonb,
  p_services jsonb
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_items is not null and jsonb_typeof(p_items) <> 'array' then
    raise exception 'Daftar item tidak valid' using errcode = '22023';
  end if;

  if p_services is not null and jsonb_typeof(p_services) <> 'array' then
    raise exception 'Daftar jasa tidak valid' using errcode = '22023';
  end if;

  if exists (
    select 1
      from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) e
     where (e->>'product_id') is null
        or coalesce((e->>'quantity')::integer, 0) <= 0
  ) then
    raise exception 'Item stok tidak valid' using errcode = '22023';
  end if;

  if exists (
    select 1
      from jsonb_array_elements(coalesce(p_services, '[]'::jsonb)) e
     where (e->>'service_id') is null
  ) then
    raise exception 'Item jasa tidak valid' using errcode = '22023';
  end if;

  insert into public.transaksi_detail
    (transaksi_id, transaksi_nomor, obat_id, qty, harga, subtotal, batch, expire_date)
  select p_transaksi_id,
         p_nomor,
         (e->>'product_id')::bigint,
         (e->>'quantity')::integer,
         coalesce((e->>'price')::numeric, 0),
         (e->>'quantity')::integer * coalesce((e->>'price')::numeric, 0),
         coalesce(nullif(e->>'batch', ''), '-'),
         nullif(e->>'expiry_date', '')::date
    from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) e;

  insert into public.transaksi_jasa
    (transaksi_id, transaksi_nomor, jasa_id, qty, harga_jasa, subtotal)
  select p_transaksi_id,
         p_nomor,
         (e->>'service_id')::bigint,
         1,
         coalesce((e->>'price')::numeric, 0),
         coalesce((e->>'price')::numeric, 0)
    from jsonb_array_elements(coalesce(p_services, '[]'::jsonb)) e;
end;
$$;

revoke execute on function public.insert_transaksi_items(bigint, text, jsonb, jsonb) from public, anon;
grant execute on function public.insert_transaksi_items(bigint, text, jsonb, jsonb) to authenticated;

create or replace function public.create_transaction(p_payload jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tipe text := p_payload->>'tipe';
  v_status text := p_payload->>'status';
  v_items jsonb := coalesce(p_payload->'items', '[]'::jsonb);
  v_id bigint;
  v_nomor text;
begin
  if (select auth.uid()) is null then
    raise exception 'Harus login untuk membuat transaksi' using errcode = '42501';
  end if;

  if v_tipe is null or v_tipe not in ('masuk', 'keluar') then
    raise exception 'Tipe transaksi tidak valid: %', v_tipe using errcode = '22023';
  end if;

  if v_status is null or v_status not in ('diajukan', 'selesai') then
    raise exception 'Status transaksi tidak valid: %', v_status using errcode = '22023';
  end if;

  insert into public.transaksi (
    nomor, tanggal, tipe, tipe_sumber, status, nama_pasien,
    tanggal_lahir_pasien, keterangan, bukti, total, diskon,
    biaya_layanan, nama_nakes, created_by
  ) values (
    nullif(p_payload->>'nomor', ''),
    coalesce(nullif(p_payload->>'tanggal', '')::timestamptz, now()),
    v_tipe,
    p_payload->>'tipe_sumber',
    v_status,
    coalesce(nullif(p_payload->>'nama_pasien', ''), '-'),
    nullif(p_payload->>'tanggal_lahir_pasien', '')::date,
    coalesce(p_payload->>'keterangan', ''),
    nullif(p_payload->>'bukti', ''),
    coalesce((p_payload->>'total')::numeric, 0),
    coalesce((p_payload->>'diskon')::numeric, 0),
    coalesce((p_payload->>'biaya_layanan')::numeric, 0),
    nullif(p_payload->>'nama_nakes', ''),
    (select auth.uid())
  )
  returning id, nomor into v_id, v_nomor;

  perform public.insert_transaksi_items(v_id, v_nomor, v_items, p_payload->'services');

  if v_status = 'selesai' and jsonb_array_length(v_items) > 0 then
    perform public.update_stock_atomic(v_items, v_tipe);
  end if;

  return jsonb_build_object('id', v_id, 'nomor', v_nomor);
end;
$$;

revoke execute on function public.create_transaction(jsonb) from public, anon;
grant execute on function public.create_transaction(jsonb) to authenticated;
