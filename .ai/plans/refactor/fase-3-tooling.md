# Fase 3: Fondasi Tooling

## Why
Saat ini tidak ada ESLint, Prettier, test, maupun script typecheck.
`tsconfig.json` juga belum `strict`. Ada 52 `any` di `lib/api.ts` dan puluhan
lainnya di komponen, dan bentuk data dari Supabase diketik manual di
`types.ts`. Refactor besar di fase 4-6 tanpa pengaman ini rawan regresi diam.

## What
Script `pnpm typecheck`, `pnpm lint`, dan `pnpm test` yang lolos. Tipe tabel
di-generate dari Supabase. `strict` aktif. Ada test untuk logika bisnis yang
paling berisiko.

## Constraints
### Must
- Aktifkan aturan secara bertahap: perbaiki error yang ada, jangan
  di-`eslint-disable` massal
- Tipe Supabase di-generate dengan perintah yang bisa diulang (script di
  `package.json`)

### Must Not
- Mengubah perilaku aplikasi
- Memformat ulang seluruh repo dalam commit yang sama dengan perubahan logika

### Out of Scope
- Test komponen/E2E menyeluruh (cukup unit test untuk kalkulasi)
- CI pipeline, kecuali GitHub Actions sederhana di T6

## Current State
- Relevant files: `tsconfig.json` (`experimentalDecorators` dan `allowJs`
  tidak diperlukan), `types.ts`, `lib/api.ts`, `package.json`
- Existing patterns: belum ada

## Tasks

### T1: Script typecheck dan bersihkan tsconfig
**What:** Tambahkan `"typecheck": "tsc --noEmit"`. Hapus
`experimentalDecorators`, `useDefineForClassFields`, dan `allowJs`. Perbaiki
error yang muncul.
**Files:** `package.json`, `tsconfig.json`
**Verify:** `pnpm typecheck` keluar dengan kode 0.

### T2: ESLint dan Prettier
**What:** ESLint flat config dengan `typescript-eslint`,
`eslint-plugin-react-hooks`, dan `eslint-plugin-react-refresh`. Prettier
dengan config minimal. Format seluruh repo dalam **satu commit tersendiri**,
lalu tambahkan hash commit itu ke `.git-blame-ignore-revs`.
**Files:** `eslint.config.js`, `.prettierrc`, `.git-blame-ignore-revs`,
`package.json`
**Verify:** `pnpm lint` lolos. Peringatan `react-hooks/exhaustive-deps`
dicatat sebagai bahan fase 5, bukan disembunyikan.

### T3: Generate tipe database
**What:** Tambahkan script `"db:types": "supabase gen types typescript
--project-id <dev> > lib/database.types.ts"`. Ketik client dengan
`createClient<Database>(...)` di `lib/supabaseClient.ts`.
**Files:** `package.json`, `lib/database.types.ts`, `lib/supabaseClient.ts`
**Verify:** Hover hasil `supabase.from('master_obat').select()` menampilkan
tipe kolom yang benar.

### T4: Hilangkan `any` dan aktifkan strict
**What:** Ganti `any` di `lib/api.ts` dan `lib/exportUtils.ts` dengan tipe
dari `database.types.ts` dan `types.ts`. Aktifkan `strict: true`. Kalau error
terlalu banyak, mulai dari `strictNullChecks`, dan lanjutkan ke opsi strict
lainnya per PR.
**Files:** `tsconfig.json`, `lib/*`, `hooks/*`, komponen yang error
**Verify:** `pnpm typecheck` lolos dengan `strict: true`, dan
`grep -rn ": any\|as any" lib hooks components` menghasilkan ≤ 5 baris yang
masing-masing diberi komentar alasannya.

### T5: Vitest untuk logika bisnis
**What:** Pasang Vitest. Ekstrak lalu tes fungsi murni: perhitungan total
stok keluar (subtotal, diskon, biaya layanan; saat ini ada di
`getRequestTotals` di `StockOutManagement.tsx`), selisih opname, dan
`getDisplayNameFromMasterObat`. Ekstraksi penuh dilakukan di fase 6. Di sini
cukup fungsi yang bisa dipindah tanpa mengubah perilaku.
**Files:** `vitest.config.ts`, `lib/*.test.ts`, `package.json`
**Verify:** `pnpm test` lolos dengan kasus diskon 0, diskon penuh, dan
tanpa jasa.

### T6: CI sederhana (opsional)
**What:** GitHub Actions yang menjalankan `install → typecheck → lint → test
→ build` di setiap PR.
**Files:** `.github/workflows/ci.yml`
**Verify:** Workflow hijau di PR fase ini.
