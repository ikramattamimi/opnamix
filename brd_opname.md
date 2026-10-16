# Generated Business Requirements Document (BRD)

## Refactor Modul Stock Opname

---

### 1. Latar Belakang

Saat ini, menu-menu terkait Stock Opname berada di dalam satu halaman (`StockOpnameManagement.tsx`). Untuk meningkatkan navigasi dan pengalaman pengguna, dilakukan refactor agar modul Stock Opname memiliki sub-menu tersendiri di sidebar dengan alur kerja yang lebih terstruktur.

---

### 2. Tujuan

- Memindahkan navigasi modul Stock Opname ke sidebar sebagai menu dengan sub-menu.
- Menyediakan halaman **Riwayat Opname** yang informatif dengan layout terstruktur.
- Membangun halaman **Konfigurasi Opname** baru dari awal.
- Membangun alur pelaksanaan opname yang jelas dan bertahap (pilih obat → input stok fisik → penyesuaian stok).
- Mendukung fitur **draft/simpan sementara** pada proses pelaksanaan opname.

---

### 3. Ruang Lingkup

| Dalam Lingkup | Luar Lingkup |
| --- | --- |
| Refactor navigasi sidebar | Manajemen user & role |
| Halaman Riwayat Opname (termasuk opname mendatang) | Modul selain Stock Opname |
| Halaman Detail Opname (halaman baru) | Notifikasi/reminder opname |
| Halaman Pelaksanaan Opname (multi-step, 3 tahap) | Laporan & export data |
| Halaman Konfigurasi Opname (baru) | Perubahan backend/API endpoint |
| Fitur draft/simpan sementara |  |
| Perubahan skema database |  |

---

### 4. Perubahan Navigasi (Sidebar)

Menu **Stock Opname** di sidebar menjadi menu dengan sub-menu:

```
📦 Stock Opname
   ├── 1. Riwayat Opname
   └── 2. Konfigurasi Opname
```

- Menu-menu yang sebelumnya ada di halaman `StockOpnameManagement.tsx` dipindahkan ke sidebar.
- Halaman `StockOpnameManagement.tsx` tidak lagi menjadi landing page utama; navigasi langsung ke sub-menu.

---

### 5. Halaman: Riwayat Opname

### 5.1 Layout Halaman

Halaman dibagi **horizontal** dengan rasio **70:30** (kiri : kanan).

```
┌──────────────────────────────────┬────────────────┐
│           KIRI (70%)             │  KANAN (30%)   │
│                                  │                │
│  ┌────────────────────────────┐  │  Info Jadwal   │
│  │  Section: Opname Mendatang │  │  Opname Aktif  │
│  │  (cards)                   │  │                │
│  └────────────────────────────┘  │  • Tgl opname  │
│                                  │    berikutnya  │
│  ┌────────────────────────────┐  │  • Frekuensi   │
│  │  Section: Riwayat Opname   │  │    opname      │
│  │  (cards)                   │  │                │
│  └────────────────────────────┘  │  [Ubah         │
│                                  │  Konfigurasi]  │
└──────────────────────────────────┴────────────────┘
```

### 5.2 Panel Kanan — Informasi Jadwal Opname Aktif

| Elemen | Keterangan |
| --- | --- |
| Tanggal opname berikutnya | Tanggal pelaksanaan opname yang akan datang berdasarkan jadwal aktif |
| Frekuensi opname | Pengulangan jadwal: `BULANAN`, `TRIWULAN`, `TAHUNAN` |
| Tombol **"Ubah Konfigurasi"** | Mengarahkan user ke sub-menu **Konfigurasi Opname** |

### 5.3 Section: Opname Mendatang (Panel Kiri — Atas)

Menampilkan daftar opname yang dijadwalkan namun belum dilaksanakan, dalam bentuk **card**. Setiap card menampilkan:

| # | Informasi | Keterangan |
| --- | --- | --- |
| 1 | Informasi jadwal opname terkait | Nama jadwal yang menghasilkan opname ini (dari `opname_schedule.nama`) |
| 2 | Status Opname | `Belum Dilaksanakan` |
| 3 | Tanggal opname seharusnya dilakukan | Tanggal target sesuai jadwal (`opname.tanggal_jadwal`) |
| 4 | Tombol **"Mulai Opname"** | Memulai proses pelaksanaan opname (navigasi ke halaman baru) |

### 5.4 Section: Riwayat Opname (Panel Kiri — Bawah)

Menampilkan daftar opname yang **sudah selesai dilaksanakan**, dalam bentuk **card**. Setiap card menampilkan:

