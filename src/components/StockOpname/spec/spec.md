# Spesifikasi Modul Stock Opname

> Single source of truth untuk modul Stok Opname aplikasi Opnamix.  
> Terakhir diperbarui: 2026-03-15

---

## 1. Gambaran Umum

Modul **Stok Opname** digunakan untuk melakukan audit fisik stok obat secara berkala. Modul ini mencakup:

- Konfigurasi **jadwal** opname (periodik/manual)
- **Pelaksanaan** opname 3 tahap
- **Lock** aplikasi selama opname berlangsung
- **Riwayat** dan detail hasil opname

### 1.1 Jalur Navigasi

| Path                                       | Komponen                | Deskripsi                                         |
| ------------------------------------------ | ----------------------- | ------------------------------------------------- |
| `/audit/stok-opname/riwayat`               | `RiwayatOpnamePage`     | Halaman utama — daftar opname mendatang & riwayat |
| `/audit/stok-opname/konfigurasi`           | `KonfigurasiOpnamePage` | Kelola jadwal opname                              |
| `/audit/stok-opname/pelaksanaan/:opnameId` | `PelaksanaanOpnamePage` | Proses 3 tahap opname                             |
| `/audit/stok-opname/detail/:opnameId`      | `DetailOpnamePage`      | View-only hasil opname selesai                    |
| `*` (global, jika lock aktif)              | `OpnameLockPage`        | Layar kunci saat opname berjalan di tahap ≥ 2     |

---

## 2. Entitas & Database

Lihat detail: [spec_data.md](./spec_data.md)

### Ringkasan Tabel

| Tabel DB          | Tujuan                                          |
| ----------------- | ----------------------------------------------- |
| `opname_schedule` | Konfigurasi jadwal berulang                     |
| `opname`          | Header setiap sesi opname                       |
| `opname_detail`   | Baris per-produk dalam satu sesi opname         |
| `master_obat`     | Referensi produk (stok diperbarui saat selesai) |

---

## 3. Alur Bisnis Inti

### 3.1 Siklus Hidup Opname

```
[Buat Opname] → status: belum_dilaksanakan, step: 1
       ↓
[Step 1: Pilih Obat] → completeStepOne()
       ↓
status: sedang_dilaksanakan, step: 2
** LOCK AKTIF: aplikasi terkunci untuk role nakes **
       ↓
[Step 2: Input Stok Fisik] → saveDraft(step: 3)
       ↓
step: 3
** LOCK DICABUT: aplikasi kembali normal **
** Tidak bisa kembali ke step 2 **
       ↓
[Step 3: Penyesuaian Stok] → finishOpname()
       ↓
status: selesai, stok master_obat diperbarui
```

### 3.2 Backward Navigation (Kembali ke Tahap Sebelumnya)

| Dari → Ke       | Aksi API                   | Efek                                                                                    |
| --------------- | -------------------------- | --------------------------------------------------------------------------------------- |
| Step 2 → Step 1 | `backwardToStepOne()`      | Hapus semua `opname_detail`, reset status ke `belum_dilaksanakan`, step → 1             |
| Step 3 → Step 2 | ❌ **Tidak diperbolehkan** | Lock sudah dicabut; mundur ke step 2 akan mengaktifkan lock lagi, yang tidak diinginkan |

### 3.3 Lock Mekanisme

Lock aktif **hanya** saat `opname` dengan `status = 'sedang_dilaksanakan'` **DAN** `current_step = 2`.

> **Perubahan dari desain awal:** Lock sebelumnya aktif di `current_step >= 2`. Sekarang lock hanya aktif di step 2 saja. Ketika advance ke step 3, lock dicabut otomatis karena query condition tidak terpenuhi lagi.

Dicek via `api.getActiveOpnameLock()` yang dipanggil oleh hook `useOpnameLock` (polling setiap 30 detik + initial check).

**Perilaku per role:**

| Role                   | Perilaku saat lock (step 2)                                              |
| ---------------------- | ------------------------------------------------------------------------ |
| `admin`                | Lihat info opname + akses "Lanjutkan Opname" + pesan "Menu Lain Dikunci" |
| `apoteker` / `farmasi` | Lihat info opname + akses "Lanjutkan Opname" + pesan "Aplikasi Dikunci"  |
| `nakes`                | Layar tunggu, tombol "Cek Status Opname", tidak bisa akses apapun        |

---

## 4. Komponen & Tanggung Jawab

### 4.1 `KonfigurasiOpnamePage`

Kelola jadwal opname (CRUD + toggle aktif/nonaktif).

**State utama:**

- `schedules` — daftar `OpnameSchedule[]`
- `allProducts` — semua produk aktif (untuk pemilihan obat di jadwal)
- `formData: OpnameScheduleConfig` — data form jadwal
- `modalStep: 1 | 2` — langkah di modal (Info Jadwal → Pilih Obat)
- `selectAll: boolean` — apakah semua obat dipilih
- `selectedObatIds: Set<string>` — obat terpilih jika tidak semua

**Field form jadwal:**

| Field              | Tipe                         | Default   | Keterangan               |
| ------------------ | ---------------------------- | --------- | ------------------------ |
| `nama`             | string                       | `''`      | Nama jadwal (wajib)      |
| `pengulangan`      | `BULANAN\|TRIWULAN\|TAHUNAN` | `BULANAN` | Frekuensi                |
| `dayOfMonth`       | number (1–28)                | `28`      | Tanggal audit tiap bulan |
| `waktuJam`         | number                       | `10`      | Jam mulai                |
| `waktuMenit`       | number                       | `0`       | Menit mulai              |
| `durasiPengerjaan` | number                       | `7`       | Durasi pengerjaan (hari) |
| `obatIds`          | `string[] \| null`           | `null`    | null = semua obat        |

