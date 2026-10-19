# Rencana Penerapan Redesain UI Opnamix

Acuan visual: [`docs/mockup/opnamix-layout.html`](mockup/opnamix-layout.html) (buka langsung di browser).
Audit sebelumnya: [`docs/audit-ui-2026-10-18.md`](audit-ui-2026-10-18.md).

## 1. Prinsip

1. **Halaman hanya menyusun komponen.** Halaman tidak boleh menulis gaya kartu, baris, panel, chip, tabel, atau grafik sendiri. Kalau sebuah halaman butuh pola yang belum ada, pola itu dibuat sebagai komponen bersama lebih dulu, lalu dipakai.
2. **Dua lapis komponen:**
   - **Primitif** di `src/components/` (tidak tahu soal produk, transaksi, dll.): `ListRow`, `SidePanel`, `ItemCard`, `BarChart`, `Pagination`, dst.
   - **Komponen domain** di `src/features/<fitur>/components/` hanya boleh *menyusun* primitif, dan hanya dibuat kalau dipakai di lebih dari satu tempat. Contohnya `ProductTitle` (merek, nama atau kandungan, sediaan) dipakai di card produk, tile POS, keranjang, daftar hitung opname, dan laporan.
3. **Warna dan ukuran hanya lewat token.** Tidak ada warna hex, `bg-blue-100`, `rounded-[20px]`, atau `h-[42px]` di halaman. Semua ukuran memakai `rem`, supaya mode ukuran Besar bekerja dari satu tempat.
4. **Logika data tidak diubah**, kecuali yang tercantum di §6. Redesain dikerjakan per fase, satu PR per fase, dan aplikasi tetap bisa dipakai di setiap akhir fase.
5. **Setiap komponen baru didokumentasikan** di halaman Komponen UI (`src/features/ui-docs`) pada PR yang sama.

## 2. Fondasi (token, kepadatan, tema)

| Hal | Isi | File |
|---|---|---|
| Palet terang | Tetap biru `#2563EB`. Tambah `surface-2`, `faint`, `border-strong`, status `ok`/`warn`/`bad` + versi *soft*, warna kategori (`obat`, `bhp`, `imun`, `alkes`) | `src/index.css`, `tailwind.config.js` |
| Palet gelap baru | Arang netral: latar `#0C0F14`, surface `#141820`, surface-2 `#1A1F29`, border `#252B36`, teks `#E6E9EF`/`#9EA6B5`. Biru hanya di sidebar, header, dan aksen | `src/index.css` |
| Gradien | `--grad-hero`, `--grad-side` (terang dan gelap), token kaca `--glass*`, `--on-grad*` | `src/index.css` |
| Grafik | `--ser1`/`--ser2` (biru tema), `--viz-minus`/`--viz-plus`, `--r1..--r6` (alasan opname). Semua sudah lolos validator CVD terang dan gelap | `src/index.css` |
| Kepadatan | Teks isi 14px (`text-sm`), meta 12–13px. Tombol `sm` 28 / `default` 32 / `lg` 38. Input 32. Radius kartu 14px, kontrol 8–9px | `button.tsx`, `input.tsx`, `select.tsx`, `textarea.tsx`, `badge.tsx`, `card.tsx` |
| Mode ukuran | Standar / Besar. Besar menaikkan `font-size` di `html` ×1,15, jadi seluruh ukuran berbasis `rem` ikut naik | `DisplayPreferences` (lihat §3.7) |
| Tema | Terang / Sistem / Gelap. `ThemeProvider` diperluas dengan opsi "Sistem" | `src/app/providers/ThemeProvider.tsx` |

## 3. Daftar komponen bersama

Kolom "Menggantikan" menunjukkan kode lama yang dihapus setelah semua halaman pindah.

### 3.1 Kerangka aplikasi — `src/components/layout/`

