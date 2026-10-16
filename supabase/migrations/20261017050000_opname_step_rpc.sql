-- ============================================================
-- RPC untuk langkah-langkah opname (selain finish_opname).
--
--   complete_opname_step_one(p_opname_id, p_selected_obat_ids)
--   update_opname_selection(p_opname_id, p_selected_obat_ids)
--   backward_opname_to_step_one(p_opname_id, p_schedule_obat_ids)
--   save_opname_details(p_opname_id, p_step, p_updates)
--   resolve_opname_difference(p_detail_id, p_reason)
--
-- * Setiap RPC mengunci baris opname FOR UPDATE dan menolak opname
--   yang sudah selesai atau dihapus, sehingga tidak bentrok dengan
--   finish_opname.
-- * Snapshot stok_sistem diambil dari master_obat di database. Saat
--   opname menjadi aktif, trigger guard_opname_activation menunggu
--   transaksi stok yang sedang berjalan, jadi snapshot tidak basi.
-- * selisih dihitung di database dari stok_sistem, bukan dari nilai
--   yang dibaca lalu ditulis ulang oleh client.
-- * selected_obat_ids / obat_ids disimpan apa adanya (array JSON dari
--   client, biasanya string id) seperti sebelumnya.
-- ============================================================

-- Helper: kunci opname dan pastikan masih bisa diubah
create or replace function public.lock_editable_opname(p_opname_id bigint)
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_status text;
begin
  if not public.is_staff() then
    raise exception 'Tidak punya akses mengubah opname' using errcode = '42501';
  end if;

  select status into v_status
    from public.opname
   where id = p_opname_id
     and deleted_at is null
     for update;

  if not found then
    raise exception 'Opname OPN-% tidak ditemukan', p_opname_id using errcode = 'P0002';
  elsif v_status in ('selesai', 'dihapus') then
    raise exception 'Opname OPN-% sudah % dan tidak dapat diubah', p_opname_id, v_status using errcode = 'P0001';
  end if;

  return v_status;
end;
$$;

-- Helper: ganti semua opname_detail dengan snapshot stok terbaru
create or replace function public.replace_opname_details(p_opname_id bigint, p_obat_ids jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_obat_ids is null or jsonb_typeof(p_obat_ids) <> 'array' then
    raise exception 'Daftar obat opname tidak valid' using errcode = '22023';
  end if;

  delete from public.opname_detail where opname_id = p_opname_id;

  insert into public.opname_detail (opname_id, obat_id, stok_sistem, stok_fisik, selisih, status)
  select p_opname_id,
         m.id,
         coalesce(m.qty, 0),
         0,
         0 - coalesce(m.qty, 0),
         'pending'
    from public.master_obat m
   where m.id in (
     select (e #>> '{}')::bigint from jsonb_array_elements(p_obat_ids) e
   )
   order by m.id;
end;
$$;

-- Langkah 1 -> 2: opname menjadi aktif (stok terkunci) dan snapshot dibuat
create or replace function public.complete_opname_step_one(p_opname_id bigint, p_selected_obat_ids jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  perform public.lock_editable_opname(p_opname_id);

  if p_selected_obat_ids is null or jsonb_typeof(p_selected_obat_ids) <> 'array'
     or jsonb_array_length(p_selected_obat_ids) = 0 then
    raise exception 'Pilih minimal satu obat untuk opname' using errcode = '22023';
  end if;

  -- Ubah status dulu: trigger guard_opname_activation menunggu transaksi
  -- stok yang berjalan selesai, baru snapshot diambil.
  update public.opname
     set selected_obat_ids = p_selected_obat_ids,
         status = 'sedang_dilaksanakan',
         current_step = 2
   where id = p_opname_id;

  perform public.replace_opname_details(p_opname_id, p_selected_obat_ids);
end;
$$;

-- Ganti pilihan obat opname yang sedang berjalan
create or replace function public.update_opname_selection(p_opname_id bigint, p_selected_obat_ids jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  perform public.lock_editable_opname(p_opname_id);

  update public.opname
     set selected_obat_ids = p_selected_obat_ids,
         obat_ids = p_selected_obat_ids,
         current_step = 2
   where id = p_opname_id;

  perform public.replace_opname_details(p_opname_id, p_selected_obat_ids);
end;
$$;

-- Kembali ke langkah 1: snapshot dihapus dan kunci stok dilepas
create or replace function public.backward_opname_to_step_one(p_opname_id bigint, p_schedule_obat_ids jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  perform public.lock_editable_opname(p_opname_id);

  delete from public.opname_detail where opname_id = p_opname_id;

  update public.opname
     set current_step = 1,
         status = 'belum_dilaksanakan',
         selected_obat_ids = p_schedule_obat_ids
   where id = p_opname_id;
end;
$$;

-- Simpan input opname (stok fisik, stok final, alasan) sekaligus.
-- p_step null => current_step tidak diubah.
-- p_updates: [{ detail_id, physical_stock?, stok_final?, reason? }]
-- Key yang tidak dikirim tidak diubah.
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
           e->>'reason' as alasan
      from jsonb_array_elements(p_updates) e
  )
  update public.opname_detail d
     set stok_fisik = case when u.has_fisik then u.stok_fisik else d.stok_fisik end,
         selisih = case when u.has_fisik then u.stok_fisik - d.stok_sistem else d.selisih end,
         status = case
                    when u.has_fisik then case when u.stok_fisik - d.stok_sistem = 0 then 'sesuai' else 'pending' end
                    else d.status
                  end,
         stok_final = case when u.has_final then u.stok_final else d.stok_final end,
         alasan = case when u.has_reason then u.alasan else d.alasan end
    from u
   where d.id = u.detail_id
     and d.opname_id = p_opname_id;

  get diagnostics v_updated = row_count;

  if v_updated <> v_expected then
    raise exception 'Sebagian detail tidak termasuk opname OPN-%', p_opname_id using errcode = '22023';
  end if;
end;
$$;

-- Tandai selisih sudah disesuaikan beserta alasannya
create or replace function public.resolve_opname_difference(p_detail_id bigint, p_reason text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_opname_id bigint;
begin
  select opname_id into v_opname_id
    from public.opname_detail
   where id = p_detail_id;

  if not found then
    raise exception 'Detail opname tidak ditemukan' using errcode = 'P0002';
  end if;

  perform public.lock_editable_opname(v_opname_id);

  update public.opname_detail
     set status = 'disesuaikan',
         alasan = p_reason
   where id = p_detail_id;
end;
$$;

do $$
declare
  f text;
begin
  foreach f in array array[
    'public.lock_editable_opname(bigint)',
    'public.replace_opname_details(bigint, jsonb)',
    'public.complete_opname_step_one(bigint, jsonb)',
    'public.update_opname_selection(bigint, jsonb)',
    'public.backward_opname_to_step_one(bigint, jsonb)',
    'public.save_opname_details(bigint, smallint, jsonb)',
    'public.resolve_opname_difference(bigint, text)'
  ]
  loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
