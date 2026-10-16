# Fase 5: Pengambilan Data Konsisten dengan React Query

## Why
Ada tiga pola pengambilan data yang berbeda:

1. React Query hooks: produk, jasa, kategori jasa, stok masuk, dan stok keluar
   (`src/features/*/use*.ts`)
2. `useEffect` + `useState` manual: Dashboard, StockReport, UserManagement,
   ProductManagement (stat stok), semua halaman opname, dan timeline di
   StockOutManagement
3. Memanggil `supabase` langsung dari komponen: `NotificationProvider`
   (realtime channel), `StockOutRequestForm`, dan `UserManagement`
   (`profiles` dan `user_roles`)

Akibatnya, setelah mutasi (misalnya opname selesai) data di halaman lain tidak
ikut ter-refresh, loading dan error ditangani berbeda-beda, dan query yang
sama bisa diambil berkali-kali. `src/hooks/useSupabaseQuery.ts` juga hanya
berisi `QUERY_KEYS`.

## What
Semua baca/tulis data melewati hooks React Query di
`src/features/<domain>/use*.ts`. Komponen tidak lagi mengimpor `supabase`
ataupun objek API domain (`productsApi`, `opnameApi`, dll.) secara langsung.

## Constraints
### Must
- Query key memakai factory per domain di `src/features/<domain>/keys.ts`,
  misalnya `productKeys.list(params)` dan `opnameKeys.detail(id)`
- Setiap mutasi meng-invalidate semua key yang terdampak. Contoh: transaksi
  stok invalidate `products`, `dashboard`, dan `reports`, sedangkan opname
  selesai invalidate `products`, `opname`, dan `dashboard`
- Status loading dan error ditampilkan dengan komponen yang sama di semua
  halaman
- Tidak ada polling `setInterval` untuk data yang bisa didengar lewat
  realtime
- Realtime notifikasi tetap jalan. Event realtime meng-update cache lewat
  `queryClient.setQueryData` atau `invalidateQueries`
- Ikuti konvensi fase 4: satu objek API per domain di `api.ts`, hooks di file
  `use<Nama>.ts` (bukan `hooks.ts`), tanpa barrel `index.ts`

### Must Not
- Mengubah tampilan atau alur halaman
- Menaikkan jumlah request saat halaman dibuka

### Out of Scope
- Memecah komponen (fase 6). Di fase ini cukup ganti sumber data di komponen
  yang ada

## Current State
- Relevant files:
  - Hooks yang sudah ada: `src/features/products/useProducts.ts`,
    `src/features/services/useServices.ts`, `useServiceCategories.ts`,
    `src/features/stock-in/useStockIn.ts`, `src/features/stock-out/useStockOut.ts`,
    `src/hooks/useSupabaseQuery.ts` (`QUERY_KEYS`)
  - Fetching manual: `src/features/dashboard/Dashboard.tsx`,
    `src/features/reports/StockReport.tsx`, `src/features/users/UserManagement.tsx`,
    `src/features/products/ProductManagement.tsx` (memanggil
    `getDashboardStats` hanya untuk stat), `src/features/opname/*Page.tsx`,
    `src/features/stock-out/StockOutManagement.tsx` (`fetchTimeline`),
    `src/features/profile/ProfilePage.tsx`
  - `supabase` langsung: `src/features/notifications/NotificationProvider.tsx`,
    `src/features/stock-out/StockOutRequestForm.tsx`,
    `src/features/users/UserManagement.tsx`
  - Polling: `src/features/opname/useOpnameLock.ts` (dipakai di
    `src/app/AuthenticatedApp.tsx`)
  - Fungsi admin user (Edge Function `admin-users`) ada di
    `src/features/auth/api.ts`; `src/features/users/` belum punya `api.ts`
- Existing patterns: `useStockIn.ts` (`useQuery` dengan `keepPreviousData`,
  `useMutation` dengan `invalidateQueries`), default `staleTime` 60 detik di
  `src/app/App.tsx`
- Peringatan `react-hooks/exhaustive-deps` dari fase 3 (bahan perbaikan di
  fase ini): `NotificationProvider` (`userRoles` dibuat ulang tiap render,
  4 peringatan), `StockReport` (`products`, 3 peringatan; `fetchData`),
  `DetailOpnamePage` (`loadDetail`), `PelaksanaanOpnamePage` (`loadOpname`),
  `components/ui/data-table.tsx` (`hasPagination`, `table`)

## Tasks

### T1: Query key factory dan konvensi
**What:** Hapus `src/hooks/useSupabaseQuery.ts`. Buat `keys.ts` per fitur.
Tulis konvensinya (nama hook `useXxx`/`useXxxMutation`, daftar invalidasi
lintas domain) di `.ai/conventions/data-fetching.md`.
**Files:** `src/features/*/keys.ts`, `.ai/conventions/data-fetching.md`
**Verify:** Hooks yang sudah ada memakai factory baru, dan perilakunya tidak
berubah.