| # | Informasi | Keterangan |
| --- | --- | --- |
| 1 | Informasi jadwal opname terkait | Nama jadwal yang menghasilkan opname ini (dari `opname_schedule.nama`) |
| 2 | Status Opname | `Selesai` |
| 3 | Tanggal opname dilakukan | Tanggal aktual pelaksanaan (`opname.created_at`) |
| 4 | Tanggal opname seharusnya dilakukan | Tanggal target sesuai jadwal (`opname.tanggal_jadwal`) |
| 5 | Tombol **"Lihat Detail"** | Membuka **halaman baru** detail opname |

> **Catatan:** Opname dengan status `Sedang Dilaksanakan` (draft) juga ditampilkan di section ini atau section mendatang dengan indikasi visual bahwa proses sedang berjalan dan tombol **"Lanjutkan Opname"** untuk melanjutkan proses yang tertunda.
> 

### 5.5 Detail Opname (Halaman Baru)

Ketika tombol **"Lihat Detail"** diklik, user diarahkan ke **halaman baru** yang menampilkan detail dalam bentuk **tabel** berisi daftar obat yang telah diopname:

| Kolom | Sumber Data | Keterangan |
| --- | --- | --- |
| Nama Produk | `master_obat.nama` (via `opname_detail.obat_id`) | Nama obat/produk |
| Stok Sistem | `opname_detail.stok_sistem` | Jumlah stok yang tercatat di sistem saat opname |
| Stok Fisik | `opname_detail.stok_fisik` | Jumlah stok hasil penghitungan fisik |
| Selisih | `opname_detail.selisih` | Perbedaan: stok fisik − stok sistem |
| Stok Final | `opname_detail.stok_final` | Jumlah stok yang diputuskan sebagai stok akhir |
| Alasan Perbedaan | `opname_detail.alasan` | Alasan yang diinput oleh user terkait selisih stok |

---

### 6. Halaman: Konfigurasi Opname (Baru)

Halaman baru yang menampilkan **tabel daftar jadwal opname** dengan kolom berikut:

| # | Kolom | Sumber Data | Keterangan |
| --- | --- | --- | --- |
| 1 | Nama Jadwal | `opname_schedule.nama` | Nama/label jadwal opname |
| 2 | Tanggal Audit | `opname_schedule.tanggal_audit` | Tanggal pelaksanaan (1-28) |
| 3 | Jumlah Obat yang Diaudit | `opname_schedule.obat_ids` | Jumlah obat. Jika `null` = "Semua obat", jika array = jumlah elemen array |
| 4 | Status | `opname_schedule.is_active` | `Aktif` atau `Nonaktif` |
| 5 | Durasi Pengerjaan Opname | `opname_schedule.durasi_pengerjaan` | Batas waktu (hari) untuk menyelesaikan opname **(kolom baru — lihat Bagian 9)** |
| 6 | Pengulangan | `opname_schedule.pengulangan` | `BULANAN`, `TRIWULAN`, `TAHUNAN` |

Fitur pada halaman ini:

- Tombol **Tambah Jadwal** untuk membuat jadwal opname baru
- Aksi per baris: **Edit** dan **Hapus** (soft delete)
- Toggle **Aktif/Nonaktif** untuk mengubah status jadwal

---

### 7. Alur Pelaksanaan Opname (Multi-Step — 3 Tahap)

Ketika tombol **"Mulai Opname"** diklik dari section Opname Mendatang, atau **"Lanjutkan Opname"** untuk draft, user diarahkan ke **halaman baru** dengan alur **3 tahap**:

### 7.1 Tahap 1 — Pemilihan Obat

Menampilkan daftar obat yang sudah dikonfigurasi di jadwal opname (`opname_schedule.obat_ids`). Obat-obat tersebut sudah **ter-checklist** secara default.

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| Checkbox | **Editable** | Untuk memilih/membatalkan obat yang akan diopname. Default: checked sesuai jadwal |
| Nama Produk | Read-only | Nama obat dari `master_obat.nama` |
| Stok Sistem Saat Ini | Read-only | Stok tercatat di sistem (`master_obat.qty`) |
- User dapat **menambah atau mengurangi** obat dari daftar.
- Jika `opname_schedule.obat_ids` = `null`, semua obat aktif ditampilkan dan ter-checklist.
- Tersedia tombol **"Lanjutkan ke Input Stok Fisik"**.
- Tersedia tombol **"Simpan Draft"** untuk menyimpan progres.

