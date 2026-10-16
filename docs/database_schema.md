// Schema database Opnamix (DBML, bisa dibuka di dbdiagram.io)
//
// Sumber kebenaran: supabase/migrations/. File ini ringkasan dari
// 20260101000000_baseline.sql (diambil dari project dev 2026-10-16).
// Kalau ada migration baru yang mengubah tabel, perbarui juga file ini.
//
// User disimpan di auth.users (Supabase Auth). Profil di profiles,
// role yang dipakai RLS di user_roles. Status dan tipe berupa text,
// bukan enum Postgres.

Table auth.users {
  id uuid [pk]
  email text
}

Table profiles {
  id uuid [pk, ref: - auth.users.id]
  email text [unique, not null]
  full_name text
  role text [note: "admin | nakes | apoteker | farmasi (warisan, RLS memakai user_roles)"]
  avatar_url text
  created_at timestamptz
  updated_at timestamptz
}

Table user_roles {
  id uuid [pk]
  user_id uuid [not null, ref: > profiles.id]
  role text [not null, note: "admin | nakes | apoteker | farmasi"]
  created_at timestamptz
}

Table notifications {
  id bigint [pk]
  user_id uuid [ref: > auth.users.id]
  target_role text [note: "null = semua user"]
  type text [not null]
  title text [not null]
  message text [not null]
  data jsonb
  is_read boolean
  created_at timestamptz
}

Table service_categories {
  id integer [pk]
  name varchar [unique, not null]
  code varchar [unique, not null]
  description text
  is_active boolean
  created_at timestamptz
  updated_at timestamptz
}

Table master_jenis_obat {
  id bigint [pk]
  kode varchar [unique, not null]
  nama_jenis varchar [not null]
  deskripsi text
  is_active boolean
  created_at timestamptz
  updated_at timestamptz
  created_by uuid [ref: > auth.users.id]
  updated_by uuid [ref: > auth.users.id]
}

Table master_satuan {
  id bigint [pk]
  kode varchar [unique, not null]
  nama_satuan varchar [not null]
  deskripsi text
  is_active boolean
  created_at timestamptz
  updated_at timestamptz
  created_by uuid [ref: > auth.users.id]
  updated_by uuid [ref: > auth.users.id]
}

Table master_obat {
  id bigint [pk]
  kode text [unique, not null]
  nama text [not null]
  jenis text
  satuan text
  jenis_obat_id bigint [ref: > master_jenis_obat.id]
  satuan_id bigint [ref: > master_satuan.id]
  merek varchar
  kandungan text
  buffer_stok integer
  harga numeric
  qty integer [note: "diubah lewat update_stock_atomic / finish_opname"]
  is_active boolean
  created_at timestamptz
  created_by uuid
  updated_at timestamptz
  updated_by uuid
  deleted_at timestamptz
}

Table master_jasa {
  id bigint [pk]
  kode text [unique, not null]
  nama text [not null]
  harga numeric
  category_id integer [ref: > service_categories.id]
  is_active boolean
  created_at timestamptz
  created_by uuid
  updated_at timestamptz
  updated_by uuid
  deleted_at timestamptz
}

Table transaksi {
  id bigint [pk]
  nomor text [unique]
  tanggal timestamptz
  tipe text [note: "masuk | keluar"]
  tipe_sumber text [note: "PENGAJUAN_NAKES | KASIR_LANGSUNG | PEMBELIAN"]
  status text [note: "diajukan | selesai"]
  bukti text [note: "URL bukti di bucket bukti-stok-masuk"]
  nama_pasien text
  tanggal_lahir_pasien date
  nama_nakes text
  jasa_id bigint [ref: > master_jasa.id]
  keterangan text
  total numeric
  diskon numeric
  biaya_layanan numeric [not null]
  processed_by uuid
  processed_at timestamptz
  created_at timestamptz
  created_by uuid
  updated_at timestamptz
  updated_by uuid
  deleted_at timestamptz
}

Table transaksi_detail {
  id bigint [pk]
  transaksi_id bigint [not null, ref: > transaksi.id]
  transaksi_nomor text [ref: > transaksi.nomor]
  obat_id bigint [ref: > master_obat.id]
  qty integer [not null]
  expire_date date
  batch text
  harga numeric
  subtotal numeric
}

Table transaksi_jasa {
  id bigint [pk]
  transaksi_id bigint [not null, ref: > transaksi.id]
  transaksi_nomor text [ref: > transaksi.nomor]
  jasa_id bigint [not null, ref: > master_jasa.id]
  qty integer
  harga_jasa numeric
  subtotal numeric
  created_at timestamptz
  created_by uuid [ref: > auth.users.id]
  updated_at timestamptz
  updated_by uuid [ref: > auth.users.id]
  deleted_at timestamptz
}

Table opname_schedule {
  id bigint [pk]
  nama text [not null]
  tanggal_audit integer [note: "1-28"]
  waktu_jam smallint
  waktu_menit smallint
  pengulangan text
  durasi_pengerjaan integer
  obat_ids jsonb
  is_active boolean
  created_at timestamptz
  created_by uuid
  updated_at timestamptz
  updated_by uuid
  deleted_at timestamptz
}

Table opname {
  id bigint [pk]
  schedule_id bigint [ref: > opname_schedule.id]
  status text [note: "belum_dilaksanakan | sedang_dilaksanakan | selesai | dihapus"]
  current_step smallint [note: "1 pilih obat, 2 input fisik, 3 penyesuaian"]
  tanggal timestamptz
  tanggal_jadwal date
  selected_obat_ids jsonb
  obat_ids jsonb
  completed_at timestamptz
  created_at timestamptz
  created_by uuid
  updated_at timestamptz
  updated_by uuid
  deleted_at timestamptz
}

Table opname_detail {
  id bigint [pk]
  opname_id bigint [ref: > opname.id]
  obat_id bigint [ref: > master_obat.id]
  stok_sistem integer [note: "snapshot qty saat opname mulai"]
  stok_fisik integer
  selisih integer
  stok_final integer
  status text [note: "pending | sesuai | disesuaikan"]
  alasan text
  created_at timestamptz
  created_by uuid
  updated_at timestamptz
  updated_by uuid
  deleted_at timestamptz
}
