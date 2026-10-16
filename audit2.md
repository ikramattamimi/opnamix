## Audit Kesiapan Aplikasi v2 — PMB Anita

**Tanggal:** 17 Februari 2026
**Perbandingan dengan:** audit.md (audit v1)

---

### Ringkasan Perbandingan

| Kategori | Audit v1 | Status Saat Ini |
|----------|----------|-----------------|
| P0 — Critical | 5 masalah | **3 FIXED**, 2 masih ada |
| P1 — High | 8 masalah | **7 FIXED** (1 partial), 1 masih ada |
| P2 — Medium | 16 masalah | **1 FIXED**, 3 partial, 12 masih ada |
| P3 — Low | 7 masalah | **0 FIXED**, 7 masih ada |
| **BARU** | — | **20 masalah baru ditemukan** |
| **Total** | **47 masalah** | **11 fixed, 4 partial, 41 masih/baru** |

---

## BAGIAN A: Status Masalah dari Audit v1

### ✅ SUDAH DIPERBAIKI

| # | Masalah | File | Catatan |
|---|---------|------|---------|
| 1 | Kredensial hardcoded Supabase | supabaseClient.ts | Fallback URL & key dihapus, diganti `throw new Error()` jika env var kosong |
| 2 | File `env` tanpa titik | root | File `env` sudah tidak ada, `.gitignore` sudah mencakup `.env` |
| 3 | `console.log` dump semua env vars | supabaseClient.ts | Semua console.log dihapus dari file ini |
| 6 | Tidak ada route-level auth guard | App.tsx | `ProtectedRoute` component sudah diterapkan dengan `allowedRoles` |
| 7 | 15x `alert()` bawaan browser | Multiple | Semua `alert()` sudah dihapus (0 sisa), diganti toast |
| 8 | Tidak ada route 404 | App.tsx | `NotFoundPage` component + catch-all `<Route path="*">` sudah ada |
| 10 | Nama hardcoded `'Bidan Anita'` | api.ts | Diganti dynamic lookup `t.profiles?.full_name \|\| 'Admin'` |
| 11 | `createdBy` placeholder `'placeholder-user-id'` | StockOutRequestForm.tsx | Diganti `userId` dari `useAuth()` |
| 12 | Supplier & nakes hardcoded | StockInForm.tsx, StockOutRequestForm.tsx | Keduanya sudah fetch dari database |
| 13 | Link "Lupa Password?" `href="#"` | LoginPage.tsx | Section di-comment out (fitur dinonaktifkan) |
| 21-24 | Bahasa campur Indonesia/Inggris | LoginPage.tsx, StockInForm.tsx | Label sudah diterjemahkan ke Bahasa Indonesia |

### ⚠️ SEBAGIAN DIPERBAIKI

| # | Masalah | File | Status |
|---|---------|------|--------|
| 9 | Data hardcoded di Dashboard | Dashboard.tsx | Stat cards & chart sudah pakai API. **Masih hardcoded:** `+2.45%` pertumbuhan (L107), pie chart `conic-gradient` derajat (L189-190), data konsumsi mingguan (L124) |
| 15 | StockOutRequestForm quantity tanpa `min` | StockOutRequestForm.tsx | JS validation sudah ada (`quantity <= 0` ditolak). **Masih kurang:** HTML `min` attribute belum ditambahkan |
| 16 | ProductForm negative paste & max length | ProductForm.tsx | Validasi negatif sudah ada (`min="0"` + JS check). **Masih kurang:** tidak ada `maxLength` untuk nama produk |
| 19 | KonfigurasiOpname validasi | KonfigurasiOpnamePage.tsx | HTML `min="1" max="28"` sudah ada untuk dayOfMonth, tombol disabled jika nama kosong. **Masih kurang:** `handleSave` tidak ada validasi sebelum simpan |

### ❌ MASIH ADA (Belum Diperbaiki)

---

### P0 — CRITICAL

