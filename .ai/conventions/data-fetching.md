# Konvensi Pengambilan Data

Berlaku mulai fase 5. Semua baca/tulis data lewat TanStack Query.

## Lapisan

```
komponen  →  src/features/<domain>/use<Nama>.ts  →  src/features/<domain>/api.ts  →  supabase
```

- **Komponen** hanya memanggil hook. Komponen tidak boleh mengimpor
  `@/lib/supabaseClient` maupun objek API domain (`productsApi`, `opnameApi`,
  dll.).
- **Hook** (`use<Nama>.ts`) membungkus `useQuery`/`useMutation`, memakai key
  dari `keys.ts`, dan menangani invalidasi.
- **API** (`api.ts`) berisi satu objek per domain (`productsApi`, ...) yang
  memanggil Supabase dan memetakan baris DB ke tipe domain. API tidak tahu
  soal React Query.

## Query key

Setiap domain punya `src/features/<domain>/keys.ts`:

```ts
export const productKeys = {
  all: ['products'] as const,
  list: (params?: PaginationParams) => [...productKeys.all, 'list', params] as const,
};
```

- Selalu mulai dari `<domain>Keys.all`, supaya invalidasi satu domain cukup
  `invalidateQueries({ queryKey: <domain>Keys.all })`.
- Jangan menulis array key secara literal di hook atau komponen.
- Tambahkan key baru ke `keys.ts` domainnya, jangan membuat file key kedua.

| Domain | File | Key |
|---|---|---|
| products | `features/products/keys.ts` | `productKeys.all`, `.list(params)` |
| services | `features/services/keys.ts` | `serviceKeys.all`, `.list(params)`, `serviceCategoryKeys.all` |
| stock-in | `features/stock-in/keys.ts` | `stockInKeys.all`, `.list(params)` |
| stock-out | `features/stock-out/keys.ts` | `stockOutKeys.all`, `.list(params)`, `.recent(limit)`, `.nakesProfiles()` |
| dashboard | `features/dashboard/keys.ts` | `dashboardKeys.all`, `.stats()`, `.recentTransactions(page, perPage)` |
| reports | `features/reports/keys.ts` | `reportKeys.all`, `.transactions(start, end, params)`, `.stockMutations(start, end, params)` |
| opname | `features/opname/keys.ts` | `opnameKeys.all`, `.schedules()`, `.activeSchedules()`, `.upcoming()`, `.drafts()`, `.detail(id)`, `.detailView(id)`, `.history()`, `.lock()` |
| users | `features/users/keys.ts` | `userKeys.all`, `.list()` |
| profile | `features/profile/keys.ts` | `profileKeys.all`, `.detail(userId)` |
| notifications | `features/notifications/keys.ts` | `notificationKeys.all`, `.list(userId)` |

## Nama hook

- Query: `use<Nama>` (contoh `useProducts`, `useOpname(id)`, `useDashboardStats`)
- Mutasi: `use<Aksi><Nama>` (contoh `useCreateProduct`, `useFinishOpname`)
- Realtime: `use<Nama>Realtime` (contoh `useStockOutRealtime`)
- File: `use<Nama>.ts`, boleh berisi beberapa hook untuk satu sumber data.
  Tidak ada `hooks.ts` atau barrel `index.ts`.

## Invalidasi

Invalidasi di dalam domain sendiri ditulis di hook (`<domain>Keys.all`).
Invalidasi **lintas domain** hanya lewat helper di `src/lib/invalidate.ts`,
supaya daftarnya ada di satu tempat:

| Kejadian | Helper | Yang di-refresh |
|---|---|---|
| Stok obat berubah (stok masuk, stok keluar manual, proses permintaan) | `invalidateStockChange` | products, stockIn, stockOut, dashboard, reports |
| Opname berubah (mulai, pindah langkah, selesai, hapus) | `invalidateOpnameChange` | opname + semua yang di atas |
| Permintaan stok keluar diajukan/diedit (stok belum berubah) | langsung di hook | stockOut (+ dashboard untuk hitungan tertunda) |
| Master produk/jasa diubah | langsung di hook | products / services |
| User atau profil diubah | langsung di hook (+ `refreshProfile()` dari `useAuth` untuk Header) | users, profile |
| Notifikasi masuk / ditandai dibaca | `setQueryData` (realtime, optimistic update) | notifications |

Kalau ada kejadian baru yang memengaruhi lebih dari satu domain, tambahkan
helper baru di `invalidate.ts` dan baris di tabel ini.

## Realtime

- Event realtime hanya memanggil `invalidateQueries` atau `setQueryData`.
  Jangan menyimpan data realtime di `useState`.
- Tidak ada polling `setInterval`/`refetchInterval` untuk data yang bisa
  didengar lewat realtime.
- Event yang terjadi saat koneksi putus akan hilang, jadi query yang dijaga
  realtime perlu di-refetch saat channel kembali `SUBSCRIBED` atau tab
  kembali aktif.
- Tutup channel (`supabase.removeChannel`) saat unmount atau logout.

## Default

Default `QueryClient` ada di `src/app/App.tsx`: `staleTime` 60 detik,
`refetchOnWindowFocus: false`, `retry: 1`. Override per query hanya kalau ada
alasannya (misalnya master data 1 jam, kunci opname `refetchOnWindowFocus:
'always'`, karena dengan `true` cek ulang dilewati selama data belum basi).

## Pembuatan channel realtime

Channel dibuat di `api.ts` domain (misalnya
`opnameApi.subscribeToOpnameChanges`), bukan di hook atau komponen. Beri nama
channel yang unik per langganan: `supabase.channel(nama)` mengembalikan
channel lama kalau namanya sama, dan dengan StrictMode channel lama itu bisa
sedang ditutup.