| Komponen | Isi | Dipakai di | Menggantikan |
|---|---|---|---|
| `AppShell` | Sidebar + area konten + scrim mobile | `AuthenticatedApp` | struktur di `AuthenticatedApp` |
| `Sidebar` | Rail 64px, terbuka saat pointer di atasnya, pin, laci di HP, grup menu, badge, pilihan tema dan ukuran, kartu pengguna. Menu tetap dibangun dari `APP_ROUTES` | semua halaman | `Sidebar.tsx` lama |
| `PageHeader` | Pita gradien. Props: `title`, `back`, `stats[]`, `actions[]`, `children` (baris tambahan: tab laporan, kotak pintasan dashboard, opname berjalan). Sudah termasuk perilaku menempel, ringkas, intip, dan pin | semua halaman | `Header.tsx`, `PageHeader.tsx`, `StatCard` |
| `HeaderTools` | `GlobalSearch`, `ThemeToggle`, `HeaderPinButton`, `NotificationBell` | di dalam `PageHeader` | bagian kanan `Header.tsx` |
| `StatChip` | Chip kaca statis atau tombol filter (`pressed`) | header semua halaman | `StatCard` |
| `GlassTile` | Baris kaca di header (ikon, teks, progres, aksi) | Dashboard (pintasan), Stok Opname (opname berjalan) | `runBar`, kotak pintasan |
| `ListWithPanel` | Grid daftar + `SidePanel`; panel menempel di bawah header dan berubah jadi laci di bawah 1180px | Produk, Jasa, Stok Keluar, Stok Masuk, Notifikasi, Pengguna, Stok Opname, Laporan transaksi | layout manual per halaman |
| `PosLayout` | Katalog kiri + keranjang kanan; di bawah 1024px keranjang jadi *sheet* dengan `CartBar` | POS Stok Keluar, POS Stok Masuk, layar kerja opname | form + dialog pemilih produk |

### 3.2 Panel kanan — `src/components/panel/`

| Komponen | Isi | Dipakai di |
|---|---|---|
| `SidePanel` | `icon`, `eyebrow`, `title`, `badge`, `onClose`, `footer`; isi bisa digulir | semua `ListWithPanel` |
| `MiniStats` | 2–3 angka kecil berdampingan | detail produk, detail opname |
| `DefinitionList` | Pasangan label–nilai rata kanan | detail transaksi, opname, jadwal |
| `LineItems` | Baris item (nama, sub, jumlah) | detail stok keluar/masuk, selisih opname |
| `Totals` | Subtotal + total besar | detail transaksi, keranjang POS, ringkasan opname |
| `Timeline` | Titik + garis + waktu | riwayat permintaan, aktivitas "Hari ini" |
| `InfoBox` | Kotak info/peringatan dengan ikon | kunci opname, peringatan bentrok jadwal |
| `SettingRow` | Judul, keterangan, kontrol di kanan | pengaturan notifikasi, profil |

### 3.3 Tampilan data — `src/components/data/`

| Komponen | Isi | Dipakai di | Menggantikan |
|---|---|---|---|
| `Toolbar` | Wadah baris pencarian dan filter | semua daftar | toolbar manual |
| `SearchInput` | Ikon, placeholder, petunjuk `/` | semua daftar, POS | input cari manual |
| `SegmentedControl` | Pilihan bersegmen dengan hitungan; varian `glass` untuk header | filter, tab laporan, mode POS | `Tabs` gaya manual, tombol filter manual |
| `FilterChips` | Chip filter aktif yang bisa dihapus | Produk, Stok Masuk, POS Masuk | — |
| `ResponsiveGrid` + `useGridPageSize` | Grid yang menghitung kolom dari lebar; ukuran halaman = kolom × baris | Produk, Jasa, Pengguna, katalog POS | grid manual |
| `Pagination` | "Menampilkan a–b dari n", nomor halaman dengan elipsis, catatan ukuran halaman | **semua** daftar dan tabel | `PaginationControls` |
| `ItemCard` | Slot: `top` (kiri/kanan), `title`, `subtitle`, `meter`, `footer`; status terpilih | Produk, Jasa, Pengguna, tile POS, jadwal opname | kartu manual |
| `ListRow` + `GroupedList` | Baris (avatar/ikon, judul+sub, kolom tengah, nilai, status) + judul grup per hari/bulan | Stok Keluar, Stok Masuk, Notifikasi, Stok Opname, Perlu tindakan | tabel/kartu transaksi manual |
| `DataTable` (dirombak) | Baris 36px, header menempel, sort per kolom, angka rata kanan, baris bisa diklik, baris terpilih | Laporan Stok (3 tab), laporan opname | `data-table.tsx` lama + 13 `<table>` manual |
| `KpiStrip` | Deretan angka ringkas (label, nilai, keterangan, swatch) | Laporan, ringkasan selisih, Dashboard | `StatCard` di dalam halaman |
| `StatusChip` | `ok`/`warn`/`bad`/`info`/`neutral`, selalu dengan teks | semua status | `Badge` + badge manual |
| `Meter`, `Avatar`, `CategoryIcon`, `BrandTag` | Bar stok, inisial berwarna, ikon kategori kecil, label merek | card produk, tile POS, pengguna, laporan | elemen manual |
| `EmptyState`, `QueryState` | Sudah ada, disesuaikan ukurannya | semua | — |

