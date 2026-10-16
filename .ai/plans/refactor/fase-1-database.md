# Fase 1: Baseline Database dan Operasi Stok Atomik

## Why
Beberapa operasi yang mengubah stok masih dijalankan langkah demi langkah dari
browser:

- `finishOpname` ([lib/api.ts:1488](../../../lib/api.ts)) meng-update
  `opname_detail` dan `master_obat.qty` dalam loop. Error-nya tidak dicek.
  Kalau koneksi putus di tengah jalan, sebagian stok sudah ditimpa dan sebagian
  belum, sementara opname belum berstatus `selesai`.
- `createTransaction` meng-insert header, detail, dan jasa secara terpisah.
  Kalau `update_stock_atomic` gagal, rollback-nya berupa delete manual dari
  client yang juga bisa gagal.
- `updateTransactionStatus` mengurangi stok dulu, baru mengubah status. Kalau
  update status gagal, stok dikembalikan lewat RPC kedua (`restoreStock`) yang
  error-nya hanya di-`console.error`.
- `resolveOpnameDifference`, `saveDraft`, `saveDetailOnly`, `completeStepOne`,
  dan `updateOpnameSelection` juga melakukan banyak write berurutan tanpa
  transaksi.

Selain itu, folder `supabase/migrations/` hanya berisi RLS, RPC, dan storage.
Tabel inti (`master_obat`, `transaksi`, `opname`, dll.) tidak ada di
migration, jadi project Supabase baru di akun lain tidak bisa dibangun dari
repo.

## What
1. Satu migration baseline yang membuat seluruh schema dari nol, termasuk
   tabel, enum, fungsi, trigger, RLS, dan bucket storage.
2. RPC Postgres untuk setiap operasi multi-langkah. Client cukup memanggil
   satu `supabase.rpc(...)` per aksi.

## Constraints
### Must
- Semua RPC `security invoker` agar tetap tunduk pada RLS, dengan
  `set search_path = public` seperti `update_stock_atomic`
- Validasi input dan pesan error dalam bahasa Indonesia, mengikuti gaya
  `update_stock_atomic`
- Lock baris `master_obat` berurutan per id untuk mencegah deadlock
- Signature fungsi di `lib/api.ts` tidak berubah, supaya komponen tidak perlu
  disentuh
- Baseline diuji di project Supabase baru yang masih kosong

### Must Not
- Mengubah struktur tabel atau nama kolom yang sudah dipakai
- Menghapus data di project prod/dev yang sudah ada
- Menjalankan baseline migration di project yang sudah punya tabel

### Out of Scope
- Refactor `lib/api.ts` per domain (fase 4)
- Generate tipe TypeScript dari schema (fase 3)

## Current State
- Relevant files:
  - `lib/api.ts`: `createTransaction` (366), `updateTransactionStatus` (666),
    `updatePendingStockOutRequest` (727), fungsi opname (978-1560),
    `getActiveOpnameLock` (1121)
  - `hooks/useOpnameLock.ts`, `components/OpnameLockPage.tsx`,
    `components/AuthenticatedApp.tsx:73`: kunci opname saat ini hanya di UI
    (polling 30 detik), dan hanya aktif di `current_step = 2`
  - `supabase/migrations/20261014000000_enable_rls_policies.sql`: helper
    `is_staff()`, `has_any_role()`, `can_edit_transaksi()`
  - `supabase/migrations/20261014010000_update_stock_atomic.sql`: pola RPC
    yang dijadikan acuan
  - `supabase/migrations/20261016000000_storage_bukti_stok_masuk.sql`
  - `docs/database_schema.md` (DBML, kemungkinan sudah tidak sinkron:
    masih ada tabel `users`, padahal aplikasi memakai `profiles` dan
    `user_roles`)
- Existing patterns:
  - `update_stock_atomic(p_items jsonb, p_tipe text)`: agregasi per
    `product_id`, `order by` id, `raise exception ... using errcode`

## Tasks

### T1: Baseline schema dari project dev
**What:** Dump schema project dev (`supabase db dump --schema public` plus
`auth` trigger yang membuat `profiles`, serta daftar tabel di publication
`supabase_realtime`), lalu rapikan menjadi
`supabase/migrations/20260101000000_baseline.sql`. Tanggalnya dibuat lebih awal
dari migration yang sudah ada supaya urutannya benar. Pastikan migration RLS,
RPC, dan storage yang sudah ada tetap jalan di atasnya (hindari duplikasi
`create policy` dan `create function`). Pastikan baseline berisi
`alter publication supabase_realtime add table public.notifications,
public.opname;` (`notifications` sudah dipakai realtime di
`NotificationProvider`, sedangkan `opname` dibutuhkan untuk kunci opname
realtime di fase 5 T3). Tambahkan `supabase/seed.sql` untuk role dan satu
user admin awal.
**Files:** `supabase/migrations/20260101000000_baseline.sql`,
`supabase/seed.sql`, `docs/database_schema.md`
**Verify:** `supabase db reset` di lokal atau `supabase db push` ke project
baru berjalan tanpa error, lalu aplikasi bisa login dan menampilkan dashboard
kosong.

### T2: RPC `create_transaction`
**What:** Buat RPC yang meng-insert `transaksi`, `transaksi_detail`, dan
`transaksi_jasa`. Kalau status `selesai`, RPC itu juga memanggil
`update_stock_atomic` di dalam transaksi yang sama, sehingga semuanya berhasil
atau tidak sama sekali. `created_by` diambil dari `auth.uid()`, bukan dari
client. `api.createTransaction` dibuat memanggil RPC ini, dan blok cleanup
manual dihapus.
**Files:** `supabase/migrations/2026xxxx_create_transaction.sql`, `lib/api.ts`
**Verify:** Stok keluar dengan qty melebihi stok ditolak, dan tidak ada baris
`transaksi` yatim yang tertinggal. Stok masuk menambah `qty`.

