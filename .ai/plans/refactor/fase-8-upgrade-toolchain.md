# Fase 8: Upgrade Toolchain (Opsional)

## Why
Per Oktober 2026, versi toolchain sudah tertinggal beberapa major:

| Paket | Sekarang | Terbaru |
|---|---|---|
| vite | 6.4 | 8.x |
| @vitejs/plugin-react | 5.x | 6.x |
| tailwindcss | 3.4.17 | 4.x |
| typescript | 5.8 | 7.x |
| @tanstack/react-table | 8.21 | 9.x |
| lucide-react | 0.562 | 1.x |
| @types/node | 22 | 26 |

Versi lama masih jalan, tapi makin lama ditunda, makin besar lompatan
upgrade-nya dan makin sedikit perbaikan keamanan yang didapat.

## What
Toolchain di major terbaru dengan perilaku aplikasi yang sama.

## Constraints
### Must
- Satu paket major per PR
- Sudah ada typecheck, lint, dan test dari fase 3 sebelum mulai

### Must Not
- Menggabungkan upgrade dengan refactor fitur

### Out of Scope
- Migrasi framework (Next.js, Remix). Lihat keputusan di README

## Current State
- Relevant files: `package.json`, `vite.config.ts`, `tailwind.config.js`,
  `postcss.config.js`, `src/index.css`, `tsconfig.json`, `components.json`
- Existing patterns: `manualChunks` kustom di `vite.config.ts`, dan token
  warna HSL di `src/index.css` dengan `tailwindcss-animate`

## Tasks

### T1: Vite 8 dan plugin-react 6
**What:** Ikuti panduan migrasi Vite 7 lalu 8 (perubahan target browser dan
Rolldown). Periksa apakah `manualChunks` masih diperlukan atau perlu diganti
dengan opsi Rolldown.
**Files:** `package.json`, `vite.config.ts`
**Verify:** `pnpm build` dan `pnpm dev` jalan, dan ukuran chunk tidak membesar
signifikan.

### T2: Tailwind 4
**What:** Jalankan `npx @tailwindcss/upgrade`. Konfigurasi pindah ke CSS
(`@theme`), PostCSS diganti `@tailwindcss/vite`, dan `tailwindcss-animate`
diganti `tw-animate-css`. Perbarui `components.json` sesuai shadcn untuk
Tailwind 4.
**Files:** `tailwind.config.js` (dihapus), `postcss.config.js` (dihapus),
`src/index.css`, `vite.config.ts`, `components.json`, `package.json`
**Verify:** Bandingkan screenshot sebelum dan sesudah untuk setiap halaman, di
mode terang dan gelap.

### T3: TypeScript terbaru
**What:** Naikkan TypeScript, lalu perbaiki error baru di `pnpm typecheck`.
**Files:** `package.json`, file yang error
**Verify:** `pnpm typecheck` lolos.

### T4: TanStack Table 9 dan lucide 1.x
**What:** Ikuti panduan migrasi masing-masing. Untuk TanStack Table, cek
perubahan API pada `components/ui/data-table.tsx` dan `*Columns.tsx`.
**Files:** `package.json`, `components/ui/data-table*.tsx`, `*Columns.tsx`
**Verify:** Sorting, filter kolom, dan pagination di semua tabel berjalan.
