# Spec API — Kontrak API Modul Opname

> Sub-spec dari [spec.md](./spec.md)  
> Semua method berada di objek `api` yang diekspor dari `lib/api.ts`.  
> Backend: Supabase (PostgreSQL via `supabase-js`).

---

## 1. Jadwal Opname

### `createOpnameSchedule(config: OpnameScheduleConfig)`

Insert baris baru ke `opname_schedule`.

**Input:** `OpnameScheduleConfig`  
**Output:** `{ success: true }`

---

### `getOpnameSchedules()`

Ambil semua jadwal yang belum dihapus (`deleted_at IS NULL`), diurutkan terbaru dulu.

**Output:** `OpnameSchedule[]`

---

### `updateOpnameSchedule(id: string, config: OpnameScheduleConfig)`

Update jadwal yang ada.

**Output:** `{ success: true }`

---

### `deleteOpnameSchedule(id: string)`

Soft-delete: set `deleted_at = now()`, `is_active = false`.

**Output:** void

---

### `toggleOpnameScheduleStatus(id: string, isActive: boolean)`

Toggle `is_active` pada jadwal.

**Output:** void

---

### `getActiveSchedules()`

Ambil jadwal dengan `is_active = true` dan kalkulasi `nextDate` berikutnya.

**Logika nextDate:**

```
nextDate = tanggal_audit bulan ini
if nextDate <= today:
  BULANAN  → +1 bulan
  TRIWULAN → +3 bulan
  TAHUNAN  → +1 tahun
```

**Output:** `ScheduleInfo[]`

```ts
interface ScheduleInfo {
  nextDate: string; // ISO date
  pengulangan: string;
  nama: string;
  scheduleId: string;
}
```

---

## 2. Eksekusi Opname

### `startOpname(scheduleId: string | null, date: string)`

Buat header opname baru (tanpa detail rows).

**Efek:**

- Insert `opname` dengan `status = 'belum_dilaksanakan'`, `current_step = 1`
- Simpan `selected_obat_ids` dari `schedule.obat_ids` (preview awal)
- Kirim notifikasi `OPNAME_CREATED` ke role admin & farmasi

**Output:** `{ id: string, success: true }`

---

### `getUpcomingOpnames()`

Ambil opname dengan `status = 'belum_dilaksanakan'`, urut tanggal jadwal ascending.

**Output:** `OpnameCard[]`

---

### `getDraftOpnames()`

Ambil opname dengan `status = 'sedang_dilaksanakan'`, urut `created_at` descending.

**Output:** `OpnameCard[]`

---

### `getOpnameHistory()`

Ambil opname dengan `status = 'selesai'`, plus hitung `discrepancyCount`.

**Output:** `OpnameCard[]` (dengan `itemsCount`, `discrepancyCount`)

---

### `getOpnameById(opnameId: string)`

Ambil detail satu opname beserta semua `opname_detail` dan info produk dari `master_obat`.

**Output:**

```ts
{
  id: string;
  opnameNumber: string;     // "OPN-{id}"
  scheduleDate: string;
  status: string;
  currentStep: number;
  selectedObatIds: string[] | null;
  completedAt: string | null;
  scheduleObatIds: string[];
  scheduleName: string;
  items: OpnameItem[];
}
```

---

### `completeStepOne(opnameId: string, selectedProductIds: string[])`

Konfirmasi pemilihan obat dan buat detail rows. **Trigger lock.**

**Efek:**

1. Update `opname`: `status → sedang_dilaksanakan`, `current_step → 2`, `selected_obat_ids → selectedProductIds`
2. Fetch `master_obat.qty` untuk setiap produk terpilih (snapshot stok sistem)
3. Insert `opname_detail` untuk setiap produk:
   - `stok_sistem = current qty`
   - `stok_fisik = 0`
   - `selisih = 0 - stok_sistem` (awal)
   - `status = 'pending'`
4. Notifikasi `OPNAME_STEP_CHANGED` (step 2) ke admin & farmasi

**Output:** `{ success: true }`

---

### `backwardToStepOne(opnameId: string, scheduleObatIds: string[])`

Reset ke step 1 dengan menghapus semua detail.

**Efek:**

1. Delete semua `opname_detail` where `opname_id = opnameId`
2. Update `opname`: `current_step → 1`, `status → belum_dilaksanakan`, `selected_obat_ids → scheduleObatIds`

**Output:** `{ success: true }`

> **Catatan:** Notifikasi backward dibuat di frontend (`PelaksanaanOpnamePage`) via `api.createNotification()`, tidak di dalam method ini.

---

### `saveDraft(opnameId, step, detailUpdates?)`

Simpan progress dan advance step.

**Signature:**

```ts
saveDraft(
  opnameId: string,
  step: number,
  detailUpdates?: {
    detailId: string;
    physicalStock?: number;
    stokFinal?: number;
    reason?: string;
  }[]
)
```

**Efek:**

1. Update `opname.current_step = step`
2. Untuk setiap `detailUpdate`:
   - Jika `physicalStock` ada: update `stok_fisik`, hitung `selisih = physicalStock - stok_sistem`, set `status` (`sesuai` / `pending`)
   - Jika `stokFinal` ada: update `stok_final`
   - Jika `reason` ada: update `alasan`

**Output:** `{ success: true }`

---

### `finishOpname(opnameId: string)`

Selesaikan opname dan update stok master.

**Efek:**

1. Ambil semua `opname_detail` untuk opname ini
2. Untuk setiap detail:
   - `finalStock = stok_final ?? stok_fisik`
   - Update `opname_detail.status`: `selisih === 0 → 'sesuai'` / lainnya `'disesuaikan'`
   - Update `master_obat.qty = finalStock`
3. Update `opname`: `status → selesai`, `current_step → 3`, `completed_at → now()`

**Output:** void

---

### `deleteOpname(opnameId: string)`

Hard delete opname beserta detailnya.

**Efek:**

1. Delete `opname_detail` where `opname_id = opnameId`
2. Delete `opname` where `id = opnameId`

**Output:** `{ success: true }`

---

## 3. View & Lock

### `getOpnameDetailView(opnameId: string)`

Ambil semua detail untuk tampilan read-only (`DetailOpnamePage`).

**Output:**

```ts
{
  id: string;
  productName: string;
  stokSistem: number;
  stokFisik: number;
  selisih: number;
  stokFinal: number | null;
  alasan: string;
}
[];
```

---

### `getActiveOpnameLock()`

Cek apakah ada opname yang sedang dalam lock state.

**Query:** `opname WHERE status = 'sedang_dilaksanakan' AND current_step = 2 LIMIT 1`

> **Perubahan:** Query sebelumnya menggunakan `current_step >= 2`. Sekarang hanya `current_step = 2` agar lock otomatis dicabut ketika opname advance ke step 3.

**Output:**

```ts
{
  isLocked: boolean;
  opname: OpnameLockInfo | null;
}
```

---

## 4. Notifikasi

### `createNotification(notification)`

Insert notifikasi ke tabel `notifications`. Satu row per target role.

**Signature:**

```ts
createNotification({
  type: string;
  title: string;
  message: string;
  data?: Json;
  target_roles?: string[];  // jika kosong → broadcast (target_role = null)
})
```

**Tipe notif yang digunakan modul opname:**

- `OPNAME_CREATED`
- `OPNAME_STEP_CHANGED`
- `OPNAME_COMPLETED`
