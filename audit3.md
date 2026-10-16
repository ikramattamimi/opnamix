# Audit Kesiapan Aplikasi v3 — PMB Anita

**Tanggal:** 17 Februari 2026  
**Status:** Master List - Semua Issues Belum Tersolve  
**Total Issues:** 70+ masalah yang masih perlu diperbaiki

---

## Ringkasan Status

| Kategori | Total | Belum Fix | Partial | Baru |
|----------|-------|-----------|---------|------|
| 🔴 P0 — Critical | 5 | 5 | 0 | 3 |
| 🟠 P1 — High | 14 | 12 | 1 | 8 |
| 🟡 P2 — Medium | 27 | 25 | 2 | 12 |
| 🟢 P3 — Low | 24 | 24 | 0 | 10 |
| **Total** | **70** | **66** | **3** | **33** |

---

## 🔴 P0 — CRITICAL (Belum Tersolve)

### 1. Service Role Key Exposed di Client-Side ⭐ NEW
**File:** `lib/supabaseClient.ts` (lines 7, 23-30)  
**Status:** 🔴 BELUM FIX  
**Dampak:** user biasa bisa create/delete users, bypass RLS

```typescript
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {...})
  : null;
```

**Solusi:** Hapus service role key dari client-side, gunakan Edge Functions untuk admin operations.

---

### 2. Double Provider Wrapping ⭐ NEW
**File:** `App.tsx` (lines 46-55, 139-156)  
**Status:** 🔴 BELUM FIX  
**Dampak:** Context terpisah, state tidak sync, memory leak

```typescript
// Provider dibungkus 2x!
<AuthProvider><QueryClientProvider><ToastProvider><AppRouter /></...>
// Di AppRouter:
<QueryClientProvider><ToastProvider><NotificationProvider>...</...>
```

**Solusi:** Hapus double wrapping, gunakan single provider hierarchy.

---

### 3. Auth Provider Placement Bug ⭐ NEW
**File:** `App.tsx` (lines 46-55)  
**Status:** 🔴 BELUM FIX  
**Dampak:** useAuth() dipanggil di luar AuthProvider scope

**Solusi:** Restructure component hierarchy atau pindahkan useAuth() ke dalam scope.

---

### 4. Tombol Quick Login Masih Aktif
**File:** `LoginPage.tsx` L85-L121  
**Status:** 🔴 BELUM FIX  
**Dampak:** Credentials asli (`password123`) terlihat di UI produksi

- 3 tombol demo: `admin@test.com`, `admin@uniera.ac.id`, `nakes@uniera.ac.id`
- Semua dengan password `password123`
- Tidak dibungkus `import.meta.env.DEV`

**Solusi:** Bungkus dengan `import.meta.env.DEV` check atau hapus total.

---

### 5. Race Condition Stock
**File:** `api.ts` L333-349, L510-527  
**Status:** 🔴 BELUM FIX (Hanya TODO comment)  
**Dampak:** Stok salah saat akses bersamaan, data corruption

```typescript
// TODO: Migrate to Supabase RPC/database function for atomic stock update
for (const item of payload.items) {
  const { data: product } = await supabase.from('master_obat').select('qty').eq('id', item.productId).single();
  await supabase.from('master_obat').update({ qty: newQty }).eq('id', item.productId);
}
```

**Solusi:** Gunakan Supabase RPC/stored procedure untuk atomic update.

---

## 🟠 P1 — HIGH (Belum Tersolve)

### 6. Dashboard Data Hardcoded (Sebagian)
**File:** `Dashboard.tsx` L107, L124, L189  
**Status:** 🟡 PARTIAL (Stat cards pakai API, tapi masih hardcoded)  
**Dampak:** Data palsu ditampilkan ke user

- `+2.45%` pertumbuhan (hardcoded)
- Pie chart `conic-gradient` derajat (hardcoded: 226° dan 134°)
- Data konsumsi mingguan (hardcoded)

**Solusi:** Implementasi kalkulasi real dari data API.

---

### 7. Quantity `undefined` Lolos Validasi ⭐ NEW
**File:** `StockOutManualForm.tsx` L79, L334  
**Status:** 🔴 BELUM FIX  
**Dampak:** Item tanpa quantity bisa disubmit

```typescript
// undefined <= 0 = false (NaN comparison)
if (quantity <= 0) return false; // Lolos jika undefined!
```

**Solusi:** Tambah check `typeof quantity === 'number'` atau `quantity == null`.

