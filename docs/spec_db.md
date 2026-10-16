# User Scenario - Aplikasi Inventory Obat

## Daftar Isi

1. [Modul Stok Obat](#1-modul-stok-obat)
2. [Modul Stok Opname](#2-modul-stok-opname)
3. [Modul Laporan dan Analisis](#3-modul-laporan-dan-analisis)
4. [Data Model](#4-data-model)

---

# 1. Modul Stok Obat

## 1.1 Master Data Produk Obat

### SC-001: Admin Membuat Data Master Produk Obat

| Aspek                | Detail                                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **User**             | Admin Farmasi                                                                                                                        |
| **Scenario**         | Admin membuat data master produk obat                                                                                                |
| **Scenario Details** | 1. Admin input nama produk<br>2. Admin input jenis produk<br>3. Admin mengaktifkan Status Obat<br>4. Admin input jumlah buffer stock |
| **Data Requirement** | ID, Nama Obat, Jenis Obat, Status, Satuan, Buffer Stok, Harga                                                                        |
| **Notes**            | Data obat unique                                                                                                                     |

**Tabel Terkait:** `master_obat`

| Kolom         | Mapping Data Requirement                           |
| ------------- | -------------------------------------------------- |
| `id`          | ID                                                 |
| `kode`        | Unique identifier (dari Notes: "Data obat unique") |
| `nama`        | Nama Obat                                          |
| `jenis`       | Jenis Obat                                         |
| `satuan`      | Satuan                                             |
| `buffer_stok` | Buffer Stok                                        |
| `harga`       | Harga                                              |
| `qty`         | Jumlah stok saat ini                               |
| `is_active`   | Status (Aktif/Non-Aktif)                           |

---

### SC-002: Admin Mengubah Data Master Produk Obat

| Aspek        | Detail                                    |
| ------------ | ----------------------------------------- |
| **User**     | Admin Farmasi                             |
| **Scenario** | Admin mengubah data master produk obat    |
| **Notes**    | Dapat mengubah status, buffer stok, harga |

**Tabel Terkait:** `master_obat`

**Kolom yang bisa diubah:** `is_active`, `buffer_stok`, `harga`

---

### SC-003: Admin Menghapus Data Produk Obat

| Aspek        | Detail                                               |
| ------------ | ---------------------------------------------------- |
| **User**     | Admin Farmasi                                        |
| **Scenario** | Admin menghapus data produk obat                     |
| **Notes**    | Hanya dapat menghapus data dengan status "Non-Aktif" |

**Tabel Terkait:** `master_obat`

**Logic:** Soft delete - `UPDATE master_obat SET deleted_at = NOW() WHERE is_active = false`

> **Note:** Semua operasi delete menggunakan soft delete (kolom `deleted_at`) untuk menjaga integritas referensi data historis.

---

## 1.2 Master Data Jasa

### SC-004: Admin Membuat Data Master Jasa

| Aspek                | Detail                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------ |
| **User**             | Admin Farmasi                                                                              |
| **Scenario**         | Admin membuat data master jasa                                                             |
| **Scenario Details** | 1. Admin input nama jasa<br>2. Admin input harga jasa<br>3. Admin mengaktifkan status jasa |
| **Data Requirement** | ID, Nama Jasa, Harga Jasa, Status                                                          |

**Tabel Terkait:** `master_jasa`

| Kolom       | Mapping Data Requirement |
| ----------- | ------------------------ |
| `id`        | ID                       |
| `kode`      | Unique identifier        |
| `nama`      | Nama Jasa                |
| `harga`     | Harga Jasa               |
| `is_active` | Status (Aktif/Non-Aktif) |

---

### SC-005: Admin Mengubah Data Master Jasa

| Aspek        | Detail                          |
| ------------ | ------------------------------- |
| **User**     | Admin Farmasi                   |
| **Scenario** | Admin mengubah data master jasa |

**Tabel Terkait:** `master_jasa`

---

### SC-006: Admin Menghapus Data Master Jasa

| Aspek        | Detail                                               |
| ------------ | ---------------------------------------------------- |
| **User**     | Admin Farmasi                                        |
| **Scenario** | Admin menghapus data master jasa                     |
| **Notes**    | Hanya dapat menghapus data dengan status "Non-Aktif" |

**Tabel Terkait:** `master_jasa`

**Logic:** Soft delete - `UPDATE master_jasa SET deleted_at = NOW() WHERE is_active = false`

---

## 1.3 Stok Masuk

### SC-007: Admin Mengisi Formulir Stok Masuk

| Aspek                | Detail                                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------------------------- |
| **User**             | Admin Farmasi                                                                                            |
| **Scenario**         | Admin mengisi formulir stok masuk dengan data stok obat sudah terdaftar di master data                   |
| **Scenario Details** | 1. Admin memilih nama produk obat<br>2. Admin input jumlah stok yang masuk<br>3. Admin upload bukti nota |
| **Data Requirement** | ID, Nama Obat, Jenis Obat, Expire, Tanggal Masuk, Quantity, Bukti                                        |
| **Notes**            | - Tanggal auto generated<br>- Nama Obat dan Jenis Obat diambil dari menu master data<br>- Bukti Nullable |

**Tabel Terkait:** `transaksi`, `transaksi_detail`, `master_obat`

| Kolom         | Tabel            | Mapping Data Requirement      |
| ------------- | ---------------- | ----------------------------- |
| `nomor`       | transaksi        | ID (auto generate)            |
| `tanggal`     | transaksi        | Tanggal Masuk (auto generate) |
| `tipe`        | transaksi        | 'masuk'                       |
| `bukti`       | transaksi        | Bukti (nullable)              |
| `obat_id`     | transaksi_detail | Nama Obat (FK ke master_obat) |
| `qty`         | transaksi_detail | Quantity                      |
| `expire_date` | transaksi_detail | Expire                        |
| `batch`       | transaksi_detail | Batch number                  |

**Flow:**

1. INSERT `transaksi` (tipe='masuk')
2. INSERT `transaksi_detail` (obat, qty, expire, batch)
3. UPDATE `master_obat` SET qty = qty + detail.qty WHERE id = detail.obat_id

---

### SC-008: Admin Menambahkan Data Obat Saat Stok Masuk

| Aspek                | Detail                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **User**             | Admin Farmasi                                                                                                                   |
| **Scenario**         | Admin ingin menambahkan data obat saat akan mencatat stok masuk                                                                 |
| **Scenario Details** | 1. Admin menekan button "Master Data Obat"<br>2. Sistem menampilkan modal formulir Master Data Obat<br>3. Admin input data obat |
| **Data Requirement** | ID, Nama Obat, Jenis Obat, Status, Satuan, Buffer Stok, Harga                                                                   |

**Tabel Terkait:** `master_obat`

**Note:** Sama dengan SC-001, tapi diakses via modal di halaman Stok Masuk

---

## 1.4 Formulir Permintaan Obat

### SC-009: Nakes Membuat Permintaan Obat

| Aspek                | Detail                                                                                                                                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User**             | Nakes                                                                                                                                                                                                      |
| **Scenario**         | Nakes ingin memberi tahu Admin Farmasi terkait kebutuhan obat seorang pasien                                                                                                                               |
| **Scenario Details** | 1. Nakes menambahkan formulir permintaan obat<br>2. Nakes menambahkan informasi nama Pasien<br>3. Nakes menambahkan obat yang dibutuhkan                                                                   |
| **Data Requirement** | ID, Nomor Formulir, Nama Pasien, Jasa, Nama Nakes, Status, Nama Obat, Quantity, Satuan, Harga, Total Harga                                                                                                 |
| **Notes**            | - Jasa diambil dari Master Data Jasa<br>- Tanggal auto generate<br>- Nama Nakes diambil langsung dari nama akun<br>- Status: Diajukan, Selesai<br>- Nama Obat, Satuan, Harga diambil dari Master Data Obat |

**Tabel Terkait:** `transaksi`, `transaksi_detail`

| Kolom         | Tabel            | Mapping Data Requirement                        |
| ------------- | ---------------- | ----------------------------------------------- |
| `nomor`       | transaksi        | Nomor Formulir                                  |
| `tanggal`     | transaksi        | Tanggal (auto generate)                         |
| `tipe`        | transaksi        | 'keluar'                                        |
| `nama_pasien` | transaksi        | Nama Pasien                                     |
| `tipe_sumber` | transaksi        | Asal transaksi (PENGAJUAN_NAKES/KASIR_LANGSUNG) |
| `keterangan`  | transaksi        | Keterangan (nullable, untuk SC-011)             |
| `created_by`  | transaksi        | Nama Nakes (FK ke users)                        |
| `status`      | transaksi        | Status (Diajukan/Selesai)                       |
| `total`       | transaksi        | Total Harga                                     |
| `obat_id`     | transaksi_detail | Nama Obat (FK ke master_obat)                   |
| `qty`         | transaksi_detail | Quantity                                        |
| `harga`       | transaksi_detail | Harga                                           |
| `subtotal`    | transaksi_detail | Harga × Quantity                                |
| `jasa_id`     | transaksi_jasa   | FK ke master_jasa (many-to-many)                |
| `harga_jasa`  | transaksi_jasa   | Snapshot harga jasa saat transaksi              |

> **Note:** Relasi transaksi ↔ jasa adalah **many-to-many** melalui tabel `transaksi_jasa`.
>
> - `tipe_sumber = 'PENGAJUAN_NAKES'` → Transaksi dari Nakes (SC-009)
> - `tipe_sumber = 'KASIR_LANGSUNG'` → Transaksi langsung dari Admin (SC-011)

**Flow:**

1. INSERT `transaksi` (tipe='keluar', status='diajukan', tipe_sumber='PENGAJUAN_NAKES')
2. INSERT `transaksi_detail` (obat, qty, harga)
3. INSERT `transaksi_jasa` (transaksi_id, jasa_id, harga_jasa)

---

## 1.5 Stok Keluar

### SC-010: Admin Proses Permintaan Obat

| Aspek                | Detail                                                                                                                                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User**             | Admin Farmasi                                                                                                                                                                                                                                           |
| **Scenario**         | Admin melakukan transaksi obat keluar dari Formulir Permintaan Obat dari Nakes                                                                                                                                                                          |
| **Scenario Details** | 1. Sistem memunculkan notifikasi Permintaan Obat<br>2. Admin mengakses halaman Formulir Permintaan Obat<br>3. Admin menekan button "Proses Permintaan"<br>4. Setelah admin menekan button "Proses Permintaan" Status formulir berubah menjadi "Selesai" |
| **Data Requirement** | ID, Nomor Formulir, Tanggal, Nama Pasien, Jasa, Nama Nakes, Status, Nama Obat, Quantity, Satuan, Harga, Total Harga                                                                                                                                     |
| **Notes**            | - Status berubah dari Diajukan menjadi Selesai<br>- Admin bisa edit setelah selesai                                                                                                                                                                     |

**Tabel Terkait:** `transaksi`, `transaksi_detail`, `master_obat`

**Flow:**

1. UPDATE `transaksi` SET status='selesai', processed_by=admin_id, processed_at=NOW()
2. UPDATE `master_obat` SET qty = qty - detail.qty WHERE id = detail.obat_id

---

### SC-011: Admin Stok Keluar Tanpa Formulir

| Aspek                | Detail                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------- |
| **User**             | Admin Farmasi                                                                                                 |
| **Scenario**         | Admin melakukan transaksi obat keluar tanpa Formulir Permintaan                                               |
| **Scenario Details** | 1. Admin menekan button "Tanpa Formulir"<br>2. Sistem menampilkan Formulir<br>3. Admin input data di Formulir |
| **Data Requirement** | ID, Nomor Formulir, Tanggal, Nama Pasien, Keterangan, Nama Obat, Quantity, Satuan, Harga, Total Harga         |

**Tabel Terkait:** `transaksi`, `transaksi_detail`, `master_obat`

**Kolom transaksi:** Lihat SC-009

**Perbedaan dengan SC-009:**

- `jasa_id` = NULL (tidak pakai jasa)
- `keterangan` = terisi (alasan keluar)
- `status` = 'selesai' (langsung selesai)

---

### SC-012: Admin Edit Data Stok Keluar

| Aspek        | Detail                                                       |
| ------------ | ------------------------------------------------------------ |
| **User**     | Admin Farmasi                                                |
| **Scenario** | Admin Edit data Stok Keluar                                  |
| **Notes**    | Admin bisa edit data stok keluar yang sudah status 'selesai' |

**Tabel Terkait:** `transaksi`, `transaksi_detail`, `master_obat`

**Flow (Rollback & Re-apply):**

1. Rollback stok lama: `UPDATE master_obat SET qty = qty + old_detail.qty WHERE id = old_detail.obat_id`
2. UPDATE `transaksi_detail` dengan data baru
3. Apply stok baru: `UPDATE master_obat SET qty = qty - new_detail.qty WHERE id = new_detail.obat_id`
4. UPDATE `transaksi` SET updated_at=NOW(), updated_by=admin_id

---

# 2. Modul Stok Opname

## 2.1 Pengaturan Audit

### SC-013: Admin Menambah Pengaturan Audit

| Aspek                | Detail                                                                                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User**             | Admin Farmasi                                                                                                                                            |
| **Scenario**         | Admin Menambah Pengaturan                                                                                                                                |
| **Scenario Details** | 1. Admin input pengaturan audit baru                                                                                                                     |
| **Data Requirement** | Tipe Audit, Daftar Obat, Waktu, Status                                                                                                                   |
| **Notes**            | - Status: Aktif dan Non aktif<br>- Tipe Audit: Bulanan<br>- Daftar Obat: Bisa beberapa obat/pilih semua obat<br>- Waktu: Sebulan sekali (Tanggal berapa) |

**Tabel Terkait:** `opname_schedule`

| Kolom           | Mapping Data Requirement                        |
| --------------- | ----------------------------------------------- |
| `id`            | ID                                              |
| `nama`          | Nama pengaturan audit                           |
| `tanggal_audit` | Tanggal pelaksanaan (1-28)                      |
| `waktu_jam`     | Jam pelaksanaan (0-23)                          |
| `waktu_menit`   | Menit pelaksanaan (0-59)                        |
| `pengulangan`   | Frekuensi (BULANAN/TRIWULAN/TAHUNAN)            |
| `obat_ids`      | Daftar Obat (JSON: null=semua, [1,2,3]=pilihan) |
| `is_active`     | Status (Aktif/Non-Aktif)                        |
| `created_at`    | Timestamp dibuat                                |
| `updated_at`    | Timestamp diupdate                              |

---

### SC-014: Admin Mengubah Pengaturan Audit

| Aspek        | Detail                    |
| ------------ | ------------------------- |
| **User**     | Admin Farmasi             |
| **Scenario** | Admin Mengubah Pengaturan |

**Tabel Terkait:** `opname_schedule`

---

### SC-015: Admin Menghapus Pengaturan Audit

| Aspek        | Detail                     |
| ------------ | -------------------------- |
| **User**     | Admin Farmasi              |
| **Scenario** | Admin Menghapus Pengaturan |

**Tabel Terkait:** `opname_schedule`

**Logic:** Soft delete - `UPDATE opname_schedule SET deleted_at = NOW()`

---

## 2.2 Notifikasi Jadwal Opname

### SC-016: Sistem Trigger Jadwal Opname

| Aspek        | Detail                                                                                                                                                                                                      |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User**     | Sistem                                                                                                                                                                                                      |
| **Scenario** | Sistem mentrigger proses opname berdasarkan jadwal                                                                                                                                                          |
| **Notes**    | - Terdapat pilihan untuk melakukan opname atau tidak<br>- Jika "YA" proses Opname akan dilakukan<br>- Jika "Tidak" proses Opname tidak akan dilakukan<br>- Notifikasi di-handle oleh aplikasi (bukan di DB) |

**Tabel Terkait:** `opname_schedule`, `opname`

**Kolom tambahan di tabel `opname`:**

| Kolom            | Mapping Data Requirement                         |
| ---------------- | ------------------------------------------------ |
| `tanggal_jadwal` | Tanggal seharusnya opname (dari opname_schedule) |
| `created_at`     | Kapan opname dimulai/dibuat                      |

**Flow:**

1. Cron job cek `opname_schedule` WHERE tanggal_audit = hari_ini AND waktu = jam_ini AND is_active = true
2. Aplikasi menampilkan notifikasi ke Admin Farmasi
3. Jika Admin pilih "YA":
   - INSERT `opname` (schedule_id, status='proses', tanggal_jadwal=tanggal_dari_schedule)
   - Snapshot stok sistem ke `opname_detail`:
     ```sql
     INSERT INTO opname_detail (opname_id, obat_id, stok_sistem)
     SELECT ?, mo.id, mo.qty FROM master_obat mo
     WHERE mo.id IN (SELECT unnest(obat_ids) FROM opname_schedule WHERE id = ?)
        OR (SELECT obat_ids FROM opname_schedule WHERE id = ?) IS NULL
     ```
4. Jika Admin pilih "TIDAK" → Skip (tidak ada record dibuat)

---

## 2.3 Pembekuan Buku Stok

### SC-017: Sistem Membekukan Buku Stok

| Aspek        | Detail                                       |
| ------------ | -------------------------------------------- |
| **User**     | Sistem                                       |
| **Scenario** | Sistem membekukan Buku Stok Obat keseluruhan |

**Tabel Terkait:** `opname`, `opname_detail`

**Logic:** Cek apakah ada opname aktif sebelum transaksi

```sql
SELECT 1 FROM opname WHERE status = 'proses' LIMIT 1
-- Jika ada hasil → tolak semua transaksi stok
```

---

## 2.4 Pembekuan Transaksi

### SC-018: Sistem Membekukan Transaksi Obat

| Aspek        | Detail                                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------- |
| **User**     | Sistem                                                                                                              |
| **Scenario** | Sistem membekukan obat yang sedang dalam proses opname sehingga tidak dapat dilakukan transaksi untuk obat tersebut |

**Tabel Terkait:** `opname`, `opname_detail`

**Logic:**

```sql
-- Cek sebelum transaksi
SELECT 1 FROM opname o
JOIN opname_detail od ON o.id = od.opname_id
WHERE o.status = 'proses' AND od.obat_id = ?
-- Jika ada hasil → tolak transaksi
```

---

## 2.5 Verifikasi Stok Opname

### SC-019~021: Admin Mengisi dan Memverifikasi Stok Fisik

> **Note:** SC-019, SC-020, SC-021 digabung menjadi satu flow untuk efisiensi.

| Aspek                | Detail                                                                                                                                                                                                                            |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User**             | Admin Farmasi                                                                                                                                                                                                                     |
| **Scenario**         | Admin mengisi stok fisik, sistem membandingkan, dan menampilkan hasil                                                                                                                                                             |
| **Scenario Details** | 1. Admin input jumlah stok fisik per obat (SC-019)<br>2. Sistem otomatis menghitung selisih (SC-020)<br>3. Sistem menampilkan status Sesuai/Ada Selisih (SC-021)<br>4. Jika ada selisih, Admin diminta mengisi Jurnal Penyesuaian |
| **Data Requirement** | Daftar Obat, Stok Fisik, Stok Sistem, Selisih, Status                                                                                                                                                                             |
| **Notes**            | Notifikasi di-handle oleh aplikasi (bukan di DB)                                                                                                                                                                                  |

**Tabel Terkait:** `opname_detail`

| Kolom         | Mapping Data Requirement                   |
| ------------- | ------------------------------------------ |
| `obat_id`     | Daftar Obat (FK ke master_obat)            |
| `stok_sistem` | Stok Sistem (snapshot saat opname dimulai) |
| `stok_fisik`  | Stok Fisik (input admin)                   |
| `selisih`     | Selisih (auto: stok_fisik - stok_sistem)   |
| `status`      | Status (sesuai/pending/disesuaikan)        |

**Logic:**

```sql
UPDATE opname_detail
SET stok_fisik = ?,
    selisih = ? - stok_sistem,
    status = CASE WHEN ? = stok_sistem THEN 'sesuai' ELSE 'pending' END
WHERE id = ?
```

---

## 2.6 Jurnal Penyesuaian

### SC-022: Admin Mengisi Jurnal Penyesuaian

| Aspek                | Detail                                                                              |
| -------------------- | ----------------------------------------------------------------------------------- |
| **User**             | Admin Farmasi                                                                       |
| **Scenario**         | Jika stok obat ditemukan selisih, Admin Farmasi perlu mengisikan jurnal penyesuaian |
| **Data Requirement** | Obat, Stok Fisik, Stok Sistem, Selisih, Alasan                                      |

**Tabel Terkait:** `opname_detail`, `master_obat`

| Kolom    | Mapping Data Requirement |
| -------- | ------------------------ |
| `alasan` | Alasan penyesuaian       |

**Flow:**

1. UPDATE `opname_detail` SET alasan=?, status='disesuaikan'
2. UPDATE `master_obat` SET qty = stok_fisik WHERE id = obat_id

---

# 3. Modul Laporan dan Analisis

> **Note:** Semua laporan menggunakan pendekatan **query-based** (tanpa tabel tambahan). Data diambil langsung dari tabel transaksi yang sudah ada.

---

## 3.1 Laporan Stok Obat Saat Ini

### SC-023: Laporan Stok Obat Aktif

| Aspek                | Detail                                               |
| -------------------- | ---------------------------------------------------- |
| **User**             | Admin Farmasi, Super Admin                           |
| **Scenario**         | Melihat daftar stok obat saat ini                    |
| **Data Requirement** | Kode, Nama Obat, Jenis, Satuan, Stok, Buffer, Status |

**Query:**

```sql
SELECT
  kode,
  nama,
  jenis,
  satuan,
  qty AS stok_saat_ini,
  buffer_stok,
  CASE
    WHEN qty <= buffer_stok THEN 'PERLU RESTOCK'
    ELSE 'AMAN'
  END AS status_stok
FROM master_obat
WHERE is_active = true AND deleted_at IS NULL
ORDER BY nama;
```

---

## 3.2 Laporan Obat Hampir Kadaluarsa

### SC-024: Laporan Obat Mendekati Expire

| Aspek                | Detail                                                   |
| -------------------- | -------------------------------------------------------- |
| **User**             | Admin Farmasi                                            |
| **Scenario**         | Melihat obat yang akan kadaluarsa dalam periode tertentu |
| **Data Requirement** | Nama Obat, Batch, Expire Date, Sisa Hari, Qty            |
| **Parameter**        | `hari_kedepan` (default: 30 hari)                        |

**Query:**

```sql
SELECT
  mo.nama AS nama_obat,
  td.batch,
  td.expire_date,
  (td.expire_date - CURRENT_DATE) AS sisa_hari,
  td.qty
FROM transaksi_detail td
JOIN master_obat mo ON td.obat_id = mo.id
JOIN transaksi t ON td.transaksi_nomor = t.nomor
WHERE t.tipe = 'masuk'
  AND td.expire_date IS NOT NULL
  AND td.expire_date <= CURRENT_DATE + INTERVAL ':hari_kedepan days'
  AND td.expire_date >= CURRENT_DATE
ORDER BY td.expire_date ASC;
```

---

## 3.3 Laporan Mutasi Stok (Masuk/Keluar)

### SC-025: Laporan Mutasi Stok per Periode

| Aspek                | Detail                                                         |
| -------------------- | -------------------------------------------------------------- |
| **User**             | Admin Farmasi, Super Admin                                     |
| **Scenario**         | Melihat riwayat mutasi stok obat dalam periode tertentu        |
| **Data Requirement** | Tanggal, Nomor Transaksi, Tipe, Nama Obat, Qty, Sumber, Status |
| **Parameter**        | `tanggal_awal`, `tanggal_akhir`, `obat_id` (opsional)          |

**Query:**

```sql
SELECT
  t.tanggal,
  t.nomor AS nomor_transaksi,
  t.tipe,
  mo.nama AS nama_obat,
  td.qty,
  td.batch,
  t.tipe_sumber,
  t.nama_pasien,
  t.status,
  u.full_name AS dibuat_oleh
FROM transaksi t
JOIN transaksi_detail td ON t.nomor = td.transaksi_nomor
JOIN master_obat mo ON td.obat_id = mo.id
LEFT JOIN users u ON t.created_by = u.id
WHERE t.tanggal BETWEEN :tanggal_awal AND :tanggal_akhir
  AND t.deleted_at IS NULL
  AND (:obat_id IS NULL OR td.obat_id = :obat_id)
ORDER BY t.tanggal DESC, t.nomor;
```

---

## 3.4 Laporan Ringkasan Mutasi per Obat

### SC-026: Ringkasan Masuk/Keluar per Obat

| Aspek                | Detail                                                    |
| -------------------- | --------------------------------------------------------- |
| **User**             | Admin Farmasi, Super Admin                                |
| **Scenario**         | Melihat total mutasi masuk dan keluar per obat            |
| **Data Requirement** | Nama Obat, Total Masuk, Total Keluar, Selisih, Stok Akhir |
| **Parameter**        | `tanggal_awal`, `tanggal_akhir`                           |

**Query:**

```sql
SELECT
  mo.kode,
  mo.nama AS nama_obat,
  COALESCE(SUM(CASE WHEN t.tipe = 'masuk' THEN td.qty ELSE 0 END), 0) AS total_masuk,
  COALESCE(SUM(CASE WHEN t.tipe = 'keluar' AND t.status = 'selesai' THEN td.qty ELSE 0 END), 0) AS total_keluar,
  mo.qty AS stok_saat_ini
FROM master_obat mo
LEFT JOIN transaksi_detail td ON mo.id = td.obat_id
LEFT JOIN transaksi t ON td.transaksi_nomor = t.nomor
  AND t.tanggal BETWEEN :tanggal_awal AND :tanggal_akhir
  AND t.deleted_at IS NULL
WHERE mo.is_active = true AND mo.deleted_at IS NULL
GROUP BY mo.id, mo.kode, mo.nama, mo.qty
ORDER BY mo.nama;
```

---

## 3.5 Laporan Jurnal Penyesuaian

### SC-027: Rekap Jurnal Penyesuaian per Periode

| Aspek                | Detail                                                              |
| -------------------- | ------------------------------------------------------------------- |
| **User**             | Admin Farmasi, Super Admin                                          |
| **Scenario**         | Melihat riwayat penyesuaian stok dari hasil opname                  |
| **Data Requirement** | Tanggal Opname, Nama Obat, Stok Sistem, Stok Fisik, Selisih, Alasan |
| **Parameter**        | `tanggal_awal`, `tanggal_akhir`                                     |

**Query:**

```sql
SELECT
  o.tanggal_jadwal,
  o.created_at AS tanggal_aktual,
  mo.kode,
  mo.nama AS nama_obat,
  od.stok_sistem,
  od.stok_fisik,
  od.selisih,
  od.alasan,
  od.status,
  u.full_name AS disesuaikan_oleh
FROM opname o
JOIN opname_detail od ON o.id = od.opname_id
JOIN master_obat mo ON od.obat_id = mo.id
LEFT JOIN users u ON od.updated_by = u.id
WHERE o.created_at BETWEEN :tanggal_awal AND :tanggal_akhir
  AND od.status = 'disesuaikan'
  AND o.deleted_at IS NULL
ORDER BY o.created_at DESC, mo.nama;
```

---

## 3.6 Laporan Ringkasan Opname

### SC-028: Ringkasan Hasil Opname

| Aspek                | Detail                                                        |
| -------------------- | ------------------------------------------------------------- |
| **User**             | Admin Farmasi, Super Admin                                    |
| **Scenario**         | Melihat ringkasan hasil opname (sesuai vs tidak sesuai)       |
| **Data Requirement** | Tanggal, Total Item, Item Sesuai, Item Selisih, Total Selisih |
| **Parameter**        | `tanggal_awal`, `tanggal_akhir`                               |

**Query:**

```sql
SELECT
  o.id AS opname_id,
  o.tanggal_jadwal,
  o.created_at AS tanggal_aktual,
  os.nama AS nama_jadwal,
  o.status AS status_opname,
  COUNT(od.id) AS total_item,
  SUM(CASE WHEN od.status = 'sesuai' THEN 1 ELSE 0 END) AS item_sesuai,
  SUM(CASE WHEN od.status IN ('pending', 'disesuaikan') THEN 1 ELSE 0 END) AS item_selisih,
  SUM(ABS(COALESCE(od.selisih, 0))) AS total_selisih_qty
FROM opname o
LEFT JOIN opname_schedule os ON o.schedule_id = os.id
LEFT JOIN opname_detail od ON o.id = od.opname_id
WHERE o.created_at BETWEEN :tanggal_awal AND :tanggal_akhir
  AND o.deleted_at IS NULL
GROUP BY o.id, o.tanggal_jadwal, o.created_at, os.nama, o.status
ORDER BY o.created_at DESC;
```

---

# 4. Data Model

## 4.1 Daftar Tabel

| No  | Tabel              | Deskripsi                        | Dipakai di SC                |
| --- | ------------------ | -------------------------------- | ---------------------------- |
| 1   | `users`            | Data pengguna                    | Login, referensi created_by  |
| 2   | `master_obat`      | Master data obat + stok          | SC-001~003, 007~012, 019~022 |
| 3   | `master_jasa`      | Master data jasa                 | SC-004~006, 009              |
| 4   | `transaksi`        | Header transaksi                 | SC-007, 009~012              |
| 5   | `transaksi_detail` | Detail item obat transaksi       | SC-007, 009~012              |
| 6   | `transaksi_jasa`   | Detail item jasa transaksi (M:N) | SC-009~011                   |
| 7   | `opname_schedule`  | Pengaturan jadwal opname         | SC-013~016                   |
| 8   | `opname`           | Proses opname aktual             | SC-016~018                   |
| 9   | `opname_detail`    | Detail opname per obat           | SC-018~022                   |

> **Note:**
>
> - Notifikasi di-handle oleh aplikasi, bukan disimpan di database.
> - Stok obat (`qty`) digabung ke tabel `master_obat` untuk efisiensi.
> - SC-019, SC-020, SC-021 digabung menjadi satu flow (lihat section 2.5).
> - Relasi `transaksi ↔ master_jasa` adalah many-to-many via `transaksi_jasa`.

## 4.2 ERD Summary

```
users (1)
  │
  ├──< master_obat (N) ──────────────────────────────┐
  │         │ (termasuk qty stok)                    │
  │         │ + jenis_obat_id, satuan_id (optional)  │
  │         │                                        │
  ├──< master_jasa (N)                               │
  │         │                                        │
  │         └──< transaksi_jasa (N) >──┐             │
  │                                    │             │
  │         ┌──────────────────────────┘             │
  │         │                                        │
  │         └──< transaksi (N) ──< transaksi_detail (N)
  │                   │                              │
  │                   │ (dual PK: nomor + id)        │
  │                   ├── FK: created_by, processed_by
  │                   └── tipe_sumber: PENGAJUAN_NAKES | KASIR_LANGSUNG | PEMBELIAN
  │                                                  │
  ├──< opname_schedule (N) ──────────────────────────│
  │         │ (waktu_jam, waktu_menit, pengulangan)  │
  │         │                                        │
  │         └──< opname (N) ──< opname_detail (N) ───┘
  │                   │              FK: obat_id
  │                   ├── tanggal_jadwal (date)
  │                   └── tanggal (timestamptz)
  │
  └── Kolom audit: created_at, updated_at, deleted_at
```

**Keterangan:**

- `(1)` = Satu, `(N)` = Banyak
- `<` = Relasi one-to-many
- `FK:` = Foreign key

**Catatan Penting:**

1. **Dual Primary Key System:**

   - Tabel `transaksi` memiliki 2 identifier: `nomor` (text) dan `id` (bigint)
   - `nomor` digunakan sebagai business key (user-facing)
   - `id` digunakan sebagai technical key (internal)

2. **Dual Foreign Key System:**

   - `transaksi_detail` dan `transaksi_jasa` memiliki 2 FK ke `transaksi`:
     - `transaksi_id` (bigint) → `transaksi.id`
     - `transaksi_nomor` (text) → `transaksi.nomor`
   - Aplikasi menggunakan `transaksi_nomor` untuk konsistensi dengan business logic

3. **Optional Lookup Tables:**
   - `master_obat` memiliki kolom `jenis_obat_id` dan `satuan_id` untuk relasi ke lookup tables
   - Kolom text `jenis` dan `satuan` tetap ada untuk backward compatibility

## 4.3 Mapping SC ke Tabel

| Tabel              | SC yang Menggunakan          |
| ------------------ | ---------------------------- |
| `users`            | Semua (auth, audit trail)    |
| `master_obat`      | SC-001~003, 007~012, 019~022 |
| `master_jasa`      | SC-004~006, 009              |
| `transaksi`        | SC-007, 009~012              |
| `transaksi_detail` | SC-007, 009~012              |
| `opname_schedule`  | SC-013~016                   |
| `opname`           | SC-016~018                   |
| `opname_detail`    | SC-018~022                   |

## 4.4 Kolom Audit Trail (Standar)

Semua tabel utama memiliki kolom audit berikut:

| Kolom        | Tipe       | Deskripsi                        |
| ------------ | ---------- | -------------------------------- |
| `created_at` | TIMESTAMP  | Waktu record dibuat              |
| `created_by` | FK → users | User yang membuat                |
| `updated_at` | TIMESTAMP  | Waktu terakhir diupdate          |
| `updated_by` | FK → users | User yang mengupdate             |
| `deleted_at` | TIMESTAMP  | Waktu soft delete (NULL = aktif) |
