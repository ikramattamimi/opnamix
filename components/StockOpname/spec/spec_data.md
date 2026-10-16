# Spec Data — Skema Database Modul Opname

> Sub-spec dari [spec.md](./spec.md)

---

## 1. Tabel `opname_schedule`

Menyimpan konfigurasi jadwal opname yang bisa dipakai berulang.

| Kolom DB | Tipe | Keterangan |
|---|---|---|
| `id` | integer (PK, auto) | |
| `nama` | text | Nama jadwal |
| `tanggal_audit` | integer (1–28) | Tanggal audit tiap bulan |
| `waktu_jam` | integer | Jam mulai |
| `waktu_menit` | integer | Menit mulai |
| `pengulangan` | text | Enum: `BULANAN`, `TRIWULAN`, `TAHUNAN` |
| `obat_ids` | integer[] \| null | null = semua obat |
| `durasi_pengerjaan` | integer \| null | Estimasi durasi (hari) |
| `is_active` | boolean | Status aktif/nonaktif |
| `deleted_at` | timestamptz \| null | Soft-delete |
| `created_at` | timestamptz | |

**Frontend type mapping (`OpnameSchedule`):**

```ts
interface OpnameSchedule {
  id: string;
  nama: string;
  tanggalAudit: number;     // = tanggal_audit
  waktuJam: number;         // = waktu_jam
  waktuMenit: number;       // = waktu_menit
  pengulangan: PengulanganOpname;
  obatIds: string[] | null; // = obat_ids (string-converted)
  durasiPengerjaan: number | null;
  isActive: boolean;
}

type PengulanganOpname = 'BULANAN' | 'TRIWULAN' | 'TAHUNAN';
```

---

## 2. Tabel `opname`

Header setiap sesi opname yang dibuat.

| Kolom DB | Tipe | Keterangan |
|---|---|---|
| `id` | integer (PK, auto) | |
| `schedule_id` | integer \| null | FK → `opname_schedule.id` |
| `tanggal_jadwal` | date | Tanggal pelaksanaan target |
| `status` | text | Lihat enum di bawah |
| `current_step` | integer | 1, 2, atau 3 |
| `selected_obat_ids` | integer[] \| null | Produk yang dipilih user di step 1 |
| `completed_at` | timestamptz \| null | Diisi saat `finishOpname()` |
| `created_at` | timestamptz | |

**Status enum `opname.status`:**

| Nilai | Kondisi |
|---|---|
| `belum_dilaksanakan` | Step 1 (pemilihan obat belum dikonfirmasi) |
| `sedang_dilaksanakan` | Step 2 atau 3 (detail sudah dibuat); **lock aktif** jika `current_step >= 2` |
| `selesai` | Opname selesai, stok sudah diperbarui |

**Nomor opname** dibuat di frontend: `OPN-{id}` (tidak disimpan di DB).

---

## 3. Tabel `opname_detail`

Satu baris per produk per sesi opname. Dibuat saat `completeStepOne()`, dihapus jika backward ke step 1.

| Kolom DB | Tipe | Keterangan |
|---|---|---|
| `id` | integer (PK, auto) | |
| `opname_id` | integer | FK → `opname.id` |
| `obat_id` | integer | FK → `master_obat.id` |
| `stok_sistem` | integer | Snapshot stok sistem saat step 1 dikonfirmasi |
| `stok_fisik` | integer | Hasil hitungan fisik (step 2) |
| `selisih` | integer | `stok_fisik - stok_sistem` (dihitung DB/backend) |
| `stok_final` | integer \| null | Stok akhir yang disepakati (step 3) |
| `alasan` | text \| null | Alasan selisih (wajib jika `selisih ≠ 0`) |
| `status` | text | Enum: `pending`, `sesuai`, `disesuaikan` |

**Status enum `opname_detail.status`:**

| Nilai | Kondisi |
|---|---|
| `pending` | Default saat baris dibuat |
| `sesuai` | `selisih = 0` (diset otomatis saat `saveDraft`) |
| `disesuaikan` | Ada selisih, sudah diberi alasan; diset saat `finishOpname` |

---

## 4. Relasi Antar Tabel

```
opname_schedule (1) ──< opname (N) ──< opname_detail (N) >── master_obat (1)
```

- `opname.schedule_id` nullable (opname bisa dibuat tanpa jadwal, tapi UI saat ini selalu mewajibkan pilih jadwal)
- Hapus opname: hapus `opname_detail` dulu (FK constraint), lalu hapus `opname` (hard delete)
- Hapus jadwal: soft delete (`deleted_at`), tidak menghapus opname yang sudah dibuat

---

## 5. Frontend Type: `OpnameItem`

Dipakai di `PelaksanaanOpnamePage` untuk mewakili satu baris detail selama proses berlangsung.

```ts
interface OpnameItem {
  id: string;            // opname_detail.id
  productId: string;     // obat_id (string)
  productName: string;   // dari master_obat
  category: string;      // jenis
  unit: string;          // satuan
  systemStock: number;   // stok_sistem
  physicalStock?: number;// stok_fisik
  difference?: number;   // selisih
  stokFinal?: number;    // stok_final
  reason?: string;       // alasan
  detailStatus?: string; // status
}
```

---

## 6. Type `OpnameLockInfo`

Dipakai oleh `useOpnameLock` dan `OpnameLockPage`.

```ts
interface OpnameLockInfo {
  id: string;
  opnameNumber: string;  // "OPN-{id}"
  currentStep: number;
  startedAt: string;     // ISO timestamp (created_at opname)
}

interface OpnameLockState {
  isLocked: boolean;
  opname: OpnameLockInfo | null;
  isLoading: boolean;
}
```

**Lock condition:** `status = 'sedang_dilaksanakan'` AND `current_step = 2` *(hanya step 2; step 3 tidak menyebabkan lock)*

---

## 7. `OpnameScheduleConfig` (input form)

```ts
interface OpnameScheduleConfig {
  nama: string;
  pengulangan: PengulanganOpname;
  dayOfMonth: number;        // 1–28
  waktuJam: number;
  waktuMenit: number;
  durasiPengerjaan: number;
  obatIds: string[] | null;  // null = semua obat
}
```