---

### 8. Tombol "Proses" Bisa Double-Click ⭐ NEW
**File:** `StockOutManagement.tsx` L649-660  
**Status:** 🔴 BELUM FIX  
**Dampak:** Request bisa diproses berulang kali

**Solusi:** Tambah loading state dan disabled pada tombol saat proses.

---

### 9. Tidak Ada Validasi Stok Tersedia ⭐ NEW
**File:** `StockOutManualForm.tsx` L79  
**Status:** 🔴 BELUM FIX  
**Dampak:** User bisa submit quantity > stok aktual (negative stock)

**Solusi:** Fetch stok aktual dan validasi sebelum submit.

---

### 10. Pagination "Next" Aktif Saat 0 Halaman ⭐ NEW
**File:** `PaginationControls.tsx` L22-38  
**Status:** 🔴 BELUM FIX  
**Dampak:** User bisa navigasi ke halaman 2 dari 0

```typescript
// Bug: currentPage(1) !== totalPages(0) = true
disabled={currentPage === totalPages}
```

**Solusi:** Tambah check `totalPages === 0`.

---

### 11. Tidak Ada Limit Ukuran File Upload ⭐ NEW
**File:** `StockInForm.tsx` L82-85  
**Status:** 🔴 BELUM FIX  
**Dampak:** File besar bisa crash browser

**Solusi:** Validasi `file.size <= 5MB` sebelum upload.

---

### 12. Avatar Broken Image ⭐ NEW
**File:** `StockOutManagement.tsx` L465  
**Status:** 🔴 BELUM FIX  
**Dampak:** Broken image icon tampil jika avatar kosong

**Solusi:** Tambah fallback image atau placeholder.

---

### 13. Unused Props di Header ⭐ NEW
**File:** `Header.tsx` L11-12, 20-22  
**Status:** 🔴 BELUM FIX  
**Dampak:** Props diterima tapi tidak dipakai (dead code)

```typescript
interface HeaderProps {
  searchTerm: string;        // Tidak dipakai!
  onSearchChange: (val: string) => void;  // Tidak dipakai!
}
```

**Solusi:** Hapus props atau implementasikan fitur search.

---

### 14. User Menu Tidak Tutup Saat Klik di Luar ⭐ NEW
**File:** `Header.tsx` L241-274, 335-355  
**Status:** 🔴 BELUM FIX  
**Dampak:** UX buruk, menu tetap terbuka

**Solusi:** Tambah click-outside handler untuk user menu.

---

### 15. Missing AbortController di useEffect ⭐ NEW
**File:** `Dashboard.tsx` L23-38, 40-53  
**Status:** 🔴 BELUM FIX  
**Dampak:** Memory leak, setState di unmounted component

**Solusi:** Gunakan `AbortController` untuk cancel fetch saat unmount.

---

### 16. Hardcoded Breadcrumb ⭐ NEW
**File:** `Header.tsx` L284-286  
**Status:** 🔴 BELUM FIX  
**Dampak:** Selalu tampil "Halaman / Master Data" di semua halaman

**Solusi:** Buat breadcrumb dinamis berdasarkan route.

---

### 17. Potential NaN di Dashboard ⭐ NEW
**File:** `Dashboard.tsx` L77, L179  
**Status:** 🔴 BELUM FIX  
**Dampak:** Tampil `NaN%` jika `totalItems = 0`

**Solusi:** Guard dengan `if (totalItems === 0)` atau default value.

---

### 18. Stale Closure di Notification Provider ⭐ NEW
**File:** `NotificationProvider.tsx` L162-216  
**Status:** 🔴 BELUM FIX  
**Dampak:** Notification logic tidak update jika user role berubah

**Solusi:** Gunakan functional update atau ref untuk nilai yang berubah.

---

### 19. Unused Imports ⭐ NEW
**File:** `App.tsx` L5  
**Status:** 🔴 BELUM FIX  
**Dampak:** Dead code

```typescript
import { Category, Unit, ViewType, ... } from './types'; // Tidak dipakai!
```

**Solusi:** Hapus unused imports.

---

## 🟡 P2 — MEDIUM (Belum Tersolve)

### 20. StockInForm Validasi Minimal
**File:** `StockInForm.tsx`  
**Status:** 🔴 BELUM FIX  
**Masalah:**
- Quantity bisa 0/negatif
- Expiry date bisa tanggal lampau
- Item tanpa produk bisa disubmit
- Tidak ada error message ke user