| # | Masalah | File | Detail |
|---|---------|------|--------|
| 4 | **Tombol quick login** menampilkan email & password asli | LoginPage.tsx L85-L121 | 3 tombol demo login masih aktif: `admin@test.com`, `admin@uniera.ac.id`, `nakes@uniera.ac.id` semua dengan password `password123`. Tidak dibungkus `import.meta.env.DEV` |
| 5 | **Race condition stock** — Read-then-write tanpa transaksi | api.ts L333-349, L510-527 | Dua lokasi masih pakai pola SELECT→compute di JS→UPDATE tanpa database lock. Hanya ditambah komentar TODO |

### P1 — HIGH

| # | Masalah | File | Detail |
|---|---------|------|--------|
| 9* | **Dashboard data masih hardcoded (sebagian)** | Dashboard.tsx L107, L124, L189 | `+2.45%`, data konsumsi mingguan, dan derajat conic-gradient pie chart masih static |

### P2 — MEDIUM (Validasi Form)

| # | Masalah | File | Detail |
|---|---------|------|--------|
| 14 | **StockInForm validasi minimal** | StockInForm.tsx | Hanya cek `invoiceNumber`. Quantity bisa 0/negatif, expiry date bisa tanggal lampau, item tanpa produk bisa disubmit, tidak ada error message ke user |
| 17 | **LoginPage** — Tidak ada validasi password min length client-side | LoginPage.tsx L38 | Error Supabase ditampilkan mentah (misal `"Invalid login credentials"`) tanpa diterjemahkan |
| 18 | **UserManagement** — `handleAdd` tanpa validasi format email | UserManagement.tsx L120 | `handleAdd` dipanggil via `onClick` (bypass browser validation `type="email"`). `handleEdit` sudah ada cek `includes("@")` tapi `handleAdd` belum |
| 20 | **ProfilePage** — Password tanpa complexity & tanpa current password | ProfilePage.tsx L91 | Hanya cek min 6 karakter. Tidak ada requirement uppercase/angka/special char. Tidak minta current password |

### P2 — MEDIUM (Error Handling)

| # | Masalah | File | Detail |
|---|---------|------|--------|
| 25 | **Fetch gagal tanpa feedback ke user** | Dashboard.tsx L31/L46, StockReport.tsx L171, StockOutManagement.tsx L73 | Dashboard: data jadi 0 tanpa penjelasan. StockReport: tabel kosong. Timeline: "Belum ada riwayat" (padahal error) |
| 26 | **Tidak ada rollback** jika update stok gagal di tengah loop | api.ts L338-358 | Jika item ke-3 dari 5 gagal, item 1-2 sudah ter-update tanpa rollback |
| 27 | **Divide by zero** `totalItems` bisa 0 | Dashboard.tsx L179 | Jika semua nilai `categoryDistribution` = 0, akan tampil `NaN%` di UI |
| 28 | **Product fetch error** di StockInForm tidak ditangani | StockInForm.tsx L21 | Error state dari `useProducts` tidak di-destructure. List kosong tanpa penjelasan |

### P2 — MEDIUM (Console Statements)

| # | Masalah | File | Detail |
|---|---------|------|--------|
| 29 | **64 `console.log/error/warn`** di production code | 22 file | Naik dari 63 ke 64. File terbanyak: api.ts (6), PelaksanaanOpnamePage (5), KonfigurasiOpnamePage (5), RiwayatOpnamePage (5) |

### P3 — LOW

| # | Masalah | File | Detail |
|---|---------|------|--------|
| 30 | **88x `any` type** | 18 file | Naik dari 30+ ke 88. Terbanyak: api.ts (31), exportUtils.ts (9), PelaksanaanOpnamePage (10) |
| 31 | **`@ts-nocheck` & `@ts-ignore`** | ErrorBoundary.tsx L1, App.tsx L78 | Masih ada 2 directive |
| 32 | **Dead/legacy code** | App.tsx | Unused imports (`Category`, `Unit`, `ViewType`), legacy state `products`/`isLoading`, commented-out footer, double `QueryClientProvider` + `ToastProvider` wrapping |
| 33 | **Missing loading states** | StockOutRequestForm, StockOutManualForm, StockInForm | Submit button tanpa loading indicator atau disabled state saat proses |
| 34 | **Accessibility sangat minim** | Multiple | Hanya 1 `aria-label` di seluruh app, 0 `htmlFor`/`id` pairing, 0 focus trap di modal, 0 keyboard navigation |
| 35 | **`perPage: 1000`** hardcoded | 11 file | 11 occurrence `perPage: 1000` + 2 occurrence `perPage: 10000` di StockReport |
| 36 | **Reset form tanpa konfirmasi** | ProductForm.tsx L138 | Tombol Reset langsung hapus semua isian tanpa dialog konfirmasi |