### 7.2 Tahap 2 — Input Stok Fisik

Menampilkan **tabel** hanya untuk obat yang dipilih di Tahap 1:

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| Nama Produk | Read-only | Nama obat/produk |
| Input Stok Fisik | **Editable (input angka)** | User menginput jumlah stok hasil hitung fisik |
- Tersedia tombol **"Selesaikan Input & Lanjutkan"** untuk melanjutkan ke tahap 3.
- Tersedia tombol **"Simpan Draft"** untuk menyimpan progres.
- Jumlah stok sistem disembunyikan supaya perhitungan stok fisik lebih akurat

### 7.3 Tahap 3 — Penyesuaian Stok

Setelah tahap 2 selesai, tampilkan halaman penyesuaian stok dalam bentuk **tabel**:

| Kolom | Tipe | Keterangan |
| --- | --- | --- |
| Nama Produk | Read-only | Nama obat/produk |
| Jumlah Stok Sistem | Read-only | Stok tercatat di sistem |
| Jumlah Stok Fisik | Read-only | Stok fisik yang diinput di tahap 2 |
| Jumlah Selisih | Read-only (computed) | Otomatis dihitung: Stok Fisik − Stok Sistem |
| Input Stok Final | **Editable (input angka)** | User menentukan stok akhir yang disepakati |
| Input Alasan Perbedaan | **Editable (input teks)** | **Wajib diisi jika ada selisih** (selisih ≠ 0) |

**Aturan Validasi:**

- Kolom **Alasan Perbedaan** wajib diisi jika `selisih ≠ 0`. Jika selisih = 0, kolom ini opsional.
- Tersedia tombol **"Selesaikan Opname"** untuk menyimpan dan menyelesaikan proses opname.
- Tersedia tombol **"Simpan Draft"** untuk menyimpan progres.
- Setelah opname diselesaikan, status berubah menjadi `selesai`, dan stok di `master_obat.qty` diperbarui sesuai `stok_final`.

---

### 8. Fitur Draft / Simpan Sementara

| Aspek | Ketentuan |
| --- | --- |
| Kapan bisa disimpan | Di setiap tahap (1, 2, dan 3) |
| Status saat draft | `sedang_dilaksanakan` |
| Melanjutkan draft | Dari halaman Riwayat Opname, muncul card dengan tombol **"Lanjutkan Opname"** |
| Tahap yang disimpan | Sistem menyimpan di tahap mana user terakhir bekerja **(kolom baru — lihat Bagian 9)** |
| Data yang disimpan | Pilihan obat (Tahap 1), input stok fisik (Tahap 2), input stok final & alasan (Tahap 3) |

---

### 9. Status Opname

Daftar status yang berlaku pada tabel `opname`:

| Status | Keterangan |
| --- | --- |
| `belum_dilaksanakan` | Opname terjadwal tapi belum dimulai |
| `sedang_dilaksanakan` | Opname sudah dimulai tapi belum selesai (draft) |
| `selesai` | Opname telah selesai seluruh tahapnya |

---

### 10. Perubahan Database

Berdasarkan analisis terhadap database yang sudah ada, berikut perubahan yang diperlukan:

### 10.1 Perubahan pada Tabel `opname`

| Perubahan | Kolom | Tipe Data | Nullable | Default | Keterangan |
| --- | --- | --- | --- | --- | --- |
| **UBAH** | `status` | `text` | YES | `'belum_dilaksanakan'` | Nilai yang berlaku diubah dari `'proses'`, `'selesai'` menjadi `'belum_dilaksanakan'`, `'sedang_dilaksanakan'`, `'selesai'` |
| **TAMBAH** | `current_step` | `smallint` | YES | `1` | Menyimpan tahap terakhir user bekerja saat draft. Nilai: `1` (Pilih Obat), `2` (Input Stok Fisik), `3` (Penyesuaian Stok) |
| **TAMBAH** | `selected_obat_ids` | `jsonb` | YES | `null` | Menyimpan list ID obat yang dipilih user di Tahap 1. Ini bisa berbeda dari `opname_schedule.obat_ids` karena user bisa mengubah pilihan saat pelaksanaan |
| **TAMBAH** | `completed_at` | `timestamptz` | YES | `null` | Waktu opname diselesaikan (status menjadi `selesai`). Berbeda dari `created_at` yang mencatat waktu opname dimulai |

**Migrasi data yang diperlukan:**

