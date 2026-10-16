# Spec Pelaksanaan — Proses 3 Tahap Opname

> Sub-spec dari [spec.md](./spec.md)

---

## 1. Struktur Halaman

`PelaksanaanOpnamePage` diakses via `/audit/stok-opname/pelaksanaan/:opnameId`.

Layout desktop: **2 kolom** (75% konten + 25% sidebar aksi sticky).  
Layout mobile: **konten full-width** + **fixed bottom action bar**.

> **Lock behavior:** Aplikasi dikunci (lock aktif) **hanya saat step 2**. Ketika advance ke step 3, lock otomatis dicabut. Tidak ada navigasi mundur dari step 3 ke step 2.

---

## 2. State Komponen

| State                 | Tipe                     | Deskripsi                                                   |
| --------------------- | ------------------------ | ----------------------------------------------------------- |
| `currentStep`         | `1 \| 2 \| 3`            | Tahap aktif, diinisialisasi dari `opnameData.currentStep`   |
| `items`               | `OpnameItem[]`           | Detail rows dari DB (kosong saat step 1 belum dikonfirmasi) |
| `allProducts`         | `Product[]`              | Semua produk aktif (untuk tampilan step 1)                  |
| `selectedIds`         | `Set<string>`            | Product IDs yang dipilih di step 1                          |
| `physicalCounts`      | `Record<string, number>` | `{detailId: count}` — input step 2                          |
| `finalStocks`         | `Record<string, number>` | `{detailId: final}` — input step 3                          |
| `reasons`             | `Record<string, string>` | `{detailId: alasan}` — input step 3                         |
| `scheduleObatIds`     | `string[]`               | Obat dari jadwal (dipakai saat backward step 2→1)           |
| `isSaving`            | `boolean`                | Loading state untuk operasi API                             |
| `showBackwardWarning` | `boolean`                | Modal konfirmasi backward navigation                        |
| `confirmModal`        | object                   | Config modal konfirmasi generik                             |

---

## 3. Inisialisasi Data (`loadOpname`)

```
loadOpname() dipanggil saat mount dan saat opnameId berubah
  ├── getOpnameById(opnameId)
  ├── getProducts({ page: 1, perPage: 1000 })
  └── Pre-select:
       ├── Jika items.length > 0 (sudah step 2+):
       │    → setSelectedIds dari items yang ada
       │    → Pre-fill physicalCounts / finalStocks / reasons
       ├── Jika selectedObatIds sudah tersimpan di opname:
       │    → Filter products, setSelectedIds
       ├── Jika scheduleObatIds ada:
       │    → Filter products berdasar jadwal, setSelectedIds
       └── Fallback:
            → Pilih semua produk
```

---

## 4. Step 1: Pemilihan Obat

**Tujuan:** User mengkonfirmasi daftar produk yang akan di-opname.

**Tampilan:**

- Tabel produk dengan checkbox per baris
- Toggle "Pilih Semua / Batalkan Semua"
- Hitungan: `{selectedIds.size} dari {allProducts.length} dipilih`

**Aksi "Lanjutkan":**

1. Disabled jika `selectedIds.size === 0`
2. Memanggil `opnameApi.completeStepOne(opnameId, [...selectedIds])`
3. Efek di backend:
   - Update opname: `status → sedang_dilaksanakan`, `current_step → 2`, `selected_obat_ids → selectedProductIds`
   - Insert `opname_detail` untuk setiap produk dengan `stok_sistem = current qty`
   - **LOCK AKTIF** mulai sini (step >= 2)
   - Notifikasi: `OPNAME_STEP_CHANGED` ke admin, apoteker, farmasi
4. Reload data opname, advance ke step 2

---

## 5. Step 2: Input Stok Fisik

**Tujuan:** User menginput jumlah stok fisik hasil hitungan di gudang.

**Mode: Blind Count** — Stok sistem disembunyikan untuk menjaga objektivitas.

**Tampilan:**

- Banner biru: "Blind Count: Stok sistem disembunyikan untuk menjaga objektivitas."
- Tabel/card per produk dengan input number `stok fisik`
- Desktop: tabel dengan kolom Nama Produk + Input Stok Fisik
- Mobile: card dengan nama + input di samping

**Simpan Draft:**

- Memanggil `opnameApi.saveDraft(opnameId, currentStep, detailUpdates)`
- Hanya update data, tidak advance step

