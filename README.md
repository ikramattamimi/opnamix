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

| Role | Akses |
| --- | --- |
| `admin` | Semua fitur, termasuk manajemen pengguna |
| `farmasi`, `apoteker` | Menulis master data, stok masuk/keluar, dan opname |
| `nakes` | Membaca data dan mengajukan permintaan stok keluar miliknya sendiri |

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

| Perintah | Fungsi |
| --- | --- |
| `pnpm build` | Build produksi ke `dist/` |
| `pnpm preview` | Menjalankan hasil build secara lokal |

## Menyiapkan Supabase

1. Buat project Supabase baru.
2. Jalankan migration di `supabase/migrations/` (RLS + role policy, dan RPC `update_stock_atomic`).
3. Deploy Edge Function untuk manajemen pengguna:
   ```bash
   supabase functions deploy admin-users
   ```
4. Buat bucket Storage publik bernama `bukti-stok-masuk`.
5. Buat user admin pertama lewat Supabase Auth, lalu tambahkan barisnya di tabel `user_roles` dengan role `admin`.

> **Catatan:** skema tabel dasar belum tersedia sebagai migration. Rujukan strukturnya ada di [`docs/database_schema.md`](docs/database_schema.md) dan [`docs/database_documentation.md`](docs/database_documentation.md).

## Struktur proyek

```
components/        Halaman dan komponen UI (StockOpname/ berisi modul opname + spesifikasinya)
hooks/             React Query hooks per domain
lib/               Klien Supabase, API, auth, ekspor, utilitas
supabase/          Migration SQL dan Edge Functions
docs/              Analisis sistem, BRD, spesifikasi, dan dokumentasi database
```

Panduan komponen UI ada di [`DEVELOPMENT.md`](DEVELOPMENT.md).
