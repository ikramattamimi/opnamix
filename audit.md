## Audit Kesiapan Aplikasi — PMB Anita

Ditemukan **47+ masalah** yang dikelompokkan berdasarkan prioritas. Berikut ringkasannya:

---

### P0 — CRITICAL (Harus diperbaiki sebelum deploy)

| # | Masalah | File |
| --- | --- | --- |
| 1 | **Kredensial hardcoded** — Supabase URL & key sebagai fallback langsung di source code | supabaseClient.ts |
| 2 | **File env tanpa titik** — S3 access key, secret key, dan Supabase key tersimpan di version control (seharusnya `.env` dan masuk .gitignore) | env |
| 3 | **`console.log` dump SEMUA env vars** ke browser console | supabaseClient.ts |
| 4 | **Tombol quick login** menampilkan email & password asli (`admin@test.com / password123`) di UI produksi | LoginPage.tsx |
| 5 | **Race condition stock** — Read-then-write tanpa transaksi/lock di server, bisa menyebabkan stok salah saat akses bersamaan | api.ts dan api.ts |

---

### P1 — HIGH (Sangat penting untuk UX & keamanan)

| # | Masalah | File |
| --- | --- | --- |
| 6 | **Tidak ada route-level auth guard** — User `nakes` bisa akses halaman admin lewat URL langsung | App.tsx |
| 7 | **15x `alert()` bawaan browser** — Tidak konsisten, seharusnya pakai toast system yang sudah ada | ProductManagement.tsx, ServiceManagement.tsx, StockInManagement.tsx, dll |
| 8 | **Tidak ada route 404** — URL yang tidak ada menampilkan halaman kosong | App.tsx |
| 9 | **Data hardcoded di Dashboard** — Chart mingguan, `+2.45%`, pie chart semuanya data palsu | Dashboard.tsx |
| 10 | **Nama hardcoded** — `receivedBy` dan `auditor` selalu `'Bidan Anita'` | api.ts, api.ts, api.ts |
| 11 | **`createdBy` placeholder** — Masih `'placeholder-user-id'` | StockOutRequestForm.tsx |
| 12 | **Supplier & nakes hardcoded** — Datalist supplier dan dropdown nakes bukan dari database | StockInForm.tsx, StockOutRequestForm.tsx |
| 13 | **Link "Lupa Password?"** tidak berfungsi (`href="#"`) | LoginPage.tsx |

---

### P2 — MEDIUM (Validasi form & konsistensi)

**Validasi Form:**

| # | Masalah | File |
| --- | --- | --- |
| 14 | **StockInForm** — Hanya validasi invoice number. Quantity bisa 0/negatif, tidak ada pesan error, expiry date tidak dicek | StockInForm.tsx, StockInForm.tsx |
| 15 | **StockOutRequestForm** — Quantity input tanpa `min` attribute, browser izinkan nilai negatif | StockOutRequestForm.tsx |
| 16 | **ProductForm** — Nilai negatif bisa di-paste, tidak ada max length untuk nama | ProductForm.tsx |
| 17 | **LoginPage** — Tidak ada validasi format email atau panjang minimum password, error message Supabase ditampilkan mentah | LoginPage.tsx |
| 18 | **UserManagement** — Tidak ada validasi format email saat tambah user | UserManagement.tsx |
| 19 | **KonfigurasiOpname** — `handleSave` tidak validasi sebelum simpan, `dayOfMonth` tidak dibatasi 1-28 | KonfigurasiOpnamePage.tsx |
| 20 | **ProfilePage** — Password tanpa complexity requirement, tidak perlu current password | ProfilePage.tsx |

**Konsistensi Bahasa (Campur Indonesia/Inggris):**

| # | Masalah | File |
| --- | --- | --- |
| 21 | `"Email Address"` & `"Password"` harusnya Bahasa Indonesia | LoginPage.tsx, LoginPage.tsx |
| 22 | `"All rights reserved."` di footer | LoginPage.tsx |
| 23 | `"PNG, JPG and GIF files are allowed"` di upload text | StockInForm.tsx |
| 24 | `"Exp Date"` harusnya `"Tanggal Kedaluwarsa"` | StockInForm.tsx |

**Error Handling:**

| # | Masalah | File |
| --- | --- | --- |
| 25 | **Tidak ada error feedback ke user** saat fetch gagal di Dashboard, StockReport, timeline | Dashboard.tsx, StockReport.tsx, StockOutManagement.tsx |
| 26 | **Tidak ada rollback** jika update stok gagal di tengah proses (partial update) | api.ts |
| 27 | **Divide by zero** — `totalItems` bisa 0 di Dashboard | Dashboard.tsx |
| 28 | **Product fetch error** pada StockInForm tidak ditangani — list kosong tanpa penjelasan | StockInForm.tsx |

