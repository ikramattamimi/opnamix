<div align="center">
  <img src="public/logo.svg" width="72" height="72" alt="Logo Opnamix" />

  <h1>Opnamix</h1>

  <p>Sistem manajemen inventaris obat dan jasa untuk klinik, praktik mandiri, dan apotek kecil.<br/>
  Stok masuk, stok keluar, dan stock opname dalam satu aplikasi web.</p>
</div>

---

## Fitur

- **Master data**: produk (obat/BMHP) dengan kode, satuan, harga, dan buffer stok, serta master data jasa.
- **Stok masuk**: penerimaan barang dengan foto bukti (dikompres ke WebP sebelum diunggah).
- **Stok keluar**: pengeluaran manual oleh staf, atau alur permintaan dari tenaga kesehatan yang disetujui staf.
- **Stock opname**: konfigurasi sesi, pelaksanaan bertahap (pilih item, input stok fisik, penyesuaian), simpan draft, dan riwayat. Selama opname berjalan, transaksi stok dikunci.
- **Laporan**: mutasi stok dan laporan transaksi, bisa diekspor ke Excel.
- **Dasbor dan notifikasi**: ringkasan stok, peringatan stok di bawah buffer, dan notifikasi dalam aplikasi.
- **Manajemen pengguna**: multi-role dengan akses yang ditegakkan oleh Row Level Security di database.

### Role

| Role                  | Akses                                                               |
| --------------------- | ------------------------------------------------------------------- |
| `admin`               | Semua fitur, termasuk manajemen pengguna                            |
| `farmasi`, `apoteker` | Menulis master data, stok masuk/keluar, dan opname                  |
| `nakes`               | Membaca data dan mengajukan permintaan stok keluar miliknya sendiri |

## Teknologi

- React 19, TypeScript, Vite
- Tailwind CSS, Radix UI / shadcn/ui, TanStack Table, TanStack Query
- Supabase: Postgres + RLS, Auth, Storage, Edge Functions
- Deploy: Vercel (SPA rewrite di `vercel.json`)

## Menjalankan secara lokal

Prasyarat: Node.js 20+ dan [pnpm](https://pnpm.io/).

```bash
pnpm install
cp .env.example .env.local   # isi dengan kredensial project Supabase Anda
pnpm dev
```

Perintah lain:

| Perintah         | Fungsi                                                   |
| ---------------- | -------------------------------------------------------- |
| `pnpm build`     | Build produksi ke `dist/`                                |
| `pnpm preview`   | Menjalankan hasil build secara lokal                     |
| `pnpm typecheck` | Cek tipe TypeScript                                      |
| `pnpm lint`      | ESLint                                                   |
| `pnpm format`    | Format dengan Prettier (`format:check` untuk cek saja)   |
| `pnpm test`      | Unit test (Vitest)                                       |
| `pnpm db:types`  | Generate `src/lib/database.types.ts` dari project linked |

## Menyiapkan Supabase

Seluruh schema, RLS, RPC, bucket Storage, dan realtime ada di `supabase/migrations/`, dimulai dari `20260101000000_baseline.sql`.

```bash
npx supabase login
npx supabase link --project-ref <ref>
npx supabase db push --include-seed
npx supabase functions deploy admin-users
```

`--include-seed` menjalankan `supabase/seed.sql`: master data awal dan satu user admin dengan password yang tertulis di file itu. **Ganti password admin segera setelah login pertama.**

Untuk project yang sudah berjalan sebelum baseline ada, jangan jalankan baseline. Tandai sebagai sudah diterapkan dengan `npx supabase migration repair --status applied 20260101000000`, lalu `db push` untuk migration sesudahnya.

Jalankan `pnpm db:types` dari Git Bash, bukan PowerShell 5.1 (tanda `>` di PowerShell 5.1 menulis file dalam UTF-16).

## Struktur proyek

```
src/
  app/             App, AuthenticatedApp (routing dan provider)
  components/      ui/ (shadcn), common/ (StatCard, modal, paginasi), layout/ (Header, Sidebar)
  features/        Satu folder per fitur: halaman, komponen, hook, api.ts, keys.ts, mappers.ts, types.ts
                   (opname/spec/ berisi spesifikasi modul opname)
  lib/             Klien Supabase, database.types, invalidasi query lintas fitur, utilitas
  types/           Tipe lintas fitur (paginasi, routes, ApiResult)
supabase/          Migration SQL dan Edge Functions
docs/              Analisis sistem, BRD, spesifikasi, dan dokumentasi database
```

Panduan komponen UI ada di [`DEVELOPMENT.md`](DEVELOPMENT.md).
