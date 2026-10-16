# Fase 4: Struktur Folder per Fitur dan API per Domain

## Why
- `components/`, `hooks/`, dan `lib/` ada di root, sedangkan `src/` hanya
  berisi `index.css` (sisa template AI Studio).
- Komponen domain (stok masuk, stok keluar, produk, user) tercampur dengan
  komponen umum (`StatCard`, `PaginationControls`, `ConfirmationModal`). Hanya
  `StockOpname/` yang punya subfolder.
- `lib/api.ts` berisi 2024 baris dan 48 fungsi untuk semua domain, sehingga
  setiap perubahan menyentuh file yang sama.

## What
Struktur folder baru:

```
src/
  app/                 App.tsx, AuthenticatedApp, routes, providers
  components/
    ui/                shadcn (button, dialog, table, ...)
    common/            StatCard, PaginationControls, ConfirmationModal, ErrorBoundary
    layout/            Header, Sidebar
  features/
    auth/              LoginPage, useAuth, api.ts
    dashboard/
    products/          ProductManagement, ProductForm, ProductColumns, api.ts, hooks.ts
    services/
    stock-in/
    stock-out/
    opname/            (isi StockOpname/ + spec/)
    reports/           StockReport, TransactionReportColumns, StockMutationColumns, exportUtils
    users/
    notifications/
    profile/
  lib/                 supabaseClient, utils, database.types, imageCompression
  types/               tipe domain yang dipakai lintas fitur
  index.css
  main.tsx
```

## Constraints
### Must
- Pindahkan file dengan `git mv` di commit tersendiri, tanpa mengubah isi
  kecuali path import, supaya history tetap terlacak
- Pakai alias `@/` (arahkan ke `src/`) untuk semua import lintas folder
- Setiap `features/*/api.ts` hanya berisi query untuk domain itu

### Must Not
- Mengubah perilaku atau logika fungsi API
- Membuat barrel `index.ts` yang me-re-export semuanya (menyulitkan
  code-splitting)

### Out of Scope
- Mengganti pola fetching (fase 5)
- Memecah komponen besar (fase 6)

## Current State
- Relevant files: semua file di `components/`, `hooks/`, `lib/`, `App.tsx`,
  `index.tsx`, `types.ts`, `vite.config.ts` (alias `@` → root),
  `tsconfig.json` (`paths`), `components.json` (alias shadcn), `index.html`
  (`/index.tsx`)
- Existing patterns: `React.lazy` per halaman di `AuthenticatedApp.tsx`

## Tasks

### T1: Pindahkan ke `src/` dan perbarui alias
**What:** `git mv` semua folder kode ke `src/`. `@` diarahkan ke `src` di
`vite.config.ts`, `tsconfig.json`, dan `components.json`. Ubah entry di
`index.html` menjadi `/src/main.tsx`.
**Files:** semua file kode, file config di atas
**Verify:** `pnpm typecheck && pnpm build` lolos, dan semua halaman terbuka.

### T2: Kelompokkan komponen per fitur
**What:** Pindahkan komponen ke `features/*`, `components/common`, dan
`components/layout` sesuai bagan di atas. Ganti import relatif `../../` dengan
`@/`.
**Files:** semua komponen
**Verify:** `pnpm typecheck && pnpm build`, dan nama chunk lazy-load di
`dist/assets` masih satu per halaman.

### T3: Pecah `lib/api.ts` per domain
**What:** Pindahkan fungsi ke `features/<domain>/api.ts`:
- products: `getProducts` s/d `deleteProduct`, `getDistinctSuppliers`
- services: `getServices` s/d `deleteService`, `getServiceCategories`,
  `createServiceCategory`
- stock-in/stock-out: `createTransaction`, `uploadReceiptImage`,
  `getStockInReceipts`, `getStockOutRequests`, `updateTransactionStatus`,
  `updatePendingStockOutRequest`, `getRecentStockOuts`, `getNakesProfiles`
- opname: semua fungsi opname dan jadwal, serta `getActiveOpnameLock`
- reports: `getTransactionReport`, `getStockMutationReport`
- dashboard: `getDashboardStats`, `getExpiringProducts`,
  `getRecentTransactions`
- notifications: `createNotification` (gabungkan dengan `lib/notifications.ts`)

Mapper baris DB → tipe domain (misalnya `mapStockOutRequest`) diletakkan di
`features/<domain>/mappers.ts`. Hapus `lib/api.ts` setelah kosong.
**Files:** `lib/api.ts`, `features/*/api.ts`, semua pemanggil `api.*`
**Verify:** `grep -rn "lib/api" src` kosong, dan `pnpm typecheck && pnpm
build` lolos.

### T4: Rapikan `types.ts`
**What:** Pecah tipe domain ke `features/<domain>/types.ts`. Tipe yang dipakai
lintas fitur (`PaginationParams`, `PaginatedResponse`, `ROUTES`) dipindah ke
`types/`. Tipe bentuk tabel diambil dari `database.types.ts`.
**Files:** `types.ts`, `features/*/types.ts`, `types/*`
**Verify:** `pnpm typecheck` lolos.
