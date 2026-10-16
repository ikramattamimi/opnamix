-- ============================================================
-- finish_opname: selesaikan opname dalam satu transaksi.
--
-- Dipanggil dari lib/api.ts lewat
--   supabase.rpc('finish_opname', { p_opname_id })
--
-- * Baris opname dikunci FOR UPDATE dan harus masih
--   'sedang_dilaksanakan', jadi klik "Selesai" dua kali ditolak.
-- * Status tiap opname_detail: 'sesuai' kalau selisih 0, selain itu
--   'disesuaikan'. stok_final = stok_final atau stok_fisik.
-- * master_obat.qty ditimpa dengan stok_final. Aman karena stok
--   dikunci sejak opname aktif (20261017000000_opname_stock_lock),
--   sehingga stok_sistem tidak berubah selama opname. Flag
--   app.opname_finishing membuat trigger kunci stok melewatkan update ini.
-- * Semua langkah berhasil atau tidak sama sekali.
-- ============================================================

create or replace function public.finish_opname(p_opname_id bigint)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_status text;
  v_item record;
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

  update public.opname_detail
     set stok_final = coalesce(stok_final, stok_fisik),
         status = case when selisih = 0 then 'sesuai' else 'disesuaikan' end
   where opname_id = p_opname_id;

  perform set_config('app.opname_finishing', 'on', true);

  -- Berurutan per id obat supaya urutan lock konsisten (mencegah deadlock)
  for v_item in
    select d.obat_id, d.stok_final, m.nama
      from public.opname_detail d
      join public.master_obat m on m.id = d.obat_id
     where d.opname_id = p_opname_id
     order by d.obat_id, d.id
  loop
    if v_item.stok_final is null then
      raise exception 'Stok fisik % belum diisi', v_item.nama using errcode = '22023';
    end if;

    update public.master_obat
       set qty = v_item.stok_final
     where id = v_item.obat_id;

    if not found then
      raise exception 'Tidak punya akses mengubah stok %', v_item.nama using errcode = '42501';
    end if;
  end loop;

  perform set_config('app.opname_finishing', 'off', true);

  update public.opname
     set status = 'selesai',
         current_step = 3,
         completed_at = now()
   where id = p_opname_id;
end;
$$;

revoke execute on function public.finish_opname(bigint) from public, anon;
grant execute on function public.finish_opname(bigint) to authenticated;