**63x Console Statements di Production:**

| # | Masalah | File |
| --- | --- | --- |
| 29 | Ada **63 `console.log/error/warn`** tersebar di seluruh codebase yang akan muncul di browser DevTools | Banyak file |

---

### P3 — LOW (Polish & code quality)

| # | Masalah | File |
| --- | --- | --- |
| 30 | **30+ penggunaan `any` type** — mengurangi type safety | api.ts, App.tsx, useStockOut.ts |
| 31 | **`@ts-nocheck`** di ErrorBoundary, `@ts-ignore` di App | ErrorBoundary.tsx, App.tsx |
| 32 | **Dead/legacy code** — Unused state di App, commented-out footer, unused `ViewType` | App.tsx, types.ts |
| 33 | **Missing loading states** — StockInForm, StockOutRequestForm, StockOutManualForm tidak tampilkan spinner saat fetch | Multiple |
| 34 | **Accessibility** — Hanya 1 `aria-label` di seluruh app, tidak ada `htmlFor`/`id` pairing pada form labels, modal tanpa focus trap, `<div onClick>` tidak keyboard-navigable | Multiple |
| 35 | **`perPage: 1000`** untuk product lookup — akan lambat seiring data bertambah | StockInForm.tsx, StockOutManualForm.tsx |
| 36 | **Reset form tanpa konfirmasi** | ProductForm.tsx |

---

### Rekomendasi Urutan Pengerjaan

1. **Fase 1 (P0)** — Perbaiki semua masalah keamanan: rename `env` → `.env`, hapus hardcoded credentials, hapus quick login buttons, hapus `console.log` env vars
2. **Fase 2 (P1)** — Tambah route auth guard, ganti semua `alert()` dengan toast, tambah 404 page, ganti data hardcoded dengan data real, perbaiki placeholder user ID
3. **Fase 3 (P2)** — Perbaiki semua validasi form, seragamkan bahasa ke Bahasa Indonesia, tambah error handling yang proper
4. **Fase 4 (P3)** — Clean up `any` types, hapus dead code, console statements, tambah loading states, accessibility improvements

Asked a question (Next Steps)

## Plan: Fase 1 — Security Fixes (P0)

Fase ini fokus memperbaiki 5 masalah keamanan kritikal agar aplikasi aman untuk deploy ke client. Semua perubahan bersifat penghapusan/penyembunyian kredensial dan penambahan pengaman dasar.

**Steps**

1. **Rename env → `.env` dan tambahkan ke .gitignore**
    - Rename file env menjadi `.env`
    - Buat atau update file .gitignore — tambahkan entry `.env`
    - Jalankan `git rm --cached env` untuk menghapus file lama dari tracking
2. **Hapus hardcoded fallback credentials di `supabaseClient.ts`**
    - Di supabaseClient.ts, hapus fallback string `'<https://yaxcykkbnnissedrbtxm.supabase.co>'` dan anon key. Ganti dengan `throw new Error('Missing VITE_SUPABASE_URL')` jika env var tidak ada, agar aplikasi gagal jelas (fail fast) saat env belum diset
    - Hapus supabaseClient.ts — ini mengekspos semua environment variables ke browser console
3. **Hapus hardcoded Supabase project ref di `api.ts`**
    - Di api.ts, ganti hardcoded `yaxcykkbnnissedrbtxm` dengan referensi dari env var `VITE_SUPABASE_URL` (parse domain dari URL)
4. **Hapus tombol quick login di `LoginPage.tsx`**
    - Hapus seluruh section quick login buttons di LoginPage.tsx yang menampilkan `admin@test.com / password123`, `admin@uniera.ac.id / password123`, `nakes@uniera.ac.id / password123`
    - Opsi alternatif: bungkus dengan `import.meta.env.DEV` check agar hanya muncul di development
5. **Tambah komentar/TODO untuk race condition stock**
    - Di api.ts dan api.ts, tambahkan `// TODO: Migrate to Supabase RPC/database function for atomic stock update` sebagai penanda untuk perbaikan di fase berikutnya — fix sejati memerlukan stored procedure di Supabase, bukan perubahan frontend saja

**Verification**

- Pastikan `.env` tidak ter-commit ke git: `git status` harus menunjukkan `.env` sebagai untracked
- Buka aplikasi tanpa `.env` → harus tampil error jelas, bukan fallback ke credentials lama
- Login page tidak menampilkan tombol quick login di production build (`pnpm build && pnpm preview`)
- Buka browser DevTools Console → tidak ada env vars yang di-dump

**Decisions**

- Quick login buttons: sebaiknya dibungkus `import.meta.env.DEV` (bukan dihapus total) agar masih berguna saat development
- Race condition: ditandai TODO saja karena fix sejati memerlukan Supabase RPC/stored procedure, bukan scope frontend