### 3.4 Grafik — `src/components/charts/`

Dibuat sebagai komponen SVG ringan sendiri (tanpa library baru), mengikuti mockup. Semua warna lewat token, semua mark punya tooltip dan keterangan.

| Komponen | Isi | Dipakai di |
|---|---|---|
| `BarChart` | Mode `grouped`, `stacked`, `diverging`; label sumbu hanya di nilai yang tercapai; tooltip; klik batang → `onBucketClick` | Dashboard (pergerakan stok), ringkasan selisih opname, Laporan mutasi & transaksi |
| `HBarList` | Batang mendatar berlabel | Laporan posisi, produk selisih terbesar |
| `CompositionBar` | Batang bertumpuk 100% + legenda | alasan selisih, status stok |
| `ChartLegend`, `ChartTooltip` | — | semua grafik |
| `ChartSection` | Panel grafik yang bisa diciutkan, status disimpan per pengguna | Laporan Stok, ringkasan selisih |
| `timeBuckets()` | Bagi rentang ke jam/hari/minggu/bulan | semua grafik waktu |

### 3.5 Form dan input — `src/components/form/`

| Komponen | Isi | Dipakai di |
|---|---|---|
| `Field` | Label, petunjuk, pesan galat (membungkus `form.tsx` yang sudah ada) | semua form |
| `CurrencyInput` | Awalan "Rp", format ribuan | harga produk, jasa, harga beli |
| `QuantityStepper` | − / angka / + | keranjang POS, penerimaan |
| `CountInput` | Angka besar + satuan, Enter lompat ke berikutnya | hitung opname |
| `TagInput` | Tag + saran + deteksi salah ketik + isian sekunder per tag | kandungan obat |
| `Switch`, `CheckboxCard` | — | pengaturan, role pengguna |
| `ChoiceChips` | Pilihan tunggal atau ganda berbentuk chip | alasan selisih, kategori cakupan |
| `DateRangeControl` | Preset (Hari ini/7/30/bulan ini) + "Atur…" | Laporan, ringkasan selisih |
| `PasswordInput` | Tampilkan/sembunyikan + buat acak | Pengguna, Profil |
| `FileDrop` | Unggah satu berkas | nota Stok Masuk, foto profil |

### 3.6 Overlay

| Komponen | Isi | Catatan |
|---|---|---|
| `NotificationPopover` | Panel dari lonceng: filter, tandai dibaca, buka tujuan | butuh `@radix-ui/react-popover` (dependensi baru) |
| `ConfirmDialog` | Konfirmasi kecil (hapus, batalkan) | `ConfirmationModal` yang ada dirapikan |
| `InlineConfirm` | Konfirmasi di dalam panel ("Ya, selesaikan") | selesaikan opname, proses permintaan |
| `Toast` | Sudah ada | — |

