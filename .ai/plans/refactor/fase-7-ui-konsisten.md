# Fase 7: Konsistensi UI

## Why
- Ada dua sistem ikon: Material Icons Round dari CDN Google (dipakai di 33
  file) dan `lucide-react` (dipakai di 3 file). Material Icons bergantung pada
  font eksternal, sehingga sempat muncul teks mentah seperti "refresh" sebelum
  font-nya ter-load.
- Komponen shadcn (`components/ui`) baru dipakai sebagian. Modal, tombol, dan
  input di banyak tempat masih ditulis manual dengan class Tailwind panjang.
  `ConfirmationModal` juga dibuat sendiri, padahal sudah ada `dialog.tsx`.
- Judul halaman (`getViewTitle` di `App.tsx:64`) menduplikasi daftar route di
  `AuthenticatedApp.tsx`, dan pengecekan role ditulis berulang di setiap
  `<Route>`.
- `isDarkMode` dan `setIsDarkMode` dioper sebagai prop dari `App`.

## What
Satu sistem ikon (lucide). Modal, tombol, input, dan select memakai komponen
`components/ui`. Ada satu konfigurasi route yang menjadi satu-satunya sumber
untuk path, judul, role, ikon sidebar, dan komponen lazy.

## Constraints
### Must
- Tampilan akhir semirip mungkin dengan yang sekarang (ukuran ikon, warna,
  spacing)
- Kerjakan per halaman, boleh berbarengan dengan PR fase 6 untuk halaman yang
  sama

### Must Not
- Redesain atau mengubah palet warna

### Out of Scope
- Aksesibilitas menyeluruh (catat temuan untuk audit terpisah)

## Current State
- Relevant files: semua komponen yang memakai `material-icons-round`,
  `src/components/ui/*`, `src/components/common/ConfirmationModal.tsx`,
  `src/app/App.tsx`, `src/app/AuthenticatedApp.tsx`,
  `src/components/layout/Sidebar.tsx`, `src/types/routes.ts`
  (`ROUTES`), `index.html` (link font ikon)
- Existing patterns: shadcn dengan `class-variance-authority` dan alias di
  `components.json`, serta token warna di `tailwind.config.js` dan
  `src/index.css`

## Tasks

### T1: Konfigurasi route terpusat
**What:** Buat `app/routes.tsx` berisi array `{ path, title, roles, icon,
element (lazy), showInSidebar }`. `AuthenticatedApp` me-render route dari
array itu. `Sidebar` dan judul header membaca array yang sama.
`getViewTitle` dihapus.
**Files:** `app/routes.tsx`, `AuthenticatedApp.tsx`, `Sidebar.tsx`,
`Header.tsx`, `App.tsx`
**Verify:** Menambah satu route cukup dengan menambah satu entri. Judul,
sidebar, dan proteksi role tetap benar untuk role admin, farmasi, apoteker,
dan nakes.

### T2: Hook tema
**What:** `useTheme()` berbasis context (atau langsung membaca
`localStorage`), menggantikan prop drilling `isDarkMode`. Tangani error dari
`localStorage` dengan try/catch.
**Files:** `app/providers/ThemeProvider.tsx`, `App.tsx`, `Header.tsx`
**Verify:** Toggle dark mode tersimpan setelah reload.

### T3: Migrasi ikon ke lucide
**What:** Buat tabel pemetaan nama Material → lucide di
`.ai/conventions/icons.md`, lalu ganti ikon per halaman. Setelah selesai,
hapus `<link>` Material Icons dari `index.html`.
**Files:** semua komponen yang memakai `material-icons-round`, `index.html`
**Verify:** `grep -rn "material-icons" src index.html` kosong, dan tidak ada
request ke `fonts.googleapis.com/icon`.

### T4: Pakai komponen ui di semua tempat
**What:** `ConfirmationModal` dibangun di atas `ui/dialog`. Tombol, input, dan
select manual diganti dengan `ui/button`, `ui/input`, dan `ui/select`.
Tambahkan komponen shadcn yang belum ada sesuai kebutuhan (`label`, `badge`,
`card`, `textarea`, `tabs`, `alert-dialog`).
**Files:** `components/ui/*`, komponen fitur
**Verify:** Cek visual tiap halaman di mode terang dan gelap.

### T5: Komponen state bersama
**What:** `LoadingState`, `EmptyState`, dan `ErrorState` dipakai di semua
tabel dan halaman (sekaligus melengkapi fase 5). `LoadingScreen` di `App.tsx`
dipindah ke sini.
**Files:** `components/common/*`
**Verify:** Matikan jaringan: setiap halaman menampilkan `ErrorState` dengan
tombol coba lagi.
