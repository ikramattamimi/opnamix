# Spec UI — Spesifikasi Antarmuka Modul Opname

> Sub-spec dari [spec.md](./spec.md)

---

## 1. KonfigurasiOpnamePage {#konfigurasi}

### 1.1 Header
- Ikon `settings` + judul "Konfigurasi Jadwal Opname" + subjudul "Kelola jadwal audit stok berkala."
- Tombol **Tambah Jadwal** (primary, kanan)

### 1.2 Daftar Jadwal

**Desktop (lg+):** Tabel dengan kolom:
- Nama Jadwal
- Tanggal Audit (format: "Tanggal {n}")
- Jumlah Obat — badge "Semua Obat" (primary/10) atau "{n} obat"
- Status — toggle switch (emerald = aktif)
- Pengulangan — badge: "Setiap Bulan", "Setiap 3 Bulan", "Setiap Tahun"
- Aksi — icon buttons edit & hapus

**Mobile:** Card per jadwal dengan:
- Nama + toggle switch di header
- Metadata: tanggal, pengulangan, jumlah obat (badge)
- Tombol Edit + Hapus di footer card

**State kosong:** Pesan "Belum ada jadwal opname. Klik "Tambah Jadwal" untuk membuat jadwal baru."

### 1.3 Modal Tambah/Edit Jadwal (2 Step)

**Step 1 — Info Jadwal:**

| Field | Input | Validasi |
|---|---|---|
| Nama Jadwal | text | Wajib (tombol Lanjutkan disabled jika kosong) |
| Frekuensi | select | BULANAN / TRIWULAN / TAHUNAN |
| Tanggal Audit | number (1–28) | min 1, max 28 |

Tombol **Lanjutkan** (disabled jika nama kosong) → advance ke step 2.

**Step 2 — Pilih Obat:**
- Checkbox "Semua Obat" (toggle selectAll)
- Jika tidak semua: search input + daftar produk dengan checkbox
- Toggle "Pilih Semua / Batalkan Semua" (hanya untuk filtered results)
- Tombol **Simpan Jadwal / Simpan Perubahan** (disabled jika `!selectAll && selectedObatIds.size === 0`)

**Stepper visual di modal:** Step 1 (aktif = primary), Step 2 (aktif = primary, selesai = emerald dengan check)

**Konfirmasi hapus jadwal:** Modal dengan type `danger`, pesan "Yakin ingin menghapus jadwal ini? Tindakan ini tidak dapat dibatalkan."

---

## 2. RiwayatOpnamePage

### 2.1 Layout
- **Desktop:** Sidebar kanan (~30%) + konten kiri (~70%)
- **Mobile:** Tanpa sidebar; schedule strip di atas (collapsible); FAB untuk tambah opname

### 2.2 Mobile Schedule Strip
- Gradient primary → indigo-700
- Collapsible (toggle expand/collapse)
- Menampilkan jumlah jadwal aktif di header
- Expanded: daftar jadwal dengan nama + frekuensi + next date
- Tombol "Ubah Konfigurasi" → navigate ke `/konfigurasi`

### 2.3 Sidebar Desktop (Schedule Info Panel)
- Gradient primary → indigo-700
- Daftar jadwal aktif (nama, frekuensi, next date)
- Tombol "Konfigurasi Jadwal"
- Tombol **Tambah Opname** (putih, teks primary)

### 2.4 Section "Opname Mendatang"
- Ikon schedule amber + judul
- Search input (filter `scheduleName` / `opnameNumber` — case insensitive)
- **Draft (sedang dilaksanakan):** Card dengan border-l-4 biru, badge "Sedang Dilaksanakan", info tahap, tombol **Lanjutkan** (biru) + hapus
- **Upcoming (belum dilaksanakan):** Card dengan border-l-4 amber, badge "Belum Dilaksanakan", tanggal target, tombol **Mulai Opname** (primary) + hapus
- State kosong: "Tidak ada opname mendatang." / "Tidak ada hasil yang cocok."

### 2.5 Section "Riwayat Opname"
- Ikon history emerald + judul
- Search input (filter `scheduleName` / `opnameNumber`)
- Card per item: badge "Selesai" (emerald) + badge selisih (merah jika > 0), nama jadwal, tanggal + jumlah item
- Tombol **Lihat Detail** (ghost primary) + **Hapus** (merah ghost)
- State kosong: "Belum ada riwayat opname."

### 2.6 Modal Buat Opname Manual
- Pilih jadwal (dari `getOpnameSchedules()`)
- Input tanggal pelaksanaan (default: hari ini, bisa diubah bebas)
- Preview produk yang akan di-opname (dari jadwal terpilih, max-height scroll)
- Tombol **Buat Opname** (disabled jika `!selectedScheduleId || !manualDate || scheduleProducts.length === 0`)

### 2.7 Konfirmasi Hapus Opname
Modal type `danger`: "Yakin ingin menghapus opname ini beserta semua detailnya? Tindakan ini tidak dapat dibatalkan."

---

## 3. PelaksanaanOpnamePage

### 3.1 Stepper
- 3 step dengan garis penghubung
- Aktif: bg-primary text-white shadow
- Selesai: bg-emerald text-emerald icon check_circle
- Belum aktif: bg-muted text-secondary
- Label hanya tampil di sm+ (tersembunyi di mobile)

