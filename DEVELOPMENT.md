# Panduan Pengembangan

Semua komponen bersama beserta contohnya ada di halaman **Komponen UI**
(`/pengaturan/komponen-ui`, khusus admin). Latar belakang keputusan desain ada di
[`docs/audit-ui-2026-10-18.md`](docs/audit-ui-2026-10-18.md) dan rencana redesain UI.

## Prinsip

1. **Halaman hanya menyusun komponen.** Halaman tidak menulis gaya kartu, baris,
   panel, chip, tabel, atau grafik sendiri. Pola yang belum ada dibuat sebagai
   komponen bersama lebih dulu, didokumentasikan di Komponen UI, lalu dipakai.
2. **Warna dan ukuran hanya lewat token** (`src/index.css`, dipetakan di
   `tailwind.config.js`): `bg-card`, `text-muted-foreground`, `bg-ok-soft`,
   `text-bad`, `bg-chart-ser1`, `bg-cat-obat`, dst. Tidak ada hex, kelas palet
   Tailwind (`bg-red-100`), atau ukuran piksel (`h-[42px]`). Ukuran memakai rem
   supaya mode tampilan **Besar** bekerja dari satu tempat.
3. **Logika tanpa React** (filter, ringkasan, grafik, aturan) ada di file `.ts`
   terpisah dan diuji dengan Vitest, misalnya `features/opname/summary.ts`,
   `features/reports/reportView.ts`.

## Lapisan komponen

| Folder                            | Isi                                                                                                                                                                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/ui`               | Komponen dasar shadcn yang sudah disesuaikan token: `button`, `input`, `select`, `card`, `badge`, `dialog`, `alert-dialog`, `popover`, `table`, `data-table`, `toast`                                                     |
| `src/components/layout`           | Kerangka: `AppShell`, `Sidebar`, `PageHeader` (+ `StatChip`, `GlassTile`), `ListWithPanel`, `PosLayout`, `PosCatalog`                                                                                                     |
| `src/components/panel`            | Isi panel kanan: `SidePanel`, `DefinitionList`, `MiniStats`, `LineItems`, `Totals`, `Timeline`, `InfoBox`, `SettingRow`, `InlineConfirm`                                                                                  |
| `src/components/data`             | Tampilan data: `Toolbar`, `SearchInput`, `SegmentedControl`, `FilterChips`, `ResponsiveGrid`, `ItemCard`, `ListRow`/`GroupedList`, `Pagination`, `KpiStrip`, `StatusChip`, `SignedValue`, `StepBar`, `Avatar`, `Meter`, … |
| `src/components/form`             | `Field`, `OptionSelect`, `CurrencyInput`, `QuantityStepper`, `CountInput`, `TagInput`, `PasswordInput`, `Switch`, `CheckboxCard`, `CheckRow`, `ChoiceChips`, `DateRangeControl`, `FileDrop`, `AvatarUpload`               |
| `src/components/charts`           | Grafik SVG ringan: `BarChart` (grouped/stacked/diverging), `HBarList`, `CompositionBar`, `ChartLegend`, `ChartSection`/`ChartPanel`, `timeBuckets()`                                                                      |
| `src/components/common`           | `QueryState` (loading/error/empty), `ConfirmDialog`, `ErrorBoundary`                                                                                                                                                      |
| `src/features/<fitur>/components` | Komponen domain yang menyusun primitif dan dipakai lebih dari satu tempat, mis. `ProductTitle`, `RoleChips`, `NotificationSettingRows`                                                                                    |

### Pola halaman

- **Daftar + panel**: `PageHeader` (judul, `stats`, `actions`) →
  `ListWithPanel` berisi `Card` dengan `Toolbar` + `ResponsiveGrid`/`GroupedList`
  - `Pagination`, dan `SidePanel` di kanan. Di bawah 1180px panel menjadi laci;
    pakai `useListSelection` untuk item terpilih dan status laci.
- **Layar kerja / POS**: `PosLayout` (katalog kiri, keranjang kanan; di bawah
  1024px keranjang menjadi sheet dengan `CartBar`).
- **Laporan**: `ChartSection` (bisa diciutkan, status disimpan per perangkat) +
  `Card` berisi `Toolbar`, `KpiStrip`, dan `DataTable`.
- **Konfirmasi**: di dalam panel pakai `InlineConfirm`; di tengah layar pakai
  `ConfirmDialog`.
- **Tombol header**: aksi utama `variant="light"`, aksi lain `variant="glass"`.

## Data

- Server state lewat React Query v5; aturan key dan invalidasi ada di
  [`.ai/conventions/data-fetching.md`](.ai/conventions/data-fetching.md).
- Komponen tidak memanggil `supabase` langsung; semua lewat `features/<fitur>/api.ts`.
- Perubahan skema ditulis sebagai migrasi di `supabase/migrations` lalu tipe di
  `src/lib/database.types.ts` diperbarui.
- Opname mengunci **per produk**: produk di opname yang sedang berjalan ditolak
  dari stok masuk/keluar oleh trigger database; POS menandainya lewat
  `useOpnameLockedProducts`.

## Daftar periksa setiap perubahan UI

- [ ] Tidak ada warna atau ukuran literal; hanya token dan kelas komponen
- [ ] Komponen baru ada di halaman Komponen UI beserta contoh
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test` lulus
- [ ] Dicek di mode terang, gelap, ukuran Besar, dan lebar HP (375px) tanpa geser samping
- [ ] Kode lama yang tergantikan ikut dihapus