**Solusi:** Implementasi validasi lengkap dengan feedback.

---

### 21. LoginPage Validasi Password
**File:** `LoginPage.tsx` L38  
**Status:** 🔴 BELUM FIX  
**Masalah:**
- Tidak ada validasi format email client-side
- Tidak ada panjang minimum password
- Error Supabase ditampilkan mentah

**Solusi:** Tambah validasi client-side dan translate error messages.

---

### 22. UserManagement Validasi Email
**File:** `UserManagement.tsx` L120  
**Status:** 🔴 BELUM FIX  
**Masalah:** `handleAdd` dipanggil via `onClick` (bypass browser validation)

**Solusi:** Tambah validasi email manual di `handleAdd`.

---

### 23. ProfilePage Password Complexity
**File:** `ProfilePage.tsx` L91  
**Status:** 🔴 BELUM FIX  
**Masalah:**
- Hanya cek min 6 karakter
- Tidak ada requirement uppercase/angka/special char
- Tidak minta current password

**Solusi:** Implementasi password strength meter dan minta current password.

---

### 24. Fetch Gagal Tanpa Feedback ke User
**File:** `Dashboard.tsx` L31/L46, `StockReport.tsx` L171, `StockOutManagement.tsx` L73  
**Status:** 🔴 BELUM FIX  
**Masalah:** Data jadi 0 atau kosong tanpa penjelasan error

**Solusi:** Tambah error state dan toast notification.

---

### 25. Tidak Ada Rollback Jika Update Stok Gagal
**File:** `api.ts` L338-358  
**Status:** 🔴 BELUM FIX  
**Masalah:** Jika item ke-3 dari 5 gagal, item 1-2 sudah ter-update tanpa rollback

**Solusi:** Gunakan database transaction atau implementasi compensation logic.

---

### 26. Divide by Zero
**File:** `Dashboard.tsx` L179  
**Status:** 🔴 BELUM FIX  
**Masalah:** `totalItems` bisa 0, menyebabkan `NaN%`

**Solusi:** Guard clause untuk division.

---

### 27. Product Fetch Error Tidak Ditangani
**File:** `StockInForm.tsx` L21  
**Status:** 🔴 BELUM FIX  
**Masalah:** Error state dari `useProducts` tidak di-destructure, list kosong tanpa penjelasan

**Solusi:** Handle error state dengan proper feedback.

---

### 28. 64 Console Statements di Production
**File:** 22 file  
**Status:** 🔴 BELUM FIX (Naik dari 63 ke 64)  
**File terbanyak:** api.ts (6), PelaksanaanOpnamePage (5), dll

**Solusi:** Hapus/replace dengan proper logging service.

---

### 29. Modal Tanpa Escape Key & Focus Trap ⭐ NEW
**File:** `ConfirmationModal.tsx`, `ProductLookupModal.tsx`  
**Status:** 🔴 BELUM FIX  
**Masalah:**
- Tidak ada handler keyboard Escape
- Tab bisa keluar dari modal
- Backdrop click tidak menutup modal

**Solusi:** Implementasi focus trap dan keyboard handlers.

---

### 30. "Invalid Date" di StockInDetail ⭐ NEW
**File:** `StockInDetail.tsx` L97  
**Status:** 🔴 BELUM FIX  
**Masalah:** Jika `expiryDate` kosong/malformed, tampil "Invalid Date"

**Solusi:** Validasi date sebelum render atau tampil fallback.

---

### 31. Status Badge Selalu Hijau di StockInDetail ⭐ NEW
**File:** `StockInDetail.tsx` L108-113  
**Status:** 🔴 BELUM FIX  
**Masalah:** Selalu render badge hijau "Selesai" tanpa memproses status lain

**Solusi:** Implementasi conditional rendering berdasarkan status.

---

### 32. Hardcoded Stock Threshold `10` ⭐ NEW
**File:** `api.ts` L1254, L1297  
**Status:** 🔴 BELUM FIX  
**Masalah:** Threshold stok rendah hardcode `10`, seharusnya pakai `buffer_stok` dari DB

**Solusi:** Gunakan field `buffer_stok` dari database.

---

### 33. `hasValidItem` Tidak Dipakai ⭐ NEW
**File:** `StockOutManualForm.tsx` L76  
**Status:** 🔴 BELUM FIX  
**Masalah:** Variable dihitung tapi tidak direferensikan

**Solusi:** Gunakan variable untuk validasi atau hapus.

---