- Semua record dengan `status = 'proses'` perlu diubah menjadi `'sedang_dilaksanakan'`
- Semua record dengan `status = 'selesai'` tetap `'selesai'`, dan `completed_at` di-backfill dari `updated_at`

### 10.2 Perubahan pada Tabel `opname_detail`

| Perubahan | Kolom | Tipe Data | Nullable | Default | Keterangan |
| --- | --- | --- | --- | --- | --- |
| **TAMBAH** | `stok_final` | `integer` | YES | `null` | Menyimpan jumlah stok akhir yang diputuskan user di Tahap 3. Saat ini kolom ini belum ada — stok final belum dicatat |

> **Catatan:** Kolom `stok_fisik`, `stok_sistem`, `selisih`, `alasan`, dan `status` sudah ada dan memadai. Kolom `status` pada `opname_detail` (`pending`, `sesuai`, `disesuaikan`) tetap digunakan sebagai penanda per-item.
> 

### 10.3 Perubahan pada Tabel `opname_schedule`

| Perubahan | Kolom | Tipe Data | Nullable | Default | Keterangan |
| --- | --- | --- | --- | --- | --- |
| **TAMBAH** | `durasi_pengerjaan` | `integer` | YES | `null` | Batas waktu (dalam hari) untuk menyelesaikan opname sejak tanggal jadwal. Ditampilkan di halaman Konfigurasi Opname |

### 10.4 Ringkasan Perubahan Database

```sql
-- ============================================
-- MIGRATION: Refactor Modul Stock Opname
-- ============================================

-- 1. Tabel opname: Tambah kolom baru
ALTER TABLE opname ADD COLUMN current_step smallint DEFAULT 1;
ALTER TABLE opname ADD COLUMN selected_obat_ids jsonb DEFAULT null;
ALTER TABLE opname ADD COLUMN completed_at timestamptz DEFAULT null;

-- 2. Tabel opname: Migrasi status lama ke status baru
UPDATE opname SET status = 'sedang_dilaksanakan' WHERE status = 'proses';
-- Backfill completed_at untuk opname yang sudah selesai
UPDATE opname SET completed_at = updated_at WHERE status = 'selesai';

-- 3. Tabel opname: Ubah default status
ALTER TABLE opname ALTER COLUMN status SET DEFAULT 'belum_dilaksanakan';

-- 4. Tabel opname_detail: Tambah kolom stok_final
ALTER TABLE opname_detail ADD COLUMN stok_final integer DEFAULT null;

-- 5. Tabel opname_schedule: Tambah kolom durasi_pengerjaan
ALTER TABLE opname_schedule ADD COLUMN durasi_pengerjaan integer DEFAULT null;
```

### 10.5 ERD Terkait Opname (Setelah Perubahan)

```
opname_schedule (1)
│  ├── nama (text)
│  ├── tanggal_audit (integer)
│  ├── waktu_jam (smallint)
│  ├── waktu_menit (smallint)
│  ├── pengulangan (text)
│  ├── obat_ids (jsonb)
│  ├── durasi_pengerjaan (integer)        ← BARU
│  ├── is_active (boolean)
│  └── audit columns...
│
└──< opname (N)
    ├── schedule_id (FK → opname_schedule)
    ├── tanggal_jadwal (date)
    ├── status (text)                     ← DIUBAH: 'belum_dilaksanakan'|'sedang_dilaksanakan'|'selesai'
    ├── current_step (smallint)           ← BARU
    ├── selected_obat_ids (jsonb)         ← BARU
    ├── completed_at (timestamptz)        ← BARU
    └── audit columns...
    │
    └──< opname_detail (N)
        ├── opname_id (FK → opname)
        ├── obat_id (FK → master_obat)
        ├── stok_fisik (integer)
        ├── stok_sistem (integer)
        ├── selisih (integer)
        ├── stok_final (integer)          ��� BARU
        ├── status (text)
        ├── alasan (text)
        └── audit columns...
```

---

### 11. User Flow Diagram

