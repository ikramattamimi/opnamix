-- ============================================================
-- Produk: sediaan, isi kemasan, dan kandungan banyak zat (Fase 3a redesain)
--
-- * master_obat.sediaan     : bentuk sediaan obat (Tablet, Kapsul, Sirup, …)
-- * master_obat.isi_kemasan : isi per kemasan, opsional (mis. "60 ml")
-- * product_ingredients     : satu baris per zat aktif, kekuatan opsional,
--                             urutan sesuai input. Dipilih tabel terpisah
--                             (bukan jsonb) supaya saran nama zat dan
--                             pencarian per zat bisa memakai indeks.
-- * master_obat.kandungan tetap ada sebagai ringkasan teks
--   ("Paracetamol 500 mg, Kafein 50 mg") untuk pencarian dan tampilan di
--   fitur lain; diisi ulang oleh save_product_ingredients.
-- * merek kini boleh diisi untuk semua kategori (kolomnya sudah ada).
--
-- Kandungan lama dipecah per koma/titik koma, dan angka di akhir dianggap
-- kekuatan ("Paracetamol 500mg" -> zat "Paracetamol", kekuatan "500mg").
-- ============================================================

alter table public.master_obat
  add column if not exists sediaan text,
  add column if not exists isi_kemasan text;

create table if not exists public.product_ingredients (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.master_obat (id) on delete cascade,
  nama_zat text not null check (length(btrim(nama_zat)) > 0),
  kekuatan text,
  urutan smallint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists product_ingredients_product_idx
  on public.product_ingredients (product_id, urutan);
create index if not exists product_ingredients_nama_idx
  on public.product_ingredients (lower(nama_zat));

alter table public.product_ingredients enable row level security;

create policy "authenticated can read" on public.product_ingredients
  for select to authenticated using (true);
create policy "staff can insert" on public.product_ingredients
  for insert to authenticated with check ((select public.is_staff()));
create policy "staff can update" on public.product_ingredients
  for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "staff can delete" on public.product_ingredients
  for delete to authenticated using ((select public.is_staff()));

-- Isi awal dari kolom kandungan lama
insert into public.product_ingredients (product_id, nama_zat, kekuatan, urutan)
select
  o.id,
  coalesce(nullif(btrim(m.parts[1]), ''), btrim(part.txt)),
  nullif(btrim(m.parts[2]), ''),
  (part.ord - 1)::smallint
from public.master_obat o
cross join lateral regexp_split_to_table(o.kandungan, '\s*[,;]\s*') with ordinality as part(txt, ord)
left join lateral (select regexp_match(btrim(part.txt), '^(.*?)\s+(\d.*)$') as parts) m on true
where o.kandungan is not null
  and btrim(part.txt) <> ''
  and not exists (select 1 from public.product_ingredients pi where pi.product_id = o.id);

-- Ganti seluruh kandungan satu produk dalam satu transaksi, lalu perbarui
-- ringkasan teks di master_obat.kandungan.
-- p_items: [{"nama_zat": "Paracetamol", "kekuatan": "500 mg"}, ...]
create or replace function public.save_product_ingredients(p_product_id bigint, p_items jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array' then
    raise exception 'p_items harus berupa array';
  end if;

  delete from public.product_ingredients where product_id = p_product_id;

  insert into public.product_ingredients (product_id, nama_zat, kekuatan, urutan)
  select
    p_product_id,
    btrim(item ->> 'nama_zat'),
    nullif(btrim(coalesce(item ->> 'kekuatan', '')), ''),
    (ord - 1)::smallint
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) with ordinality as t(item, ord)
  where btrim(coalesce(item ->> 'nama_zat', '')) <> '';

  update public.master_obat
  set kandungan = (
    select nullif(string_agg(nama_zat || coalesce(' ' || kekuatan, ''), ', ' order by urutan), '')
    from public.product_ingredients
    where product_id = p_product_id
  )
  where id = p_product_id;
end;
$$;

revoke execute on function public.save_product_ingredients(bigint, jsonb) from public, anon;
grant execute on function public.save_product_ingredients(bigint, jsonb) to authenticated;
