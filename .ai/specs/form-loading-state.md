# Form Loading State

## Why
All submit forms in the app have no loading/disabled state during API calls, causing the submit button to remain clickable while the mutation is in-flight. This lets users double-submit, which hits the API twice and saves duplicate data.

## What
Add a loading state (disabled submit button + visual spinner/text change) to every form that performs an async action. Forms that delegate saving to a parent component receive an `isLoading` prop; inline forms use the mutation's `.isPending` directly.

## Constraints
### Must
- Disable the submit button while the API call is in-flight
- Show a visible loading indicator (spinner icon or text change)
- Prevent double-submission on all forms
- Use mutation `.isPending` where React Query is available; use local `isSubmitting` state where the action chains multiple async operations

### Must Not
- Refactor form data logic or validation
- Change API calls, hooks, or data-fetching logic
- Break existing prop interfaces beyond adding the optional `isLoading` prop

### Out of Scope
- Adding loading states to read/fetch operations (tables, lists)
- Changing error handling patterns
- Refactoring class structure or component hierarchy

## Current State
- Relevant files:
  - `components/ProductForm.tsx` — no loading state; calls `onSave(product)` synchronously
  - `components/ProductManagement.tsx` — `handleSave` is async, uses `createMutation` / `updateMutation`, never passed as loading to form
  - `components/StockInForm.tsx` — has `isCompressing` only; parent `handleSaveReceipt` async chain not reflected in button state
  - `components/StockInManagement.tsx` — `handleSaveReceipt` runs `generateTransactionNumber + uploadReceiptImage + mutateAsync`, no `isSubmitting` guard
  - `components/StockOutManualForm.tsx` — no loading state; calls `onSave(record)` synchronously
  - `components/StockOutRequestForm.tsx` — no loading state; calls `onSave(request)` synchronously
  - `components/StockOutManagement.tsx` — `handleSaveManualRecord` and `handleSaveRequest` are async, not passed to forms
  - `components/ServiceManagement.tsx` — inline service form submit button has no `disabled`; uses `createService` / `updateService` mutations
  - `components/StockOpname/KonfigurasiOpnamePage.tsx` — `handleSave` calls API directly, no `isSaving` state
  - `components/StockOpname/PelaksanaanOpnamePage.tsx` — has `isSaving` but "Lanjutkan" buttons not guarded with `disabled={isSaving}`
- Existing patterns:
  - React Query mutations expose `.isPending` — use where applicable
  - `useState(false)` + try/finally pattern — use for multi-step async chains
  - Spinner pattern: `<span className="material-icons-round animate-spin">refresh</span>` (already used in StockInForm)

## Tasks

### T1: ProductForm + ProductManagement
**What:** Add `isLoading?: boolean` prop to `ProductForm`. Disable submit button and show spinner when `isLoading` is true. In `ProductManagement.handleSave`, pass `createMutation.isPending || updateMutation.isPending` as `isLoading` prop.
**Files:** `components/ProductForm.tsx`, `components/ProductManagement.tsx`
**Verify:** Clicking "Tambah Data Produk" / "Update Data Produk" disables the button until the mutation resolves.

### T2: StockInForm + StockInManagement
**What:** Add `isLoading?: boolean` prop to `StockInForm`. Merge with `isCompressing` so button is disabled during both compression AND DB save. In `StockInManagement`, add local `isSubmitting` state wrapping the full `handleSaveReceipt` chain; pass it to the form.
**Files:** `components/StockInForm.tsx`, `components/StockInManagement.tsx`
**Verify:** "Simpan Data" stays disabled during image compression AND during the API save.

### T3: StockOutManualForm + StockOutManagement
**What:** Add `isLoading?: boolean` prop to `StockOutManualForm`. Disable submit button and show spinner. In `StockOutManagement`, pass `createTransaction.isPending` as `isLoading` to `StockOutManualForm`.
**Files:** `components/StockOutManualForm.tsx`, `components/StockOutManagement.tsx`
**Verify:** "Kirim Permintaan" on manual form stays disabled until the transaction is saved.

### T4: StockOutRequestForm + StockOutManagement
**What:** Add `isLoading?: boolean` prop to `StockOutRequestForm`. Disable submit button and show spinner. In `StockOutManagement`, pass `createTransaction.isPending` as `isLoading` to `StockOutRequestForm`.
**Files:** `components/StockOutRequestForm.tsx`, `components/StockOutManagement.tsx`
**Verify:** "Kirim Permintaan" on request form stays disabled until the transaction is saved.

### T5: ServiceManagement inline service form
**What:** Add `disabled={createService.isPending || updateService.isPending}` to the service form submit button. Update button label to show "Menyimpan..." when pending.
**Files:** `components/ServiceManagement.tsx`
**Verify:** "Tambah Data Jasa" / "Simpan Perubahan" disables while mutation is in-flight.

### T6: KonfigurasiOpnamePage
**What:** Add `isSaving` state (useState false). Wrap `handleSave` in setIsSaving(true)/finally. Add `disabled={isSaving}` to the save button and show loading text.
**Files:** `components/StockOpname/KonfigurasiOpnamePage.tsx`
**Verify:** "Simpan Jadwal" / "Simpan Perubahan" is disabled during the API call.

### T7: PelaksanaanOpnamePage — Lanjutkan buttons
**What:** Add `disabled={isSaving}` to the two "Lanjutkan" buttons (desktop and mobile) so they cannot be double-clicked while `handleNextStep` is running.
**Files:** `components/StockOpname/PelaksanaanOpnamePage.tsx`
**Verify:** "Lanjutkan" is disabled during step transitions.