### 3.2 Step 1 — Pemilihan Obat
- Header: "Tahap 1: Pemilihan Obat" + "N dari M dipilih" + link "Pilih Semua / Batalkan Semua"
- Tabel produk: checkbox + nama produk + kategori/satuan
- Onboarding informasi tidak ada (langsung ke tabel)

### 3.3 Step 2 — Input Stok Fisik
- Banner biru "Blind Count" di atas tabel
- Desktop: tabel dengan kolom "Nama Produk" + "Jumlah Stok Fisik" (input number, bg primary/5)
- Mobile: card horizontal: [info produk] [label "Stok Fisik" + input]
- Input number: `min=0`, placeholder "0", value kosong dihapus dari state (bukan set ke 0)

### 3.4 Step 3 — Penyesuaian Stok
- Desktop: tabel 6 kolom (Nama, Sistem, Fisik, Selisih, Stok Final, Alasan)
- Mobile: card per produk dengan grid 3-kolom (Sistem / Fisik / Selisih) + Stok Final input + Alasan textarea
- Selisih: badge hijau jika `+`, merah jika `-`, abu-abu jika `0`
- Item dengan selisih: row bg amber/[0.03]; "Alasan Perbedaan" wajib (badge merah "Wajib" jika belum diisi)
- Item tanpa selisih: teks "✓ Sesuai" (emerald)
- Stok Final: editable, default dari physicalCounts

### 3.5 Modal Konfirmasi
- **Selesaikan Opname:** type warning — "Stok akan diperbarui sesuai hasil opname. Pastikan semua data sudah benar sebelum melanjutkan. Tindakan ini tidak dapat dibatalkan."
- **Backward Step 2→1:** type warning — "⚠️ Kembali ke tahap 1 akan menghapus semua progress input stok fisik. Anda harus memilih ulang obat yang akan di-opname. Lanjutkan?"
- **Backward Step 3→2:** type warning — "⚠️ Kembali ke tahap 2 akan menghapus progress penyesuaian stok (stok final & alasan). Lanjutkan?"

---

## 4. DetailOpnamePage

### 4.1 Header
- Tombol back ← navigate ke `/riwayat`
- Judul "Detail Opname" + sub "OPN-{id}"
- Badge "Selesai" (emerald)

### 4.2 Layout (lg+: 2 kolom 30/70)

**Panel Kiri — Info Opname (sticky):**
- Kode Opname, Referensi Jadwal, Tanggal Jadwal, Tanggal Dilaksanakan
- Statistik: Total Item (primary), Sesuai (emerald), Selisih (amber)

**Panel Kanan — Jurnal Penyesuaian:**
- Search produk (filter nama)
- Desktop: tabel 6 kolom (Nama, Sistem, Fisik, Selisih, Final, Alasan)
- Mobile: card per item — grid 2x2 (Sistem/Fisik/Selisih/Final) + alasan jika ada
- Row selisih ≠ 0: bg amber/[0.03] (desktop) / ring amber/30 (mobile)

---

## 5. OpnameLockPage

### 5.1 Layout
- Centered card di tengah layar (max-w-2xl)
- 4 section: Ikon → Judul & Deskripsi → Info Box → Aksi → Warning Banner

### 5.2 Variasi per Role

**Admin / Farmasi:**
- Ikon: lock (primary)
- Judul: "Opname Sedang Berlangsung"
- Info: Kode Opname, Tahap Saat Ini, Dimulai
- Aksi: Tombol **Lanjutkan Opname** → navigate ke `/pelaksanaan/{id}`
- Warning: "Menu Lain Dikunci" (admin) / "Aplikasi Dikunci" (farmasi)

**Nakes:**
- Ikon: hourglass_empty (amber)
- Judul: "Opname Sedang Berlangsung"
- Sub: "Mohon menunggu. Opname sedang dilakukan oleh tim farmasi."
- Aksi: Tombol **Cek Status Opname** (polling manual)
  - Memanggil `api.getActiveOpnameLock()`
  - Jika tidak lagi locked → tampilkan panel sukses "Opname Telah Selesai!" + tombol "Muat Ulang Aplikasi" (`window.location.reload()`)
- Warning: "Mohon Bersabar — Estimasi: ~15-30 menit."

---

## 6. Toast Messages

| Kondisi | Pesan | Tipe |
|---|---|---|
| Jadwal berhasil dibuat | `Jadwal berhasil dibuat!` | success |
| Jadwal berhasil diperbarui | `Jadwal berhasil diperbarui!` | success |
| Gagal simpan jadwal | `Gagal menyimpan jadwal.` | error |
| Jadwal dihapus | `Jadwal berhasil dihapus.` | success |
| Gagal hapus jadwal | `Gagal menghapus jadwal.` | error |
| Opname dibuat | `Opname berhasil dibuat. Silakan pilih opname dari daftar untuk melanjutkan.` | success |
| Gagal buat opname | `Gagal membuat opname. Silahkan coba lagi.` | error |
| Opname dihapus | `Opname berhasil dihapus.` | success |
| Gagal hapus opname | `Gagal menghapus opname.` | error |
| Gagal muat opname | `Gagal memuat data opname.` | error → navigate ke riwayat |
| Gagal simpan draft | `Gagal menyimpan draft.` | error |
| Alasan belum diisi | `Alasan perbedaan wajib diisi untuk "{nama}" karena selisih stok ≠ 0.` | warning |
| Gagal selesaikan opname | `Gagal menyelesaikan opname.` | error |
| Gagal backward | `Gagal kembali ke tahap sebelumnya.` | error |