### T3: RPC `process_stock_out_request`
**What:** Gabungkan pengurangan stok dan perubahan status `diajukan` →
`selesai` (beserta diskon, total, dan biaya layanan) dalam satu RPC. Kunci
baris transaksi dengan `for update` dan tolak kalau status sudah bukan
`diajukan`. Dengan begitu `restoreStock` tidak diperlukan lagi.
**Files:** migration baru, `lib/api.ts` (`updateTransactionStatus`)
**Verify:** Dua tab yang memproses permintaan yang sama: satu berhasil, yang
lain mendapat pesan "sudah diproses" dan stok hanya berkurang sekali.

### T4: RPC `update_pending_stock_out_request`
**What:** Ganti header serta replace detail dan jasa dalam satu transaksi.
Tolak kalau status bukan `diajukan`.
**Files:** migration baru, `lib/api.ts` (`updatePendingStockOutRequest`)
**Verify:** Edit permintaan yang sudah diproses ditolak. Edit permintaan
pending mengganti item tanpa menyisakan duplikat.

### T5: Kunci stok selama opname di database
**What:** Aturan bisnis yang sudah diputuskan: **selama ada opname berstatus
`sedang_dilaksanakan`, semua transaksi yang mengubah stok ditolak**, dari
opname dimulai sampai `selesai` atau dihapus. Kunci ini harus ditegakkan di
database, bukan hanya di UI. Saat ini kuncinya hanya halaman `OpnameLockPage`
yang muncul lewat polling 30 detik, sehingga request langsung ke API atau tab
yang belum ter-refresh tetap bisa lolos.

- Buat fungsi `public.assert_no_active_opname()` yang melakukan `raise
  exception 'Stok sedang dikunci karena opname OPN-% sedang berjalan' using
  errcode = 'P0001'` kalau ada opname aktif (`deleted_at is null`).
- Panggil fungsi itu di awal `update_stock_atomic`, sehingga
  `create_transaction`, `process_stock_out_request`, dan semua jalur lain yang
  mengubah stok ikut terkunci. Tambahkan juga trigger `before update of qty`
  di `master_obat` yang memanggilnya, kecuali kalau perubahan berasal dari
  `finish_opname` (pakai `set_config('app.opname_finishing', 'on', true)` di
  dalam transaksi `finish_opname`, lalu trigger memeriksa nilai itu).
- Mulai opname (`startOpname`) ditolak kalau masih ada permintaan stok keluar
  berstatus `diajukan`, ATAU permintaan itu tetap boleh ada tetapi baru bisa
  diproses setelah opname selesai. Rekomendasi: pilihan kedua, karena RPC
  proses sudah otomatis ditolak oleh kunci di atas.
- **Perubahan perilaku:** saat ini kunci hanya aktif di `current_step = 2`,
  dan langkah 3 melepasnya. Dengan aturan baru, kunci aktif di langkah 1
  sampai 3. Sesuaikan `getActiveOpnameLock` (hapus filter `current_step`),
  komentar di kode, dan `docs/brd_opname.md`.
- Form stok masuk dan keluar menampilkan pesan error dari RPC apa adanya,
  sehingga pengguna paham kenapa transaksinya gagal.

**Files:** migration baru, `lib/api.ts` (`getActiveOpnameLock`,
`startOpname`), `hooks/useOpnameLock.ts`, `docs/brd_opname.md`
**Verify:** Mulai opname di tab A. Di tab B yang masih membuka halaman stok
keluar (belum ter-redirect ke halaman kunci), proses permintaan: ditolak
dengan pesan kunci opname dan stok tidak berubah. Panggil
`update_stock_atomic` langsung lewat SQL sebagai user staff: juga ditolak.

### T6: RPC `finish_opname`
**What:** Dalam satu transaksi: kunci baris `opname` dengan `for update`
(harus masih `sedang_dilaksanakan`), set flag `app.opname_finishing` dari T5,
set status tiap `opname_detail` (`sesuai` atau `disesuaikan`), set
`master_obat.qty = stok_final` (atau `stok_fisik` kalau `stok_final` null),
lalu tandai opname `selesai` dengan `completed_at = now()`. Karena stok
dikunci sejak opname dimulai (T5), `stok_sistem` dijamin tidak berubah
selama opname, sehingga menimpa `qty` dengan hasil hitung aman.
**Files:** migration baru, `lib/api.ts` (`finishOpname`)
**Verify:** Matikan jaringan setelah klik "Selesai": stok tidak berubah
sebagian. Klik "Selesai" dua kali: yang kedua ditolak. Setelah selesai,
transaksi stok kembali bisa dilakukan.

### T7: RPC untuk langkah opname lainnya
**What:** Pindahkan `completeStepOne`, `updateOpnameSelection`,
`backwardToStepOne`, `saveDraft`/`saveDetailOnly` (batch update detail dari
array JSON), dan `resolveOpnameDifference` ke RPC. Selisih dihitung di
database dari `stok_sistem`, bukan dengan membaca nilai lalu menulis ulang
dari client.
**Files:** migration baru, `lib/api.ts`
**Verify:** Alur opname lengkap (konfigurasi → pilih produk → input fisik →
resolusi selisih → selesai) berjalan, dan simpan draft 50 item cukup dengan
satu request.

### T8: Nomor transaksi dari database
**What:** `generateTransactionNumber` (`Date.now()` + random) diganti dengan
sequence Postgres atau dibuat di dalam `create_transaction`, supaya tidak
mungkin bentrok.
**Files:** migration RPC T2, `lib/api.ts`
**Verify:** 20 transaksi yang dibuat paralel menghasilkan nomor yang unik.