**Aksi "Lanjutkan" (Step 2 → Step 3):**

1. `saveDraft(opnameId, 3, detailUpdates)` — simpan physical counts sekaligus advance step ke 3
2. Notifikasi: `OPNAME_STEP_CHANGED` (step 3) ke admin, apoteker, farmasi
3. Pre-fill `finalStocks` dengan nilai `physicalCounts` sebagai default
4. Advance ke step 3

---

## 6. Step 3: Penyesuaian Stok

**Tujuan:** Review selisih, tentukan stok final, isi alasan untuk item yang selisih.

**Tampilan per produk:**

| Kolom            | Keterangan                                                         |
| ---------------- | ------------------------------------------------------------------ |
| Nama Produk      |                                                                    |
| Stok Sistem      | Dari snapshot `stok_sistem` (dimunculkan kembali)                  |
| Stok Fisik       | Hasil input step 2                                                 |
| Selisih          | `stok_fisik - stok_sistem`; merah jika negatif, hijau jika positif |
| Stok Final       | Input editable, default = nilai stok fisik                         |
| Alasan Perbedaan | Textarea, **WAJIB** jika selisih ≠ 0; ditandai badge merah "Wajib" |

**Validasi sebelum "Selesaikan Opname":**

- Iterasi semua `selectedItems`
- Jika `physicalCount - systemStock ≠ 0` dan `reasons[item.id]` kosong → reject dengan `showToast` warning

**Aksi "Selesaikan Opname":**

1. Tampilkan modal konfirmasi (type: warning)
2. Jika dikonfirmasi → `doFinishOpname()`:
   - `saveDraft(opnameId, 3, detailUpdates)` — simpan semua data final
   - `finishOpname(opnameId)` — backend update stok master, set status 'selesai'
   - Notifikasi: `OPNAME_COMPLETED` ke admin, apoteker, farmasi
   - Navigate ke `/audit/stok-opname/riwayat`

---

## 7. Backward Navigation

Tombol **Kembali** **hanya** tersedia saat `currentStep = 2` (step 2 → step 1).  
Pada step 3, tombol Kembali **tidak ditampilkan**.

### Step 2 → Step 1

1. Tampilkan modal peringatan: "⚠️ Kembali ke tahap 1 akan menghapus semua progress input stok fisik..."
2. Jika dikonfirmasi → `confirmBackward()`:
   - `opnameApi.backwardToStepOne(opnameId, scheduleObatIds)` → hapus semua detail rows, reset opname ke step 1 / `belum_dilaksanakan`
   - Reload produk, restore pre-selection dari `scheduleObatIds`
   - `setCurrentStep(1)`
   - Notifikasi: backward 2→1

### Step 3 → Step 2

❌ **Tidak diperbolehkan.**  
Alasan: advance ke step 3 sudah mencabut lock. Kembali ke step 2 akan mengaktifkan lock lagi dan mengganggu pengguna lain yang sudah bisa menggunakan aplikasi.

---

## 8. Action Bar

### Desktop (sidebar sticky)

- Info card: "Tahap X/3 — deskripsi"
- Tombol Lanjutkan / Selesaikan Opname (primary)
- Tombol Simpan Draft (ghost dengan border)
- Divider
- Tombol **Kembali** (hanya tampil jika `currentStep = 2`; **tidak ada di step 3**)
- Tombol Keluar (merah, navigate ke riwayat)

### Mobile (fixed bottom bar)

- Row 1: Lanjutkan / Selesaikan Opname (full width)
- Row 2: [Kembali jika `currentStep = 2`] [Keluar] [Draft]

---

## 9. Stepper Visual

3 langkah dengan garis penghubung:

- **Aktif**: background primary, teks putih
- **Sudah selesai**: background emerald, ikon `check_circle`
- **Belum aktif**: background muted, teks secondary

Step labels: `Pemilihan Obat` · `Input Stok Fisik` · `Penyesuaian Stok`

**Keterangan lock per step:**

| Step   | Kondisi Lock                                             |
| ------ | -------------------------------------------------------- |
| Step 1 | Lock **tidak aktif** (status masih `belum_dilaksanakan`) |
| Step 2 | Lock **aktif** — aplikasi terkunci untuk role nakes      |
| Step 3 | Lock **tidak aktif** — aplikasi kembali normal           |
