-- ============================================================
-- Seed untuk database lokal (`supabase db reset`) atau project baru.
--
-- Isi:
--   1. Data master awal (sama dengan migration seed_master_data di dev/prod)
--   2. Satu user admin awal
--
-- Role aplikasi berupa teks yang dibatasi CHECK constraint
-- ('admin', 'nakes', 'apoteker', 'farmasi'), tidak ada tabel role
-- terpisah. Role yang dipakai RLS diambil dari public.user_roles.
--
-- User admin lokal:
--   email    : admin@opnamix.local
--   password : SoKGyROqRXC_
-- HANYA untuk lokal/dev. Di project yang dipakai orang lain, buat admin
-- lewat dashboard Supabase (Authentication > Add user) lalu jalankan
-- bagian user_roles di bawah dengan id user tersebut, atau ganti
-- password ini segera setelah login.
-- ============================================================

-- ------------------------------------------------------------
-- Data master
-- ------------------------------------------------------------
insert into public.service_categories (id, name, code, description, is_active) values
  (1, 'Kehamilan', 'KEHAMILAN', 'Layanan seputar kehamilan', true),
  (2, 'Persalinan', 'PERSALINAN', 'Layanan persalinan', true),
  (3, 'Kesehatan Reproduksi', 'KESPRO', 'Layanan kesehatan reproduksi', true),
  (4, 'Nifas', 'NIFAS', 'Layanan pasca persalinan (nifas)', true),
  (5, 'Bayi/Balita', 'BAYI_BALITA', 'Layanan untuk bayi dan balita', true),
  (6, 'Berobat', 'BEROBAT', 'Layanan berobat umum', true)
on conflict (id) do nothing;

select setval('public.service_categories_id_seq', 6);

insert into public.master_jenis_obat (id, kode, nama_jenis, deskripsi, is_active) values
  (1, 'JO001', 'Tablet',   'Obat dalam bentuk tablet atau kaplet', true),
  (2, 'JO002', 'Kapsul',   'Obat dalam bentuk kapsul', true),
  (3, 'JO003', 'Sirup',    'Obat dalam bentuk cairan sirup', true),
  (4, 'JO004', 'Salep',    'Obat dalam bentuk salep atau krim', true),
  (5, 'JO005', 'Injeksi',  'Obat dalam bentuk injeksi atau suntik', true),
  (6, 'JO006', 'Tetes',    'Obat dalam bentuk tetes (mata, telinga, hidung)', true),
  (7, 'JO007', 'Inhaler',  'Obat dalam bentuk inhaler atau semprot', true),
  (8, 'JO008', 'Lainnya',  'Jenis obat lainnya', true)
on conflict (id) do nothing;

select setval('public.master_jenis_obat_id_seq', 8);

insert into public.master_satuan (id, kode, nama_satuan, deskripsi, is_active) values
  (1,  'SAT001', 'Strip',       'Strip berisi tablet/kapsul', true),
  (2,  'SAT002', 'Box',         'Kotak kemasan', true),
  (3,  'SAT003', 'Botol',       'Botol berisi sirup/cairan', true),
  (4,  'SAT004', 'Tube',        'Tube berisi salep/krim', true),
  (5,  'SAT005', 'Ampul',       'Ampul berisi cairan injeksi', true),
  (6,  'SAT006', 'Vial',        'Vial berisi cairan injeksi', true),
  (7,  'SAT007', 'Bungkus',     'Bungkus/sachet', true),
  (8,  'SAT008', 'Botol Tetes', 'Botol tetes mata/telinga', true),
  (9,  'SAT009', 'Pcs',         'Per piece/satuan', true),
  (10, 'SAT010', 'Inhaler',     'Inhaler utuh', true),
  (11, 'SAT011', 'Buah',        'Per buah', true)
on conflict (id) do nothing;

select setval('public.master_satuan_id_seq', 11);

-- ------------------------------------------------------------
-- User admin awal
-- Trigger on_auth_user_created otomatis membuat baris profiles.
-- ------------------------------------------------------------
do $$
declare
  v_user_id uuid := '00000000-0000-4000-8000-000000000001';
  v_email text := 'admin@opnamix.local';
begin
  if exists (select 1 from auth.users where email = v_email) then
    return;
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new
  ) values (
    '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
    v_email, extensions.crypt('SoKGyROqRXC_', extensions.gen_salt('bf')),
    now(), '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "Administrator", "role": "admin"}'::jsonb,
    now(), now(),
    '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, provider_id, provider, identity_data,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), v_user_id, v_user_id::text, 'email',
    jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true),
    now(), now(), now()
  );

  insert into public.user_roles (user_id, role) values (v_user_id, 'admin');
end $$;
