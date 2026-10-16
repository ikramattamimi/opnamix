# Fase 5: Pengambilan Data Konsisten dengan React Query

## Why
Ada tiga pola pengambilan data yang berbeda:

1. React Query hooks: produk, jasa, kategori jasa, stok masuk, dan stok keluar
   (`hooks/use*.ts`)
2. `useEffect` + `useState` manual: Dashboard, StockReport, UserManagement,
   semua halaman opname, dan timeline di StockOutManagement
3. Memanggil `supabase` langsung dari komponen: `NotificationProvider`
   (realtime channel), `StockOutRequestForm` (query di baris 47), dan
   `UserManagement` (`profiles` dan `user_roles`, baris 78-83)

Akibatnya, setelah mutasi (misalnya opname selesai) data di halaman lain tidak
ikut ter-refresh, loading dan error ditangani berbeda-beda, dan query yang
sama bisa diambil berkali-kali. `hooks/useSupabaseQuery.ts` juga hanya berisi
`QUERY_KEYS` dan import `useNavigate` yang tidak terpakai.

## What
Semua baca/tulis data melewati hooks React Query di
`features/<domain>/hooks.ts`. Komponen tidak lagi mengimpor `supabase`
ataupun fungsi API secara langsung.

## Constraints
### Must
- Query key memakai factory per domain, misalnya
  `productKeys.list(params)` dan `opnameKeys.detail(id)`
- Setiap mutasi meng-invalidate semua key yang terdampak. Contoh: transaksi
  stok invalidate `products`, `dashboard`, dan `reports`, sedangkan opname
  selesai invalidate `products`, `opname`, dan `dashboard`
- Status loading dan error ditampilkan dengan komponen yang sama di semua
  halaman
- Tidak ada polling `setInterval` untuk data yang bisa didengar lewat
  realtime
- Realtime notifikasi tetap jalan. Event realtime meng-update cache lewat
  `queryClient.setQueryData` atau `invalidateQueries`

### Must Not
- Mengubah tampilan atau alur halaman
- Menaikkan jumlah request saat halaman dibuka

### Out of Scope
- Memecah komponen (fase 6). Di fase ini cukup ganti sumber data di komponen
  yang ada

## Current State
- Relevant files: `hooks/*` (setelah fase 4 pindah ke `features/*/hooks.ts`),
  `components/Dashboard.tsx`, `StockReport.tsx`, `UserManagement.tsx`,
  `StockOpname/*.tsx`, `StockOutManagement.tsx` (`fetchTimeline`),
  `NotificationProvider.tsx`, `StockOutRequestForm.tsx`, `ProfilePage.tsx`,
  `hooks/useOpnameLock.ts`
- Existing patterns: `hooks/useStockIn.ts` (`useQuery` dengan
  `keepPreviousData`, `useMutation` dengan `invalidateQueries`), default
  `staleTime` 60 detik di `App.tsx`

## Tasks

### T1: Query key factory dan konvensi
**What:** Hapus `hooks/useSupabaseQuery.ts`. Buat `keys.ts` per fitur. Tulis
konvensinya (nama hook `useXxx`/`useXxxMutation`, daftar invalidasi) di
`.ai/conventions/data-fetching.md`.
**Files:** `features/*/keys.ts`, `.ai/conventions/data-fetching.md`
**Verify:** Hooks yang sudah ada memakai factory baru, dan perilakunya tidak
berubah.

### T2: Dashboard dan laporan
**What:** `useDashboardStats`, `useExpiringProducts`, `useRecentTransactions`,
`useTransactionReport(range, page)`, dan `useStockMutationReport(range,
page)`. Hapus `useEffect` fetching di `Dashboard` dan `StockReport`.
**Files:** `features/dashboard/*`, `features/reports/*`
**Verify:** Setelah membuat stok keluar lalu kembali ke dashboard, angkanya
sudah ter-update tanpa reload.

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
- Butuh tabel `opname` di publication `supabase_realtime` (fase 1 T1).
**Files:** `features/opname/*`, `app/AuthenticatedApp.tsx`,
`hooks/useOpnameLock.ts` (dihapus)
**Verify:** Alur opname lengkap berjalan. Setelah opname selesai, stok di
Master Produk langsung ter-update tanpa reload. Buka dua tab: mulai opname
di tab A, dan tab B pindah ke halaman kunci dalam beberapa detik. Selesaikan
opname, dan tab B terbuka kembali. Tab Network tidak menunjukkan request
`opname` berkala saat idle. Matikan wifi di tab B, mulai opname di tab A,
nyalakan wifi lagi: tab B terkunci setelah reconnect.

### T4: User management dan profil
**What:** Pindahkan query `profiles` dan `user_roles` dari `UserManagement` ke
`features/users/api.ts` dengan hooks `useUsers` dan `useUserMutations`
(memanggil Edge Function `admin-users`). Lakukan hal yang sama untuk
`ProfilePage`.
**Files:** `features/users/*`, `features/profile/*`
**Verify:** `grep -rn "supabaseClient" src/features/*/components` kosong.

### T5: Stok keluar: timeline dan form permintaan
**What:** `fetchTimeline` diganti dengan `useRecentStockOuts`. Query di
`StockOutRequestForm` (baris 47) dipindah ke hook.
**Files:** `features/stock-out/*`
**Verify:** Timeline ter-update setelah memproses permintaan.

### T6: Notifikasi realtime
**What:** Pindahkan subscription channel ke `features/notifications/
useNotificationsRealtime.ts`. Daftar notifikasi diambil lewat
`useNotifications`, dan event realtime meng-update cache.
`NotificationProvider` hanya menyediakan context untuk toast.
**Files:** `features/notifications/*`
**Verify:** Notifikasi baru muncul di header dan halaman notifikasi tanpa
reload, dan channel ditutup saat logout.
