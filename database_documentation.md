# Dokumentasi Database: Aplikasi Pengelolaan Stok Obat

Dokumentasi ini berisi penjelasan detail mengenai struktur database yang digunakan dalam project Aplikasi Pengelolaan Stok Obat.

## Daftar Tabel

1. [master_jasa](#1-tabel-master_jasa)
2. [master_obat](#2-tabel-master_obat)
3. [opname](#3-tabel-opname)
4. [opname_detail](#4-tabel-opname_detail)
5. [opname_schedule](#5-tabel-opname_schedule)
6. [transaksi](#6-tabel-transaksi)
7. [transaksi_detail](#7-tabel-transaksi_detail)
8. [transaksi_jasa](#8-tabel-transaksi_jasa)
9. [users](#9-tabel-users)

---

### **1. Tabel `master_jasa`**

Menyimpan data master layanan atau jasa yang tersedia.

| Nama Kolom   | Tipe Data     | Nullable | Default | Keterangan                               |
| :----------- | :------------ | :------- | :------ | :--------------------------------------- |
| `id`         | `bigint`      | NO       | -       | Primary Key, identifier unik untuk jasa. |
| `kode`       | `text`        | NO       | -       | Kode unik untuk identifikasi jasa.       |
| `nama`       | `text`        | NO       | -       | Nama lengkap layanan/jasa.               |
| `harga`      | `numeric`     | YES      | `0`     | Harga satuan jasa.                       |
| `is_active`  | `boolean`     | YES      | `true`  | Penanda status aktif jasa (True=Aktif).  |
| `created_at` | `timestamptz` | YES      | `now()` | Waktu record dibuat.                     |
| `created_by` | `uuid`        | YES      | -       | ID user yang membuat data.               |
| `updated_at` | `timestamptz` | YES      | `now()` | Waktu terakhir update data.              |
| `updated_by` | `uuid`        | YES      | -       | ID user yang melakukan update terakhir.  |
| `deleted_at` | `timestamptz` | YES      | -       | Waktu soft delete (jika ada).            |

---

### **2. Tabel `master_obat`**

Menyimpan data master obat-obatan dan stok.

| Nama Kolom    | Tipe Data     | Nullable | Default | Keterangan                                       |
| :------------ | :------------ | :------- | :------ | :----------------------------------------------- |
| `id`          | `bigint`      | NO       | -       | Primary Key.                                     |
| `kode`        | `text`        | NO       | -       | Kode unik obat/barang.                           |
| `nama`        | `text`        | NO       | -       | Nama lengkap obat.                               |
| `jenis`       | `text`        | YES      | -       | Kategori atau jenis obat (misal: Tablet, Sirup). |
| `satuan`      | `text`        | YES      | -       | Satuan terkecil obat (misal: pcs, strip, botol). |
| `buffer_stok` | `integer`     | YES      | `0`     | Batas minimal stok aman.                         |
| `harga`       | `numeric`     | YES      | `0`     | Harga dasar obat.                                |
| `qty`         | `integer`     | YES      | `0`     | Jumlah stok saat ini tersedia.                   |
| `is_active`   | `boolean`     | YES      | `true`  | Status aktif obat.                               |
| `created_at`  | `timestamptz` | YES      | `now()` | Waktu pembuatan data.                            |
| `created_by`  | `uuid`        | YES      | -       | User pembuat data.                               |
| `updated_at`  | `timestamptz` | YES      | `now()` | Waktu update terakhir.                           |
| `updated_by`  | `uuid`        | YES      | -       | User yang mengupdate.                            |
| `deleted_at`  | `timestamptz` | YES      | -       | Waktu soft delete.                               |

---

### **3. Tabel `opname`**

Menyimpan header/induk dari proses stok opname (audit stok).

| Nama Kolom       | Tipe Data     | Nullable | Default    | Keterangan                                           |
| :--------------- | :------------ | :------- | :--------- | :--------------------------------------------------- |
| `id`             | `bigint`      | NO       | -          | Primary Key.                                         |
| `schedule_id`    | `bigint`      | YES      | -          | Foreign Key ke `opname_schedule`.                    |
| `tanggal_jadwal` | `date`        | YES      | -          | Tanggal seharusnya opname dilakukan (dari schedule). |
| `status`         | `text`        | YES      | `'proses'` | Status opname: `proses`, `selesai`.                  |
| `created_at`     | `timestamptz` | YES      | `now()`    | Waktu opname dimulai/record dibuat.                  |
| `created_by`     | `uuid`        | YES      | -          | User pembuat record.                                 |
| `updated_at`     | `timestamptz` | YES      | `now()`    | Waktu update terakhir.                               |
| `updated_by`     | `uuid`        | YES      | -          | User pengupdate.                                     |
| `deleted_at`     | `timestamptz` | YES      | -          | Waktu soft delete.                                   |

> **Note:** Kolom `tanggal_jadwal` diambil dari `opname_schedule.tanggal_audit` saat opname dibuat. `created_at` digunakan sebagai waktu aktual opname dimulai.

---

### **4. Tabel `opname_detail`**

Menyimpan rincian hasil perhitungan fisik per item obat dalam stok opname.

| Nama Kolom    | Tipe Data     | Nullable | Default     | Keterangan                                             |
| :------------ | :------------ | :------- | :---------- | :----------------------------------------------------- |
| `id`          | `bigint`      | NO       | -           | Primary Key.                                           |
| `opname_id`   | `bigint`      | YES      | -           | Foreign Key ke tabel `opname`.                         |
| `obat_id`     | `bigint`      | YES      | -           | Foreign Key ke `master_obat`.                          |
| `stok_fisik`  | `integer`     | YES      | -           | Jumlah stok hasil hitungan fisik lapangan.             |
| `stok_sistem` | `integer`     | YES      | -           | Jumlah stok tercatat di sistem saat opname.            |
| `selisih`     | `integer`     | YES      | -           | Perbedaan `stok_fisik` dikurangi `stok_sistem`.        |
| `status`      | `text`        | YES      | `'pending'` | Status verifikasi: `pending`, `sesuai`, `disesuaikan`. |
| `alasan`      | `text`        | YES      | -           | Keterangan/alasan jika ada selisih.                    |
| `created_at`  | `timestamptz` | YES      | `now()`     | Waktu input data.                                      |
| `created_by`  | `uuid`        | YES      | -           | User penginput.                                        |
| `updated_at`  | `timestamptz` | YES      | `now()`     | Waktu update data.                                     |
| `updated_by`  | `uuid`        | YES      | -           | User pengupdate.                                       |
| `deleted_at`  | `timestamptz` | YES      | -           | Waktu soft delete.                                     |

---

### **5. Tabel `opname_schedule`**

Menyimpan jadwal perencanaan stok opname.

| Nama Kolom      | Tipe Data     | Nullable | Default | Keterangan                                                         |
| :-------------- | :------------ | :------- | :------ | :----------------------------------------------------------------- |
| `id`            | `bigint`      | NO       | -       | Primary Key.                                                       |
| `nama`          | `text`        | NO       | -       | Nama jadwal (misal: Opname Bulanan Januari).                       |
| `tanggal_audit` | `integer`     | YES      | -       | Tanggal pelaksanaan audit (1-28).                                  |
| `waktu_jam`     | `smallint`    | YES      | -       | Jam pelaksanaan (0-23).                                            |
| `waktu_menit`   | `smallint`    | YES      | -       | Menit pelaksanaan (0-59).                                          |
| `pengulangan`   | `text`        | YES      | -       | Frekuensi opname: `BULANAN`, `TRIWULAN`, `TAHUNAN`.                |
| `obat_ids`      | `jsonb`       | YES      | -       | List ID obat yang di-opname (`null` = semua, `[1,2,3]` = pilihan). |
| `is_active`     | `boolean`     | YES      | `true`  | Status aktif jadwal.                                               |
| `created_at`    | `timestamptz` | YES      | `now()` | Waktu pembuatan jadwal.                                            |
| `created_by`    | `uuid`        | YES      | -       | User pembuat jadwal.                                               |
| `updated_at`    | `timestamptz` | YES      | `now()` | Waktu update terakhir.                                             |
| `updated_by`    | `uuid`        | YES      | -       | User pengupdate.                                                   |
| `deleted_at`    | `timestamptz` | YES      | -       | Waktu soft delete.                                                 |

---

### **6. Tabel `transaksi`**

Memberikan informasi header transaksi (penerimaan atau pengeluaran barang).

| Nama Kolom     | Tipe Data     | Nullable | Default      | Keterangan                                           |
| :------------- | :------------ | :------- | :----------- | :--------------------------------------------------- |
| `nomor`        | `text`        | NO       | -            | Nomor Transaksi Unik (Primary Key natural).          |
| `tanggal`      | `timestamptz` | YES      | `now()`      | Tanggal transaksi terjadi.                           |
| `tipe`         | `text`        | YES      | -            | Jenis transaksi: `masuk`, `keluar`.                  |
| `tipe_sumber`  | `text`        | YES      | -            | Asal transaksi: `PENGAJUAN_NAKES`, `KASIR_LANGSUNG`. |
| `bukti`        | `text`        | YES      | -            | URL atau referensi bukti fisik/dokumen.              |
| `nama_pasien`  | `text`        | YES      | -            | Nama pasien (jika transaksi terkait pasien).         |
| `keterangan`   | `text`        | YES      | -            | Catatan tambahan transaksi.                          |
| `status`       | `text`        | YES      | `'diajukan'` | Status workflow: `diajukan`, `selesai`.              |
| `total`        | `numeric`     | YES      | `0`          | Total nilai transaksi (obat + jasa).                 |
| `processed_by` | `uuid`        | YES      | -            | User yang memproses/menyetujui transaksi.            |
| `processed_at` | `timestamptz` | YES      | -            | Waktu transaksi diproses.                            |
| `created_at`   | `timestamptz` | YES      | `now()`      | Waktu input transaksi.                               |
| `created_by`   | `uuid`        | YES      | -            | User penginput.                                      |
| `updated_at`   | `timestamptz` | YES      | `now()`      | Waktu update terakhir.                               |
| `updated_by`   | `uuid`        | YES      | -            | User pengupdate.                                     |
| `deleted_at`   | `timestamptz` | YES      | -            | Waktu soft delete.                                   |

> **Note:**
>
> - `tipe_sumber = 'PENGAJUAN_NAKES'` → Transaksi dari pengajuan Nakes (SC-009)
> - `tipe_sumber = 'KASIR_LANGSUNG'` → Transaksi langsung dari Admin Kasir (SC-011)
> - Relasi ke `master_jasa` adalah **many-to-many** via tabel `transaksi_jasa`

---

### **7. Tabel `transaksi_detail`**

Rincian item obat dalam setiap transaksi.

| Nama Kolom        | Tipe Data     | Nullable | Default | Keterangan                                   |
| :---------------- | :------------ | :------- | :------ | :------------------------------------------- |
| `id`              | `bigint`      | NO       | -       | Primary Key.                                 |
| `transaksi_nomor` | `text`        | YES      | -       | Foreign Key ke tabel `transaksi.nomor`.      |
| `obat_id`         | `bigint`      | YES      | -       | Foreign Key ke `master_obat`.                |
| `qty`             | `integer`     | NO       | -       | Jumlah obat dalam transaksi (+/-).           |
| `expire_date`     | `date`        | YES      | -       | Tanggal kadaluarsa item yang ditransaksikan. |
| `batch`           | `text`        | YES      | -       | Nomor batch produksi obat.                   |
| `harga`           | `numeric`     | YES      | -       | Harga satuan saat transaksi terjadi.         |
| `subtotal`        | `numeric`     | YES      | -       | Perhitungan `qty` × `harga`.                 |
| `created_at`      | `timestamptz` | YES      | `now()` | Waktu input data.                            |
| `created_by`      | `uuid`        | YES      | -       | User penginput.                              |
| `updated_at`      | `timestamptz` | YES      | `now()` | Waktu update data.                           |
| `updated_by`      | `uuid`        | YES      | -       | User pengupdate.                             |
| `deleted_at`      | `timestamptz` | YES      | -       | Waktu soft delete.                           |

---

### **8. Tabel `transaksi_jasa`**

Tabel junction untuk relasi many-to-many antara `transaksi` dan `master_jasa`.

| Nama Kolom        | Tipe Data     | Nullable | Default | Keterangan                                      |
| :---------------- | :------------ | :------- | :------ | :---------------------------------------------- |
| `id`              | `bigint`      | NO       | -       | Primary Key.                                    |
| `transaksi_nomor` | `text`        | NO       | -       | Foreign Key ke tabel `transaksi.nomor`.         |
| `jasa_id`         | `bigint`      | NO       | -       | Foreign Key ke `master_jasa`.                   |
| `qty`             | `integer`     | YES      | `1`     | Jumlah layanan yang diberikan.                  |
| `harga_jasa`      | `numeric`     | YES      | -       | Snapshot harga jasa saat transaksi (immutable). |
| `subtotal`        | `numeric`     | YES      | -       | Perhitungan `qty` × `harga_jasa`.               |
| `created_at`      | `timestamptz` | YES      | `now()` | Waktu input data.                               |
| `created_by`      | `uuid`        | YES      | -       | User penginput.                                 |
| `updated_at`      | `timestamptz` | YES      | `now()` | Waktu update data.                              |
| `updated_by`      | `uuid`        | YES      | -       | User pengupdate.                                |
| `deleted_at`      | `timestamptz` | YES      | -       | Waktu soft delete.                              |

> **Note:** `harga_jasa` menyimpan harga saat transaksi terjadi, sehingga perubahan harga di `master_jasa` tidak mempengaruhi transaksi historis.

---

### **9. Tabel `users`**

Tabel pengguna aplikasi sistem.

| Nama Kolom   | Tipe Data     | Nullable | Default | Keterangan                                              |
| :----------- | :------------ | :------- | :------ | :------------------------------------------------------ |
| `id`         | `uuid`        | NO       | -       | Primary Key (biasanya terhubung ke table `auth.users`). |
| `email`      | `text`        | NO       | -       | Alamat email user.                                      |
| `full_name`  | `text`        | YES      | -       | Nama lengkap user.                                      |
| `role`       | `text`        | YES      | -       | Peran user: `admin`, `nakes`, `farmasi`.               |
| `created_at` | `timestamptz` | YES      | `now()` | Waktu user terdaftar.                                   |
| `updated_at` | `timestamptz` | YES      | `now()` | Waktu terakhir profil diupdate.                         |

---

## Diagram Relasi Antar Tabel (ERD)

```
users (1)
  │
  ├──< master_obat (N) ──────────────────────────────┐
  │         │ (termasuk qty stok)                    │
  │         │                                        │
  ├──< master_jasa (N)                               │
  │         │                                        │
  │         └──< transaksi_jasa (N) >──┐             │
  │                                    │             │
  │         ┌──────────────────────────┘             │
  │         │                                        │
  │         └──< transaksi (N) ──< transaksi_detail (N)
  │                   │                              │
  │                   ├── FK: created_by, processed_by
  │                   └── tipe_sumber: PENGAJUAN_NAKES | KASIR_LANGSUNG
  │                                                  │
  ├──< opname_schedule (N) ──────────────────────────│
  │         │ (waktu_jam, waktu_menit, pengulangan)  │
  │         │                                        │
  │         └──< opname (N) ──< opname_detail (N) ───┘
  │                   │              FK: obat_id
  │                   └── tanggal_jadwal
  │
  └── Kolom audit: created_at, updated_at, deleted_at
```

**Keterangan:**

- `(1)` = Satu, `(N)` = Banyak
- `<` = Relasi one-to-many
- `>──<` = Relasi many-to-many (via junction table)
- `FK:` = Foreign key