### 34. Error Tidak Di-clear Setelah Pilih Produk ⭐ NEW
**File:** `StockOutManualForm.tsx` L161-163  
**Status:** 🔴 BELUM FIX  
**Masalah:** Ada komentar `// Re-validate to clear` tapi tidak ada kode yang mengikuti

**Solusi:** Implementasi re-validation setelah select product.

---

### 35. Double Provider Wrapping (Duplicate) ⭐ NEW
**File:** `App.tsx` L48-52, L140-155  
**Status:** 🔴 BELUM FIX  
**Masalah:** `QueryClientProvider` dan `ToastProvider` dibungkus 2 kali

**Solusi:** Hapus duplicate providers.

---

### 36. Timer Leak ⭐ NEW
**File:** `UserManagement.tsx` L142, `toast.tsx` L27  
**Status:** 🔴 BELUM FIX  
**Masalah:** `setTimeout` tidak di-cleanup, bisa panggil `setState` setelah unmount

**Solusi:** Return cleanup function dari useEffect.

---

### 37. useEffect Tanpa Cleanup ⭐ NEW
**File:** `Dashboard.tsx` L23-37, `StockOutManagement.tsx` L77-80, `StockInForm.tsx` L27-31  
**Status:** 🔴 BELUM FIX  
**Masalah:** Fetch tanpa `AbortController`

**Solusi:** Implementasi AbortController atau axios cancel token.

---

### 38. No Rate Limiting di Auth ⭐ NEW
**File:** `lib/auth.ts`  
**Status:** 🔴 BELUM FIX  
**Dampak:** Attacker bisa brute force password

**Solusi:** Implementasi rate limiting atau gunakan Supabase built-in protection.

---

### 39. Toast Auto-Dismiss Tidak Di-cleanup ⭐ NEW
**File:** `components/ui/toast.tsx`  
**Status:** 🔴 BELUM FIX  
**Masalah:** `setTimeout` untuk auto-dismiss tidak cleanup dengan benar

**Solusi:** Simpan timeout ref dan clear saat unmount atau new toast.

---

### 40. Image Upload Tanpa Validasi Tipe File ⭐ NEW
**File:** `lib/imageCompression.ts`  
**Status:** 🔴 BELUM FIX  
**Dampak:** User bisa upload malicious files

**Solusi:** Validasi MIME type sebelum upload.

---

### 41. Avatar Image XSS Potential ⭐ NEW
**File:** `Header.tsx` L234-238, 328-332  
**Status:** 🔴 BELUM FIX  
**Dampak:** Jika attacker manipulate profile, bisa inject malicious URL

```typescript
<img src={userProfile.avatar_url} ... /> // Langsung dari DB!
```

**Solusi:** Sanitize URL atau gunakan default avatar.

---

### 42. Weak Password Policy ⭐ NEW
**File:** `lib/auth.ts` - `signUp`  
**Status:** 🔴 BELUM FIX  
**Masalah:** User bisa set password "123456"

**Solusi:** Implementasi password strength validation.

---

### 43. Reset Password Tanpa Token Expiry ⭐ NEW
**File:** `lib/auth.ts`  
**Status:** 🔴 BELUM FIX  
**Masalah:** Reset link bisa digunakan kapan saja

**Solusi:** Gunakan Supabase built-in expiry atau implementasi manual.

---

### 44. No Account Lockout Policy ⭐ NEW
**File:** `lib/auth.ts`  
**Status:** 🔴 BELUM FIX  
**Masalah:** Tidak ada lockout setelah beberapa percobaan gagal

**Solusi:** Implementasi lockout setelah 5 percobaan gagal.

---

### 45. No Loading State untuk Logout ⭐ NEW
**File:** `Header.tsx` L264-272  
**Status:** 🔴 BELUM FIX  
**Masalah:** Logout bisa lambat, user tidak tahu sedang proses

**Solusi:** Tambah loading state pada tombol logout.

---

### 46. No Confirmation untuk Logout ⭐ NEW
**File:** `Header.tsx`  
**Status:** 🔴 BELUM FIX  
**Masalah:** Langsung logout tanpa konfirmasi (bisa mis-klik)

**Solusi:** Tambah confirmation dialog.

---

## 🟢 P3 — LOW (Belum Tersolve)

### 47. 88x `any` Type
**File:** 18 file  
**Status:** 🔴 BELUM FIX (Naik dari 30+ ke 88)  
**File terbanyak:** api.ts (31), exportUtils.ts (9), PelaksanaanOpnamePage (10)