Lihat detail UI & validasi: [spec_ui.md](./spec_ui.md#konfigurasi)

### 4.2 `RiwayatOpnamePage`

Halaman utama yang menampilkan daftar opname dan memungkinkan pembuatan opname manual.

**State utama:**

- `upcoming: OpnameCard[]` — opname status `belum_dilaksanakan`
- `drafts: OpnameCard[]` — opname status `sedang_dilaksanakan`
- `history: OpnameCard[]` — opname status `selesai`
- `activeSchedules: ScheduleInfo[]` — jadwal aktif untuk sidebar/strip
- `searchUpcoming, searchHistory` — filter teks

**Fitur:**

- Search/filter upcoming & riwayat (by `scheduleName`, `opnameNumber`)
- Tambah opname **manual** (pilih jadwal + tentukan tanggal)
- Hapus opname (dengan konfirmasi)
- Mobile: FAB + schedule strip collapsible

### 4.3 `PelaksanaanOpnamePage`

Proses 3 tahap interaktif. Diakses via `/audit/stok-opname/pelaksanaan/:opnameId`.

Detail lengkap: [spec_pelaksanaan.md](./spec_pelaksanaan.md)

### 4.4 `DetailOpnamePage`

View-only untuk opname yang sudah selesai (`status = 'selesai'`).

**Menampilkan:**

- Info opname (kode, jadwal, tanggal dilaksanakan)
- Statistik: total item, jumlah sesuai, jumlah selisih
- Tabel jurnal penyesuaian per produk (stok sistem, fisik, selisih, final, alasan)
- Search produk di dalam tabel

### 4.5 `OpnameLockPage`

Ditampilkan secara global (oleh layout utama) saat lock aktif.

Menerima props:

- `opname: OpnameLockInfo` — info opname yang sedang berjalan
- `onRefresh: () => void` — callback untuk re-check lock state

---

## 5. Hook & Utilitas

### `useOpnameLock` (`hooks/useOpnameLock.ts`)

```ts
interface OpnameLockState {
  isLocked: boolean;
  opname: OpnameLockInfo | null;
  isLoading: boolean;
}

function useOpnameLock(): OpnameLockState & { refetch: () => Promise<void> };
```

- Polling `api.getActiveOpnameLock()` setiap **30 detik**
- Initial check saat mount
- `refetch()` untuk check manual (dipakai oleh nakes setelah klik "Cek Status")

---

## 6. API Layer (Ringkasan)

Lihat detail lengkap: [spec_api.md](./spec_api.md)

| Method                                     | Deskripsi                                                   |
| ------------------------------------------ | ----------------------------------------------------------- |
| `getOpnameSchedules()`                     | Ambil semua jadwal (termasuk nonaktif, kecuali dihapus)     |
| `createOpnameSchedule(config)`             | Buat jadwal baru                                            |
| `updateOpnameSchedule(id, config)`         | Edit jadwal                                                 |
| `deleteOpnameSchedule(id)`                 | Soft-delete jadwal                                          |
| `toggleOpnameScheduleStatus(id, bool)`     | Aktifkan/nonaktifkan jadwal                                 |
| `getActiveSchedules()`                     | Jadwal aktif + kalkulasi `nextDate`                         |
| `startOpname(scheduleId, date)`            | Buat sesi opname baru                                       |
| `getUpcomingOpnames()`                     | Opname `belum_dilaksanakan`                                 |
| `getDraftOpnames()`                        | Opname `sedang_dilaksanakan`                                |
| `getOpnameHistory()`                       | Opname `selesai`                                            |
| `getOpnameById(id)`                        | Detail satu opname + item-nya                               |
| `completeStepOne(id, productIds[])`        | Konfirmasi pemilihan obat, buat detail rows, advance step 2 |
| `backwardToStepOne(id, scheduleObatIds[])` | Hapus detail rows, reset ke step 1                          |
| `saveDraft(id, step, updates[])`           | Simpan progress (step + data fisik/final/alasan)            |
| `finishOpname(id)`                         | Selesaikan opname, update stok master                       |
| `deleteOpname(id)`                         | Hapus opname + detail (cascade manual)                      |
| `getOpnameDetailView(id)`                  | Ambil detail view untuk halaman hasil                       |
| `getActiveOpnameLock()`                    | Cek status lock global                                      |

---

## 7. Notifikasi yang Dipicu

| Event                   | Tipe Notif            | Target Role              |
| ----------------------- | --------------------- | ------------------------ |
| Opname dibuat           | `OPNAME_CREATED`      | admin, farmasi           |
| Step 1 → 2 (lock aktif) | `OPNAME_STEP_CHANGED` | admin, apoteker, farmasi |
| Step 2 → 3              | `OPNAME_STEP_CHANGED` | admin, apoteker, farmasi |
| Backward step 2 → 1     | `OPNAME_STEP_CHANGED` | admin, apoteker, farmasi |
| Backward step 3 → 2     | `OPNAME_STEP_CHANGED` | admin, apoteker, farmasi |
| Opname selesai          | `OPNAME_COMPLETED`    | admin, apoteker, farmasi |

---

## 8. Sub-Spec Terkait

| File                                         | Isi                                               |
| -------------------------------------------- | ------------------------------------------------- |
| [spec_data.md](./spec_data.md)               | Skema database, tipe data, status enum            |
| [spec_pelaksanaan.md](./spec_pelaksanaan.md) | Detail proses 3 tahap pelaksanaan opname          |
| [spec_api.md](./spec_api.md)                 | Kontrak API lengkap setiap method                 |
| [spec_ui.md](./spec_ui.md)                   | Spesifikasi UI per halaman, validasi, pesan error |
