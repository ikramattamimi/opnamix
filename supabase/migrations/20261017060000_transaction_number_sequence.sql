-- ============================================================
-- Nomor transaksi dari sequence Postgres.
--
-- Sebelumnya nomor dibuat di browser (Date.now() + random 3 digit),
-- dan trigger generate_transaksi_nomor memakai COUNT(*) + 1 per hari.
-- Keduanya bisa bentrok kalau dua transaksi dibuat bersamaan.
--
-- Format baru: IN-YYYYMMDD-000123 / OUT-YYYYMMDD-000123
--   * tanggal mengikuti zona Asia/Jakarta
--   * angka di belakang dari satu sequence global, jadi selalu unik
--     (nextval tidak pernah memberi nilai yang sama, juga saat paralel)
--
-- Dipanggil dari lib/api.ts lewat
--   supabase.rpc('next_transaction_number', { p_tipe })
-- Nomor diambil sebelum transaksi disimpan karena dipakai juga untuk
-- nama file bukti stok masuk.
-- ============================================================

create sequence if not exists public.transaksi_nomor_seq;

grant usage on sequence public.transaksi_nomor_seq to authenticated, service_role;

create or replace function public.next_transaction_number(p_tipe text)
returns text
language plpgsql
volatile
security invoker
set search_path = public
as $$
begin
  if p_tipe is null or p_tipe not in ('masuk', 'keluar') then
    raise exception 'Tipe transaksi tidak valid: %', p_tipe using errcode = '22023';
  end if;

  return case p_tipe when 'masuk' then 'IN' else 'OUT' end
      || '-' || to_char(now() at time zone 'Asia/Jakarta', 'YYYYMMDD')
      || '-' || lpad(nextval('public.transaksi_nomor_seq')::text, 6, '0');
end;
$$;

revoke execute on function public.next_transaction_number(text) from public, anon;
grant execute on function public.next_transaction_number(text) to authenticated, service_role;

-- Insert tanpa nomor (mis. dari dashboard/SQL) juga memakai sequence
create or replace function public.generate_transaksi_nomor()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.nomor is null then
    new.nomor := public.next_transaction_number(coalesce(new.tipe, 'keluar'));
  end if;
  return new;
end;
$$;
