Table users {
  id int [PK]
  username varchar [unique]
  full_name varchar
  email varchar [unique]
  password_hash varchar
  role enum
  is_active boolean
  created_at timestamp
  updated_at timestamp
  deleted_at timestamp [null]
}

Table master_obat {
  id int [PK]
  kode varchar [unique]
  nama varchar
  jenis varchar
  satuan varchar
  buffer_stok int
  harga decimal
  qty int
  is_active boolean
  created_at timestamp
  updated_at timestamp
  deleted_at timestamp [null]
  created_by int
  updated_by int
}

Table master_jasa {
  id int [PK]
  kode varchar [unique]
  nama varchar
  harga decimal
  is_active boolean
  created_at timestamp
  updated_at timestamp
  deleted_at timestamp [null]
  created_by int
  updated_by int
}

Table transaksi {
  nomor varchar [PK]
  tanggal timestamp
  tipe enum
  bukti varchar [null]
  nama_pasien varchar [null]
  tipe_sumber enum
  keterangan text [null]
  status enum
  total decimal
  created_at timestamp
  updated_at timestamp
  deleted_at timestamp [null]
  created_by int
  processed_by int [null]
  processed_at timestamp [null]
}

Table transaksi_detail {
  id int [PK]
  transaksi_nomor varchar
  obat_id int
  qty int
  harga decimal
  subtotal decimal
  expire_date date [null]
  batch varchar [null]
  created_at timestamp
  updated_at timestamp
}

Table transaksi_jasa {
  id int [PK]
  transaksi_nomor varchar
  jasa_id int
  harga_jasa decimal
  created_at timestamp
}

Table opname_schedule {
  id int [PK]
  nama varchar
  tanggal_audit int
  waktu_jam int
  waktu_menit int
  pengulangan enum
  obat_ids json [null]
  is_active boolean
  created_at timestamp
  updated_at timestamp
  deleted_at timestamp [null]
  created_by int
  updated_by int
}

Table opname {
  id int [PK]
  schedule_id int [null]
  tanggal_jadwal date
  status enum
  created_at timestamp
  updated_at timestamp
  deleted_at timestamp [null]
  created_by int
}

Table opname_detail {
  id int [PK]
  opname_id int
  obat_id int
  stok_sistem int
  stok_fisik int [null]
  selisih int [null]
  status enum
  alasan text [null]
  created_at timestamp
  updated_at timestamp
  updated_by int [null]
}

Ref: users.id - master_obat.created_by
Ref: users.id - master_obat.updated_by
Ref: users.id - master_jasa.created_by
Ref: users.id - master_jasa.updated_by
Ref: users.id - transaksi.created_by
Ref: users.id - transaksi.processed_by
Ref: users.id - opname_schedule.created_by
Ref: users.id - opname_schedule.updated_by
Ref: users.id - opname.created_by
Ref: users.id - opname_detail.updated_by

Ref: master_obat.id - transaksi_detail.obat_id
Ref: master_jasa.id - transaksi_jasa.jasa_id
Ref: master_obat.id - opname_detail.obat_id

Ref: transaksi.nomor - transaksi_detail.transaksi_nomor
Ref: transaksi.nomor - transaksi_jasa.transaksi_nomor

Ref: opname_schedule.id - opname.schedule_id
Ref: opname.id - opname_detail.opname_id