### 3.7 Hook dan utilitas

| Nama | Fungsi |
|---|---|
| `useStickyHeader` | Menempel, ringkas saat gulir turun, intip saat pointer di atas header (melayang, tidak mendorong isi), pin, tidak meringkas halaman pendek |
| `useGridPageSize` | Kolom × baris dari lebar wadah |
| `usePersistentState` | State yang disimpan di `localStorage` (pin sidebar/header, grafik diciutkan, tema, ukuran) |
| `useListSelection` | Item terpilih + buka panel/laci di layar sempit |
| `useDateRange` | Preset rentang + rentang kustom |
| `DisplayPreferencesProvider` | Tema dan ukuran tampilan |
| `lib/format.ts` | `rpSigned`, `rpShort`, `signed`, `agoShort`, `dayLabel` |

## 4. Rute

| Rute | Halaman | Perubahan |
|---|---|---|
| `/` | Dashboard | dirombak |
| `/master-data/produk`, `/master-data/jasa` | Data Produk, Data Jasa | grid + panel form |
| `/transaksi/stok-keluar` | daftar | daftar baris + panel detail |
| `/transaksi/stok-keluar/baru` | POS Stok Keluar | **baru** (menggantikan form permintaan dan form manual) |
| `/transaksi/stok-masuk`, `/transaksi/stok-masuk/baru` | daftar, POS Stok Masuk | **baru** untuk `/baru` |
| `/audit/stok-opname` | Stok Opname | gabungan Riwayat + Konfigurasi |
| `/audit/stok-opname/:id/hitung` | layar kerja opname | menggantikan `/pelaksanaan/:id` |
| `/audit/stok-opname/:id/laporan` | laporan opname | menggantikan `/detail/:id` |
| `/audit/stok-opname/riwayat`, `/konfigurasi`, `/pelaksanaan/:id`, `/detail/:id` | — | dialihkan ke rute baru |
| `/laporan/stok` | Laporan Stok | tab dan periode di header, grafik |
| `/notifikasi`, `/pengaturan/user-management`, `/pengaturan/profil` | — | dirombak |

Menu sidebar: "Riwayat Opname" dan "Konfigurasi Opname" digabung jadi satu menu **Stok Opname**.

## 5. Tahapan

Satu fase = satu PR. Fase 0–2 berurutan. Setelah Fase 2 selesai, Fase 3–7 bisa dikerjakan paralel di sesi terpisah karena filenya tidak bertumpuk, **kecuali** komponen domain produk (`ProductTitle`, `BrandTag`) yang dibuat di Fase 3 dan dipakai Fase 4 dan 6.

| Fase | Isi | Selesai bila |
|---|---|---|
| **0. Fondasi** | Token warna terang dan gelap baru, token grafik, kepadatan komponen `ui/*`, `DisplayPreferencesProvider` (tema 3 pilihan + ukuran) | Semua halaman lama tetap jalan dengan ukuran baru; kontras lolos; mode Besar menaikkan semua ukuran |
| **1. Kerangka** | `AppShell`, `Sidebar` baru, `PageHeader` + `useStickyHeader`, `HeaderTools`, `NotificationPopover`. Semua halaman memakai `PageHeader` baru dengan `title` + `actions` saja dulu | Header dan sidebar sama di semua halaman; `Header.tsx` lama dihapus |
| **2. Primitif data dan panel** | §3.2, §3.3, §3.5 (kecuali `TagInput`, `CountInput`), `Pagination` baru; Komponen UI diperbarui | Semua primitif tampil di halaman Komponen UI dalam mode terang, gelap, Besar, dan HP |
| **3. Master data** | Data Produk, Data Jasa (grid + panel form), komponen domain produk, `TagInput`. **3a:** migrasi sediaan, isi kemasan, kandungan (§6) | Tambah/edit lewat panel; dialog form lama dihapus |
| **4. Transaksi** | Stok Keluar dan Stok Masuk (daftar + panel), `PosLayout`, POS keluar (Permintaan/Manual) dan POS masuk | Alur lama (form + `ProductLookupModal` + `ServicePicker`) dihapus |
| **5. Notifikasi, Pengguna, Profil** | Halaman Notifikasi, Kelola Pengguna (grid + panel), Profil (dua kolom + tampilan) | Dialog pengguna dan reset password dihapus |
| **6. Stok Opname** | Halaman gabungan + mode panel (detail, terjadwal, jadwal, mulai), layar kerja Hitung/Tinjau dengan `CountInput`, laporan opname, ringkasan selisih. **6a:** perubahan data opname (§6) | Rute lama dialihkan; halaman kunci aplikasi (`OpnameLockPage`) dihapus |
| **7. Dashboard dan Laporan** | §3.4, Dashboard baru, Laporan Stok 3 tab + grafik | `DashboardCharts` dan `StockAnalytics` lama dihapus |
| **8. Bersih-bersih** | Hapus komponen yang tidak terpakai (`StatCard`, `PaginationControls`, dll.), perbarui `DEVELOPMENT.md`, cek ulang aksesibilitas dan HP | Tidak ada impor ke komponen lama; audit kontras lolos |

