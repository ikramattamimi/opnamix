# Fase 6: Memecah Komponen Besar

## Why
Beberapa komponen menggabungkan daftar, filter, modal detail, form edit, dan
logika bisnis dalam satu file:

| Komponen | Baris | `useState` | Isi |
|---|---|---|---|
| `StockOutManagement.tsx` | 1291 | 13 | daftar, filter, modal detail, mode edit, mode proses (diskon, biaya layanan), timeline |
| `UserManagement.tsx` | 920 | 20 | daftar, form tambah/edit, role, reset password |
| `PelaksanaanOpnamePage.tsx` | 849 | 14 | 3 langkah opname dalam satu komponen |
| `StockReport.tsx` | 724 | 17 | dua laporan, filter tanggal, export |
| `RiwayatOpnamePage.tsx` | 632 | 17 | |
| `StockOutRequestForm.tsx` | 627 | 14 | |
| `KonfigurasiOpnamePage.tsx` | 562 | 13 | |

Perhitungan total, diskon, dan biaya layanan (`getRequestTotals` dan
`getDetailTotals`) ada di dalam komponen, sehingga tidak bisa dites. Form juga
tidak memakai library maupun skema validasi.

## What
Tidak ada komponen di atas ~300 baris. Logika bisnis ada di fungsi murni yang
dites. Form memakai `react-hook-form` + `zod`.

## Constraints
### Must
- Satu PR per halaman
- Kerjakan berurutan: ekstrak logika ke fungsi murni dan tes dulu, baru pecah
  UI
- State yang hanya dipakai oleh sub-komponen dipindah ke sub-komponen itu
- Skema `zod` dipakai bersama oleh form dan (kalau memungkinkan) validasi
  sebelum memanggil RPC

### Must Not
- Mengubah tampilan, teks, atau alur pengguna
- Memakai global state library (Redux, Zustand). React Query + state lokal
  sudah cukup

### Out of Scope
- Redesain UI (fase 7 hanya menyeragamkan)

## Current State
- Relevant files: tabel di atas (sekarang di `src/features/<domain>/`),
  `src/features/*/*Columns.tsx`, `src/features/products/ProductForm.tsx`,
  `src/features/stock-in/StockInForm.tsx`,
  `src/features/stock-out/StockOutManualForm.tsx`
- Struktur: folder fitur saat ini datar. Sub-komponen hasil pemecahan
  diletakkan di `src/features/<domain>/components/`, sedangkan halaman tetap
  di root folder fitur.
- Existing patterns: `*Columns.tsx` (definisi kolom TanStack Table terpisah
  dari halaman) sudah bagus dan dipertahankan. `.ai/specs/form-loading-state.md`
  (prop `isLoading` di form)

## Tasks

### T1: Logika stok keluar ke fungsi murni
**What:** Buat `features/stock-out/calculations.ts` berisi
`calculateRequestTotals(req, discountOverride?)` dan helper perubahan item
(`updateDrug`, `addDrug`, `removeDrug`, `toggleService`) sebagai fungsi murni.
Lengkapi test dari fase 3.
**Files:** `features/stock-out/calculations.ts`, `*.test.ts`
**Verify:** `pnpm test` lolos, dan total di modal detail sama seperti sebelum
refactor.

### T2: Pecah StockOutManagement
**What:** Pecah menjadi:
- `StockOutPage`: layout, tab, dan pemilihan modal
- `StockOutTable`: tabel, filter, dan pagination
- `StockOutDetailDialog`: tampilan detail
- `StockOutEditForm`: mode edit, memakai `useReducer` atau `react-hook-form`
- `StockOutProcessPanel`: diskon, biaya layanan, dan tombol proses
- `StockOutTimeline`

Helper format tanggal (`formatDateForDisplay` dan
`formatDateTimeForDisplay`) dipindah ke `lib/format.ts`.
**Files:** `features/stock-out/components/*`, `lib/format.ts`
**Verify:** Semua alur stok keluar (manual, permintaan nakes, edit, proses,
lihat bukti) sama seperti sebelumnya.

### T3: Pecah PelaksanaanOpnamePage per langkah
**What:** `OpnameStepper` dengan `StepSelectProducts`, `StepPhysicalCount`, dan
`StepResolveDifferences`. Setiap langkah memakai mutation dari fase 5.
**Files:** `features/opname/components/pelaksanaan/*`
**Verify:** Maju dan mundur antar langkah, simpan draft, lalu lanjutkan dari
draft.

### T4: Pecah UserManagement
**What:** `UserTable`, `UserFormDialog` (`react-hook-form` + `zod` untuk
email, nama, role, dan password), serta `ResetPasswordDialog`.
**Files:** `features/users/components/*`
**Verify:** Tambah, edit role, nonaktifkan, dan reset password berjalan, dan
pesan validasi muncul di field yang salah.

### T5: Pecah StockReport dan halaman opname lainnya
**What:** `StockReport` dipecah menjadi `TransactionReport`,
`StockMutationReport`, dan `DateRangeFilter` (yang dipakai bersama).
`RiwayatOpnamePage` dan `KonfigurasiOpnamePage` dipecah menjadi tabel dan
dialog.
**Files:** `features/reports/components/*`, `features/opname/components/*`
**Verify:** Filter tanggal, pagination, dan export berjalan di kedua laporan.

### T6: Form lain ke react-hook-form + zod
**What:** `ProductForm`, `StockInForm`, `StockOutManualForm`,
`StockOutRequestForm`, dan form jasa di `ServiceManagement`. Pertahankan prop
`isLoading` dari spec form-loading-state.
**Files:** form-form di atas
**Verify:** Submit dengan field wajib kosong menampilkan pesan per field dan
tidak memanggil API.
