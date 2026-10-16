# Rencana Perbaikan Opnamix

Rencana ini menindaklanjuti hasil analisa project (Oktober 2026). Isinya
perbaikan integritas data, dependency, tooling, struktur folder, pola
pengambilan data, komponen, dan UI. Tiap fase punya spec sendiri dengan format
`.ai/templates/spec.md`.

## Keputusan teknologi

Project **tetap di Vite + React SPA**, tidak pindah ke Next.js:

- Aplikasi ini dashboard internal yang wajib login, jadi tidak butuh SEO
  maupun SSR.
- Backend sudah Supabase (RLS, RPC, Edge Function). Pekerjaan yang butuh
  server ditangani di sana.
- Kalau dimigrasi sebelum direfactor, kerapian komponen tidak ikut membaik.
  Strukturnya hanya pindah ke framework yang lebih rumit.

Pertimbangkan ulang hanya kalau nanti ada halaman publik atau banyak endpoint
server sendiri. Jalur bertahapnya: React Router 7 framework mode.

## Sudah selesai (sebelum rencana ini)

- Upload bukti stok masuk lewat Supabase Storage, S3 key dihapus dari client
  (`f0acdb0`, `f3ab136`)
- Edge Function `admin-users` memakai secret key baru (`a40e74f`)
- `VITE_SUPABASE_SERVICE_ROLE_KEY` dan `VITE_S3_*` dihapus dari file env lokal
- RLS dan `update_stock_atomic` (migration `20261014*`)

## Fase

| Fase | Spec | Inti | Risiko kalau ditunda |
|---|---|---|---|
| 1 | [fase-1-database.md](fase-1-database.md) | Baseline schema untuk project Supabase baru dan operasi stok yang atomik | Stok rusak kalau koneksi putus, dan project baru tidak bisa dibangun dari repo |
| 2 | [fase-2-dependency.md](fase-2-dependency.md) | Tutup CVE: xlsx, react-router, dan dependency transitif | Kerentanan yang sudah diketahui tetap ada di production |
| 3 | [fase-3-tooling.md](fase-3-tooling.md) | ESLint, typecheck, tipe dari Supabase, `strict`, Vitest | Refactor di fase 4-6 tanpa jaring pengaman |
| 4 | [fase-4-struktur-api.md](fase-4-struktur-api.md) | Folder per fitur, `lib/api.ts` dipecah per domain | File terus membesar, konflik merge |
| 5 | [fase-5-data-fetching.md](fase-5-data-fetching.md) | Semua fetching lewat React Query, komponen tidak memanggil `supabase` langsung | Cache tidak sinkron, data basi setelah mutasi |
| 6 | [fase-6-komponen.md](fase-6-komponen.md) | Pecah komponen raksasa, logika bisnis keluar dari UI, form dengan validasi | Sulit dirawat dan dites |
| 7 | [fase-7-ui-konsisten.md](fase-7-ui-konsisten.md) | Satu sistem ikon, komponen shadcn, satu sumber definisi route | Tampilan tidak konsisten, kode duplikat |
| 8 | [fase-8-upgrade-toolchain.md](fase-8-upgrade-toolchain.md) | Vite 8, Tailwind 4, TypeScript terbaru (opsional) | Rendah, upgrade rutin |

## Urutan dan ketergantungan

```
Fase 1 ──┐
Fase 2 ──┼──> Fase 3 ──> Fase 4 ──> Fase 5 ──> Fase 6 ──> Fase 7
         │                                                  │
         └──────────────────────────────────────────────> Fase 8 (kapan saja setelah 3)
```

- **Fase 1 dan 2 independen** dan bisa jalan paralel. Keduanya paling
  mendesak. Detailnya ada di bagian "Yang bisa dikerjakan paralel".
- **Fase 3 wajib sebelum refactor besar.** Typecheck dan lint menangkap
  regresi saat file dipindah dan dipecah.
- **Fase 4 → 5 → 6 berurutan.** Fase 5 butuh API per domain dari fase 4, dan
  fase 6 butuh hooks dari fase 5.
- **Fase 7 bisa dicicil** bersamaan dengan fase 6, per halaman yang sedang
  dipecah.

## Yang bisa dikerjakan paralel

Pekerjaan boleh paralel kalau file yang disentuh tidak sama. Konflik di
`pnpm-lock.yaml` tidak dihitung, karena cukup diselesaikan dengan
`pnpm install` ulang.

| Gelombang | Jalur paralel | Catatan |
|---|---|---|
| A | **Fase 1** (`supabase/migrations`, fungsi stok/opname di `lib/api.ts`) ∥ **Fase 2** (`package.json`, `lib/exportUtils.ts`, `index.html`) ∥ **Fase 3 T1, T3, T5, T6** (script typecheck, tipe Supabase, Vitest, CI) | Fase 3 T3 sebaiknya generate tipe setelah baseline fase 1 T1 ada |
| B | **Fase 3 T2 dan T4** (Prettier format seluruh repo, `strict`, hapus `any` di `lib/api.ts`) | Tunggu fase 1 dan 2 di-merge. Format massal bentrok dengan semua branch yang terbuka |
| C | **Fase 4**, sendirian | Memindahkan semua file. Jangan ada branch lain yang terbuka |
| D | **Fase 5 T1** dulu (key factory), lalu T2 ∥ T3 ∥ T4 ∥ T5 ∥ T6 per domain | Tiap domain punya folder `features/*` sendiri |
| E | **Fase 6** per halaman (stock-out ∥ opname ∥ users ∥ reports ∥ form lain) ∥ **Fase 7 T1, T2** (routes, tema) | Fase 7 T3 dan T4 (ikon, komponen ui) dikerjakan di PR yang sama dengan fase 6 untuk halaman yang sama, supaya tidak dua kali menyentuh file yang sama |
| F | **Fase 8**: T1 (Vite) lalu T2 (Tailwind) berurutan karena sama-sama mengubah `vite.config.ts`. T3 (TypeScript) ∥ T4 (TanStack Table, lucide) | Bisa mulai kapan saja setelah gelombang B, asal tidak bersamaan dengan fase 4 |

Di dalam fase 1, T1 (baseline) dikerjakan dulu karena semua RPC diuji di atas
schema itu. Setelah itu, T2-T4 (transaksi) bisa paralel dengan T5-T7 (opname).
Kedua jalur menyentuh fungsi yang berbeda di `lib/api.ts`, tetapi T5 mengubah
`update_stock_atomic` yang dipakai T2 dan T3, jadi merge T5 lebih dulu.

## Aturan kerja untuk semua fase

- Satu fase = satu branch dan satu PR. Fase besar (4, 6) boleh dipecah per
  fitur.
- Jangan ubah perilaku dan struktur di commit yang sama. Pindah/rename file
  dulu, baru ubah isinya di commit berikutnya.
- Setiap task harus lolos `pnpm build`, dan mulai fase 3 juga `pnpm typecheck`
  dan `pnpm lint`.
- Uji manual alur utama setelah tiap fase: login, stok masuk dengan foto,
  permintaan dan proses stok keluar, opname dari konfigurasi sampai selesai,
  export laporan.
