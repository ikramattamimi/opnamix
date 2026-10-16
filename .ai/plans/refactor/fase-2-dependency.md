# Fase 2: Dependency dan Kerentanan

## Why
Sebelum `@aws-sdk` dihapus, `pnpm audit --prod` melaporkan 40 kerentanan
(1 critical, 21 high). `fast-xml-parser` sudah hilang bersama `@aws-sdk`.
Sisanya:

- `xlsx@0.18.5`: SheetJS berhenti merilis ke npm, dan versi ini kena
  prototype pollution serta ReDoS
- `react-router` 7.12: rentan, perbaikannya mulai ≥7.15.1
- Transitif: `picomatch`, `braces`, `nanoid`, `postcss`, `ws`, `yaml`,
  `source-map-js`, `postcss-selector-parser`

Ada juga sisa template AI Studio: `importmap` ke esm.sh di `index.html` dan
`@types/react-router-dom` v5, yang tidak cocok dengan React Router 7.

## What
`pnpm audit --prod` bersih dari high dan critical. Export Excel tetap jalan
dengan library yang masih dirawat.

## Constraints
### Must
- Hasil export Excel (kolom, format angka dan tanggal, nama file) sama seperti
  sebelumnya
- Library export tetap di-load secara dinamis (`import()`) supaya bundle awal
  tidak membesar

### Must Not
- Upgrade major Vite, Tailwind, atau TypeScript (itu fase 8)

### Out of Scope
- Refactor `lib/exportUtils.ts` di luar penggantian library

## Current State
- Relevant files:
  - `lib/exportUtils.ts`: `loadXLSX()`, `json_to_sheet`, `writeFile`
    (laporan transaksi dan mutasi stok)
  - `index.html`: `importmap` dan `<style>` yang menduplikasi `src/index.css`
  - `package.json`
- Existing patterns: chunk `vendor-xlsx` di `vite.config.ts`

## Tasks

### T1: Ganti xlsx
**What:** Pilih salah satu: (a) `xlsx` dari CDN resmi SheetJS
(`https://cdn.sheetjs.com/xlsx-0.20.x/xlsx-0.20.x.tgz`) dengan API yang sama
dan perubahan minimal, atau (b) `exceljs`, yang lebih besar tapi mendukung
styling. Rekomendasi: (a). Sesuaikan aturan `manualChunks`.
**Files:** `package.json`, `lib/exportUtils.ts`, `vite.config.ts`
**Verify:** Export Laporan Transaksi dan Mutasi Stok terbuka di Excel dengan
isi yang sama seperti sebelum diganti.

### T2: React Router dan tipe yang usang
**What:** Naikkan `react-router-dom` ke 7.x terbaru dan hapus
`@types/react-router-dom`.
**Files:** `package.json`
**Verify:** `pnpm build` lolos, dan navigasi semua menu serta redirect saat
akses tanpa role berjalan.

### T3: Update minor dan patch lainnya
**What:** `pnpm update` dalam range semver yang ada untuk React, Supabase,
TanStack, Radix, lucide, dan PostCSS. Tambahkan `pnpm.overrides` hanya kalau
masih ada CVE transitif yang belum tertutup.
**Files:** `package.json`, `pnpm-lock.yaml`
**Verify:** `pnpm audit --prod` tanpa high dan critical, dan `pnpm build`
lolos.

### T4: Bersihkan sisa template
**What:** Hapus `importmap` dan blok `<style>` duplikat di `index.html`.
Pindahkan font dan Material Icons ke `<link>` yang memang dipakai (sampai
fase 7 menyatukan ikon).
**Files:** `index.html`, `src/index.css`
**Verify:** Tidak ada request ke esm.sh di tab Network, dan tampilan
(scrollbar, font, dark mode) tidak berubah.