### T2: Dashboard dan laporan
**What:** `useDashboardStats`, `useRecentTransactions`,
`useTransactionReport(range, page)`, dan `useStockMutationReport(range,
page)`. Hapus `useEffect` fetching di `Dashboard`, `StockReport`, dan stat di
`ProductManagement` (pakai `useDashboardStats` yang sama, jadi cache dibagi).
**Files:** `src/features/dashboard/*`, `src/features/reports/*`,
`src/features/products/ProductManagement.tsx`
**Verify:** Setelah membuat stok keluar lalu kembali ke dashboard, angkanya
sudah ter-update tanpa reload. Peringatan exhaustive-deps di `StockReport`
hilang.

### T3: Opname
**What:** Hooks untuk jadwal (`useOpnameSchedules`,
`useOpnameScheduleMutations`), `useOpname(id)`, `useOpnameHistory`,
`useOpnameDetailView`, `useActiveOpnameLock` (ganti `useOpnameLock`), dan
mutasi per langkah (memakai RPC dari fase 1).

Kunci opname berbasis event, menggantikan polling:
- Saat ini `useOpnameLock` memakai `setInterval` 30 detik di setiap tab yang
  login. Ganti dengan `useActiveOpnameLock` (React Query, tanpa
  `refetchInterval`) dan `useOpnameLockRealtime`, yang berlangganan
  `postgres_changes` (`event: '*'`, `table: 'opname'`) lalu memanggil
  `queryClient.invalidateQueries({ queryKey: opnameKeys.lock() })`.
- Karena event yang terjadi saat koneksi putus akan hilang, cek ulang lock
  saat channel kembali `SUBSCRIBED` setelah reconnect, dan saat tab kembali
  aktif (`refetchOnWindowFocus: true` khusus query ini, atau listener
  `visibilitychange`).
- Tutup channel saat logout atau unmount.
- Realtime hanya untuk UX. Penegakan kunci tetap di database (fase 1 T5).
- Butuh tabel `opname` di publication `supabase_realtime` (sudah ada di
  baseline fase 1).
**Files:** `src/features/opname/*`, `src/app/AuthenticatedApp.tsx`,
`src/features/opname/useOpnameLock.ts` (dihapus)
**Verify:** Alur opname lengkap berjalan. Setelah opname selesai, stok di
Master Produk langsung ter-update tanpa reload. Buka dua tab: mulai opname
di tab A, dan tab B pindah ke halaman kunci dalam beberapa detik. Selesaikan
opname, dan tab B terbuka kembali. Tab Network tidak menunjukkan request
`opname` berkala saat idle. Matikan wifi di tab B, mulai opname di tab A,
nyalakan wifi lagi: tab B terkunci setelah reconnect. Peringatan
exhaustive-deps di `DetailOpnamePage` dan `PelaksanaanOpnamePage` hilang.

### T4: User management dan profil
**What:** Buat `src/features/users/api.ts` (`usersApi`): pindahkan query
`profiles` dan `user_roles` dari `UserManagement`, dan pindahkan fungsi admin
user (Edge Function `admin-users`) dari `src/features/auth/api.ts`. Tambahkan
hooks `useUsers` dan `useUserMutations`. Lakukan hal yang sama untuk
`ProfilePage` (`useProfile`, `useUpdateProfile`, `useUploadAvatar`).
**Files:** `src/features/users/*`, `src/features/profile/*`,
`src/features/auth/api.ts`
**Verify:** `grep -rln "supabaseClient" src/features --include=*.tsx` kosong.

### T5: Stok keluar: timeline dan form permintaan
**What:** `fetchTimeline` diganti dengan `useRecentStockOuts`. Query
`supabase` di `StockOutRequestForm` dipindah ke `stockOutApi` dan hook.
**Files:** `src/features/stock-out/*`
**Verify:** Timeline ter-update setelah memproses permintaan.

### T6: Notifikasi realtime
**What:** Pindahkan subscription channel ke
`src/features/notifications/useNotificationsRealtime.ts`. Daftar notifikasi
diambil lewat `useNotifications`, dan event realtime meng-update cache.
`NotificationProvider` hanya menyediakan context untuk toast. Perbaiki
`userRoles` yang dibuat ulang tiap render.
**Files:** `src/features/notifications/*`
**Verify:** Notifikasi baru muncul di header dan halaman notifikasi tanpa
reload, channel ditutup saat logout, dan peringatan exhaustive-deps di
`NotificationProvider` hilang.