**Solusi:** Ganti dengan proper TypeScript types.

---

### 48. `@ts-nocheck` & `@ts-ignore`
**File:** `ErrorBoundary.tsx` L1, `App.tsx` L78  
**Status:** 🔴 BELUM FIX  
**Masalah:** Menonaktifkan type checking

**Solusi:** Fix type errors dan hapus directive.

---

### 49. Dead/Legacy Code
**File:** `App.tsx`  
**Status:** 🔴 BELUM FIX  
**Masalah:**
- Unused imports (`Category`, `Unit`, `ViewType`)
- Legacy state `products`/`isLoading`
- Commented-out footer
- Double provider wrapping

**Solusi:** Hapus dead code.

---

### 50. Missing Loading States
**File:** `StockOutRequestForm`, `StockOutManualForm`, `StockInForm`  
**Status:** 🔴 BELUM FIX  
**Masalah:** Submit button tanpa loading indicator

**Solusi:** Tambah loading state pada semua form submit.

---

### 51. Accessibility Sangat Minim
**File:** Multiple  
**Status:** 🔴 BELUM FIX  
**Masalah:**
- Hanya 1 `aria-label` di seluruh app
- 0 `htmlFor`/`id` pairing
- 0 focus trap di modal
- 0 keyboard navigation

**Solusi:** Implementasi accessibility best practices.

---

### 52. `perPage: 1000` Hardcoded
**File:** 11 file + 2 file (`perPage: 10000`)  
**Status:** 🔴 BELUM FIX  
**Masalah:** Akan lambat seiring data bertambah

**Solusi:** Implementasi server-side pagination yang proper.

---

### 53. Reset Form Tanpa Konfirmasi
**File:** `ProductForm.tsx` L138  
**Status:** 🔴 BELUM FIX  
**Masalah:** Tombol Reset langsung hapus semua isian

**Solusi:** Tambah confirmation dialog.

---

### 54. Lupa Password — Dead Code ⭐ NEW
**File:** `LoginPage.tsx` L195-230  
**Status:** 🔴 BELUM FIX  
**Masalah:** State variables, import, handler masih ada tapi UI di-comment out

**Solusi:** Hapus dead code atau implementasi fitur.

---

### 55. Breadcrumb Hardcoded "Master Data" ⭐ NEW
**File:** `Header.tsx` L284-286  
**Status:** 🔴 BELUM FIX  
**Masalah:** Selalu tampil "Master Data" di semua halaman

**Solusi:** Buat breadcrumb dinamis.

---

### 56. `href="#"` di Breadcrumb ⭐ NEW
**File:** `Header.tsx` L284  
**Status:** 🔴 BELUM FIX  
**Masalah:** Link non-fungsional

**Solusi:** Gunakan `button` atau proper navigation.

---

### 57. Sidebar Tidak Responsive terhadap Resize ⭐ NEW
**File:** `Sidebar.tsx` L20-22  
**Status:** 🔴 BELUM FIX  
**Masalah:** `isCollapsed` hanya dihitung sekali saat mount

**Solusi:** Tambah resize event listener.

---

### 58. Pagination Label English ⭐ NEW
**File:** `PaginationControls.tsx` L29, L37  
**Status:** 🔴 BELUM FIX  
**Masalah:** "Previous"/"Next" tidak konsisten dengan UI Indonesia

**Solusi:** Terjemahkan ke "Sebelumnya"/"Berikutnya".

---

### 59. Tidak Ada `displayName` pada `forwardRef` ⭐ NEW
**File:** `Header.tsx` L73  
**Status:** 🔴 BELUM FIX  
**Masalah:** Warning di React DevTools

**Solusi:** Tambah `NotificationPanel.displayName = 'NotificationPanel';`

---

### 60. Inconsistent Error Messages ⭐ NEW
**File:** Multiple  
**Status:** 🔴 BELUM FIX  
**Masalah:** Campuran Bahasa Indonesia dan raw Supabase errors

**Solusi:** Standardisasi error messages ke Bahasa Indonesia.

---

### 61. No Empty State Illustrations ⭐ NEW
**File:** Multiple  
**Status:** 🔴 BELUM FIX  
**Masalah:** Halaman kosong hanya text "Belum ada data"

**Solusi:** Tambah visual illustrations.

---

### 62. Hardcoded Year di Footer ⭐ NEW
**File:** `App.tsx` L372  
**Status:** 🔴 BELUM FIX  
**Masalah:** `© 2026` hardcoded