---

## BAGIAN B: MASALAH BARU DITEMUKAN

### P1 — HIGH (Baru)

| # | Masalah | File | Detail |
|---|---------|------|--------|
| N1 | **StockOutManualForm: quantity `undefined` lolos validasi** | StockOutManualForm.tsx L79, L334 | Jika field quantity dikosongkan, nilainya `undefined`. Cek `undefined <= 0` menghasilkan `false` (NaN comparison), sehingga item tanpa quantity **lolos validasi** dan disubmit |
| N2 | **Tombol "Proses" bisa double-click** | StockOutManagement.tsx L649-660 | Tombol "Ya, Proses" tanpa loading/disabled state. Klik cepat berkali-kali bisa memproses request yang sama berulang |
| N3 | **Tidak ada validasi stok tersedia** | StockOutManualForm.tsx L79 | User bisa submit quantity lebih besar dari stok yang ada — tidak ada pengecekan terhadap stok aktual |
| N4 | **Pagination "Next" aktif saat 0 halaman** | PaginationControls.tsx L22-38 | Jika `totalPages=0`, tombol Next tetap aktif (karena `currentPage(1) !== totalPages(0)`). User bisa navigasi ke halaman 2 dari 0 |
| N5 | **Tidak ada limit ukuran file upload** | StockInForm.tsx L82-85 | File gambar ukuran berapa pun diterima. `FileReader.readAsDataURL` membaca seluruh file ke memori — file besar bisa crash browser |
| N6 | **Avatar broken image** | StockOutManagement.tsx L465 | Jika `requestedByAvatar` `undefined`/kosong, tag `<img>` tampil broken image tanpa fallback |

### P2 — MEDIUM (Baru)

| # | Masalah | File | Detail |
|---|---------|------|--------|
| N7 | **Modal tanpa Escape key & focus trap** | ConfirmationModal.tsx, ProductLookupModal.tsx | Tidak ada handler keyboard Escape untuk menutup. Tab bisa keluar dari modal. Backdrop click juga tidak menutup modal |
| N8 | **User menu dropdown tidak tutup saat klik di luar** | Header.tsx L26 | `handleClickOutside` hanya untuk notification panel, bukan user menu |
| N9 | **"Invalid Date" di StockInDetail** | StockInDetail.tsx L97 | Jika `expiryDate` kosong/malformed, `new Date()` menghasilkan "Invalid Date" di tampilan |
| N10 | **Status badge selalu hijau di StockInDetail** | StockInDetail.tsx L108-113 | Branch `isStatus` selalu render badge hijau "Selesai" tanpa memproses status lain |
| N11 | **Hardcoded stock threshold `10`** | api.ts L1254, L1297 | Threshold stok rendah di-hardcode `10` — seharusnya pakai field `buffer_stok` dari database |
| N12 | **`hasValidItem` tidak dipakai** | StockOutManualForm.tsx L76 | Variable dihitung tapi tidak direferensikan — pengecekan "minimal 1 item valid" tidak terimplementasi |
| N13 | **Error tidak di-clear setelah pilih produk** | StockOutManualForm.tsx L161-163 | Ada komentar `// Re-validate to clear` tapi tidak ada kode yang mengikuti |
| N14 | **Double Provider wrapping** | App.tsx L48-52, L140-155 | `QueryClientProvider` dan `ToastProvider` dibungkus 2 kali — di `App` dan di `AppRouter`. Bisa sebabkan bug subtle dengan context terpisah |

### P3 — LOW (Baru)