## 6. Perubahan data (di luar tampilan)

Dikerjakan sebagai sub-fase sendiri sebelum tampilan yang membutuhkannya.

| Perubahan | Fase | Catatan |
|---|---|---|
| Produk: kolom `sediaan`, `isi_kemasan`; kandungan banyak zat dengan kekuatan opsional; merek untuk semua kategori | 3a | Perlu keputusan: tabel `product_ingredients` (rapi untuk saran dan pencarian per zat) atau kolom `jsonb`. Rekomendasi: tabel terpisah |
| Opname: kunci per produk, bukan seluruh aplikasi | 6a | Trigger database menolak transaksi untuk produk yang ada di detail opname berstatus `sedang_dilaksanakan`. `OpnameLockPage` dan cek kunci global di `AuthenticatedApp` dihapus |
| Opname cepat tanpa jadwal | 6a | `schedule_id` boleh kosong; cakupan disimpan di detail |
| Alasan selisih siap pakai + catatan | 6a | Kolom alasan berisi kode pilihan, catatan di kolom terpisah |
| Simpan otomatis hitungan | 6a | Simpan per isian (*debounce*), bukan tombol Simpan Draft |
| Opname selesai tidak bisa dihapus | 6a | Tombol dihapus dan dikunci juga lewat RLS |
| **Bug: produk belum dihitung tercatat stok 0** | sebelum 6 | Sudah ada kartu sesi terpisah; sebaiknya dikerjakan sekarang |
| Preferensi tampilan (tema, ukuran, pin) | 0–1 | Cukup `localStorage` dulu; pindah ke profil bila perlu lintas perangkat |

## 7. Daftar periksa setiap PR

- [ ] Tidak ada warna atau ukuran literal di halaman; hanya token dan kelas komponen
- [ ] Tidak ada elemen bergaya buatan halaman yang meniru primitif (kartu, baris, chip, panel, tabel)
- [ ] Komponen baru ada di halaman Komponen UI beserta contoh pemakaian
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test` lulus
- [ ] Dicek di mode terang, gelap, ukuran Besar, dan lebar HP (375px) tanpa geser samping
- [ ] Kode lama yang sudah tergantikan ikut dihapus di PR yang sama

## 8. Keputusan yang masih terbuka

1. **Penyimpanan kandungan obat:** tabel terpisah (rekomendasi) atau `jsonb`.
2. **Grafik:** komponen SVG sendiri (rekomendasi, ringan dan sudah terbukti di mockup) atau library seperti Recharts.
3. **Popover notifikasi:** menambah `@radix-ui/react-popover` (rekomendasi, konsisten dengan komponen Radix lain).
4. **Dashboard per role:** tampilan untuk Nakes (hanya permintaannya sendiri dan sisa stok) belum dirancang.
5. **Persetujuan selisih opname** dan **opname per batch**: ditunda sesuai keputusan sebelumnya.