**Solusi:** Gunakan `new Date().getFullYear()`.

---

### 63. Missing Meta Tags untuk SEO ⭐ NEW
**File:** `index.html`  
**Status:** 🔴 BELUM FIX  
**Masalah:** Tidak ada title, description, OG tags

**Solusi:** Tambah proper meta tags.

---

### 64. No Loading Skeleton ⭐ NEW
**File:** Multiple  
**Status:** 🔴 BELUM FIX  
**Masalah:** Semua loading hanya pakai spinner

**Solusi:** Tambah skeleton screens untuk content placeholder.

---

### 65. No Prefetching untuk Route Transitions ⭐ NEW
**File:** Multiple  
**Status:** 🔴 BELUM FIX  
**Masalah:** React.lazy tanpa prefetch, user harus tunggu download

**Solusi:** Implementasi route prefetching.

---

### 66. Missing Focus Management ⭐ NEW
**File:** Multiple  
**Status:** 🔴 BELUM FIX  
**Masalah:** Focus tidak kembali ke trigger setelah modal tertutup

**Solusi:** Implementasi focus management.

---

### 67. No Pagination Info Display ⭐ NEW
**File:** Multiple  
**Status:** 🔴 BELUM FIX  
**Masalah:** Hanya tampil "Page X of Y", tidak ada "Showing 1-10 of 156 items"

**Solusi:** Tambah pagination info.

---

### 68. Sensitive Data di URL ⭐ NEW
**File:** Potentially multiple  
**Status:** 🔴 BELUM FIX  
**Masalah:** Data sensitif mungkin di URL params (tersimpan di history)

**Solusi:** Gunakan POST untuk operasi sensitif.

---

### 69. No CSRF Protection Consideration ⭐ NEW
**File:** `lib/auth.ts`, `lib/api.ts`  
**Status:** 🔴 BELUM FIX  
**Masalah:** Tidak ada explicit CSRF tokens

**Solusi:** Review dan implementasi CSRF protection jika diperlukan.

---

### 70. Missing Keyboard Navigation ⭐ NEW
**File:** Multiple  
**Status:** 🔴 BELUM FIX  
**Masalah:** Tidak ada keyboard shortcuts

**Solusi:** Implementasi keyboard accessibility.

---

## Rekomendasi Prioritas Fix

### 🚨 Priority 1 - SEGERA (Security & Critical Bugs)
1. Fix service role key exposure (#1)
2. Fix double provider wrapping (#2)
3. Fix auth provider scope bug (#3)
4. Bungkus quick login dengan DEV check (#4)
5. Fix race condition stock (#5)
6. Fix quantity undefined validation (#7)
7. Fix XSS potential di avatar (#41)

### 🔥 Priority 2 - HIGH (UX & Functional Bugs)
1. Fix double-click process button (#8)
2. Add stock availability validation (#9)
3. Fix pagination bug (#10)
4. Add file upload size limit (#11)
5. Fix user menu click outside (#14)
6. Add AbortController to fetches (#15, #37)
7. Fix all hardcoded data in Dashboard (#6, #16)

### ⚠️ Priority 3 - MEDIUM (Validation & Error Handling)
1. Fix all form validations (#20-23)
2. Add error feedback for failed fetches (#24)
3. Fix rollback/partial update issues (#25)
4. Fix divide by zero (#26, #17)
5. Remove console statements (#28)
6. Fix modal accessibility (#29)
7. Fix timer leaks (#36)

### 📝 Priority 4 - LOW (Code Quality)
1. Remove `any` types (#47)
2. Remove `@ts-nocheck`/`@ts-ignore` (#48)
3. Clean up dead code (#49, #54)
4. Add loading states (#50, #64)
5. Improve accessibility (#51, #66, #70)
6. Fix hardcoded values (#52, #55, #56, #58, #62)
7. Add proper pagination (#52, #67)

---

## Estimasi Effort

| Priority | Jumlah Issues | Estimasi Sprint |
|----------|---------------|-----------------|
| P0 - Critical | 5 | 1 sprint |
| P1 - High | 14 | 2-3 sprints |
| P2 - Medium | 27 | 3-4 sprints |
| P3 - Low | 24 | 2-3 sprints |
| **Total** | **70** | **8-11 sprints** |

---

*Generated: 17 February 2026*  
*Status: MASTER LIST - Semua issues belum tersolve*