| # | Masalah | File | Detail |
|---|---------|------|--------|
| N15 | **Breadcrumb hardcoded "Master Data"** | Header.tsx L284-286 | Selalu tampil "Halaman / Master Data" di semua halaman |
| N16 | **`href="#"` di breadcrumb** | Header.tsx L284 | Link non-fungsional di breadcrumb desktop |
| N17 | **Unused props `searchTerm`/`onSearchChange` di Header** | Header.tsx L11-12 | Props diterima dan di-destructure tapi tidak pernah dipakai di JSX |
| N18 | **Sidebar tidak responsive terhadap resize window** | Sidebar.tsx L20-22 | `isCollapsed` hanya dihitung sekali saat mount. Resize browser tidak mengubah state |
| N19 | **Pagination label English** | PaginationControls.tsx L29, L37 | "Previous"/"Next" tidak konsisten dengan UI Indonesia ("Hal." = Halaman) |
| N20 | **Timer leak di UserManagement & Toast** | UserManagement.tsx L142, toast.tsx L27 | `setTimeout` di `handleAddUser` dan `showToast` tidak di-cleanup — bisa panggil `setState` setelah unmount |
| N21 | **useEffect tanpa cleanup** | Dashboard.tsx L23-37, StockOutManagement.tsx L77-80, StockInForm.tsx L27-31 | Fetch tanpa `AbortController`. Bisa set state setelah component unmount |
| N22 | **Lupa Password — dead code** | LoginPage.tsx L195-230 | State variables, import, dan handler `handleResetPassword` masih didefinisikan tapi UI di-comment out. Dead code |
| N23 | **Tidak ada `displayName` pada `forwardRef` component** | Header.tsx L73 | `NotificationPanel` pakai `React.forwardRef` tanpa `displayName` — warning di React DevTools |

---

## Rekomendasi Urutan Pengerjaan (Diperbarui)

### Fase 1 — Security (P0) — Sisa 2 masalah
1. Bungkus tombol quick login dengan `import.meta.env.DEV` check (#4)
2. Migrasi stock update ke Supabase RPC untuk atomic operation (#5)

### Fase 2 — High Priority (P1 + N1-N6) — 7 masalah
1. Fix Dashboard hardcoded data: hitung `+2.45%` dari data real, buat conic-gradient dinamis (#9)
2. Fix quantity `undefined` lolos validasi di StockOutManualForm (#N1)
3. Tambah loading/disabled state pada tombol "Proses" (#N2)
4. Validasi stok tersedia sebelum submit stok keluar (#N3)
5. Fix pagination saat 0 halaman (#N4)
6. Tambah limit ukuran file upload (max 5MB) (#N5)
7. Tambah fallback avatar image (#N6)

### Fase 3 — Form Validation & Error Handling (P2) — 16 masalah
1. StockInForm: validasi quantity > 0, expiry date di masa depan, produk wajib dipilih (#14)
2. LoginPage: validasi password min length, terjemahkan error Supabase (#17)
3. UserManagement: tambah validasi email di `handleAdd` (#18)
4. ProfilePage: tambah password complexity, minta current password (#20)
5. Tambah error feedback saat fetch gagal (#25)
6. Tambah rollback/atomic update untuk stock loop (#26)
7. Guard divide by zero di Dashboard (#27)
8. Handle product fetch error di StockInForm (#28)
9. Hapus/ganti 64 console statements (#29)
10. Modal: tambah Escape key handler, focus trap, backdrop close (#N7)
11. User menu: tambah click-outside handler (#N8)
12. Fix "Invalid Date" display (#N9)
13. Fix status badge warna dinamis (#N10)
14. Pakai `buffer_stok` dari DB, bukan hardcode `10` (#N11)
15. Implementasi `hasValidItem` check (#N12)
16. Clear error setelah pilih produk (#N13)

### Fase 4 — Polish & Code Quality (P3) — 16 masalah
1. Ganti `any` types dengan proper types (#30)
2. Hapus `@ts-nocheck`/`@ts-ignore` (#31)
3. Hapus dead code, unused imports, double providers (#32, #N14, #N22)
4. Tambah loading states di form (#33)
5. Accessibility: `aria-label`, `htmlFor`, focus trap (#34)
6. Implementasi server-side pagination, hapus `perPage: 1000` (#35)
7. Tambah konfirmasi reset form (#36)
8. Breadcrumb dinamis (#N15, #N16)
9. Hapus unused props (#N17)
10. Sidebar resize listener (#N18)
11. Terjemahkan label pagination (#N19)
12. Cleanup timer leaks (#N20)
13. Tambah AbortController di useEffect (#N21)
14. Tambah displayName (#N23)