```
Sidebar
  └── Stock Opname
        ├── Riwayat Opname ─────────────────────────────────────────┐
        │     ├── [Opname Mendatang] ── Mulai Opname ──┐            │
        │     │                                        ▼            │
        │     │                              Tahap 1: Pilih Obat    │
        │     │                              (checklist dari jadwal) │
        │     │                                   │                 │
        │     │                            [Simpan Draft]           │
        │     │                                   │                 │
        │     │                                   ▼                 │
        │     │                              Tahap 2: Input         │
        │     │                              Stok Fisik             │
        │     │                                   │                 │
        │     │                            [Simpan Draft]           │
        │     │                                   │                 │
        │     │                                   ▼                 │
        │     │                              Tahap 3:               │
        │     │                              Penyesuaian Stok       │
        │     │                              + Alasan (wajib jika   │
        │     │                                selisih ≠ 0)         │
        │     │                                   │                 │
        │     │                            [Simpan Draft]           │
        │     │                                   │                 │
        │     │                                   ▼                 │
        │     │                              Opname Selesai         │
        │     │                              (status → selesai,     │
        │     │                               update master_obat.qty)
        │     │                                                     │
        │     ├── [Draft/Sedang Dilaksanakan] ── Lanjutkan Opname   │
        │     │                                   │                 │
        │     │                                   ▼                 │
        │     │                          Lanjut ke Tahap terakhir   │
        │     │                          (current_step)             │
        │     │                                                     │
        │     ├── [Riwayat Opname] ── Lihat Detail ── Halaman Baru  │
        │     │                       (Tabel: nama, stok sistem,    │
        │     │                        stok fisik, selisih,         │
        │     │                        stok final, alasan)          │
        │     │                                                     │
        │     └── [Panel Kanan] ── Ubah Konfigurasi ──────────┐    │
        │                                                      │    │
        └── Konfigurasi Opname (BARU) ◄────────────────────────┘    │
              │                                                     │
              ├── Tabel Jadwal Opname                               │
              │   (nama, tgl audit, jml obat, status,               │
              │    durasi pengerjaan, pengulangan)                   │
              ├── [Tambah Jadwal]                                   │
              ├── [Edit Jadwal]                                     │
              └── [Hapus Jadwal]                                    │
```

---

### 12. Non-Functional Requirements

| Aspek | Ketentuan |
| --- | --- |
| Responsivitas | Layout 70:30 harus responsif; pada layar kecil panel kanan pindah ke bawah |
| Performa | List riwayat opname mendukung pagination jika data banyak |
| UX Consistency | Mengikuti design system dan komponen UI yang sudah ada di aplikasi |
| Data Integrity | Saat opname dimulai, stok sistem di-snapshot ke `opname_detail.stok_sistem` agar tidak berubah meskipun ada transaksi baru |
| Draft Reliability | Draft disimpan ke database (bukan hanya localStorage) agar bisa diakses dari perangkat lain |
| Backward Compatibility | Data opname lama dengan status `proses` harus dimigrasi ke `sedang_dilaksanakan` |

---

### 13. Acceptance Criteria

| # | Kriteria | Kondisi Terpenuhi |
| --- | --- | --- |
| 1 | Sidebar menampilkan menu Stock Opname dengan sub-menu Riwayat Opname dan Konfigurasi Opname | ✅ Menu dan sub-menu tampil dan bisa dinavigasi |
| 2 | Halaman Riwayat Opname menampilkan layout 70:30 dengan section yang benar | ✅ Opname mendatang di kiri-atas, riwayat di kiri-bawah, info jadwal di kanan |
| 3 | Panel kanan menampilkan tanggal opname berikutnya dan frekuensi | ✅ Data sesuai jadwal aktif |
| 4 | Tombol "Ubah Konfigurasi" mengarahkan ke halaman Konfigurasi Opname | ✅ Navigasi berhasil |
| 5 | Halaman Konfigurasi Opname menampilkan tabel jadwal dengan semua kolom yang ditentukan | ✅ Semua kolom tampil termasuk durasi pengerjaan |
| 6 | Proses opname memiliki 3 tahap berurutan | ✅ Tahap 1 (pilih obat) → Tahap 2 (input stok fisik) → Tahap 3 (penyesuaian) |
| 7 | Tahap 1 menampilkan obat dari jadwal yang sudah ter-checklist dan user bisa mengubah pilihan | ✅ Checklist berfungsi |
| 8 | Validasi alasan wajib diisi jika selisih ≠ 0 | ✅ Form tidak bisa di-submit tanpa alasan ketika ada selisih |
| 9 | Fitur Simpan Draft berfungsi di setiap tahap | ✅ Data tersimpan dan bisa dilanjutkan |
| 10 | Detail opname (riwayat) menampilkan tabel lengkap termasuk stok final | ✅ Semua kolom tampil di halaman baru |
| 11 | Migrasi database berjalan tanpa error dan data lama tetap konsisten | ✅ Status lama berhasil dimigrasi |
| 12 | Setelah opname selesai, `master_obat.qty` diperbarui sesuai `stok_final` | ✅ Stok di master obat terupdate |

---