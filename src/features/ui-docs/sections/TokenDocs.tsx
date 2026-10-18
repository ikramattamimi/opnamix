import React from 'react';
import { DocExample, DocSection } from '../components/DocSection';

// Contoh token warna, tipografi, radius, dan preferensi tampilan. Kelas ditulis
// utuh (bukan dirangkai) supaya terbaca oleh Tailwind.

interface Swatch {
  className: string;
  name: string;
  note?: string;
}

const SwatchGrid: React.FC<{ swatches: Swatch[] }> = ({ swatches }) => (
  <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
    {swatches.map(({ className, name, note }) => (
      <div key={name} className="flex items-center gap-2.5 rounded-lg border p-2">
        <span className={`size-8 shrink-0 rounded-md border ${className}`} aria-hidden />
        <span className="min-w-0">
          <span className="block truncate font-mono text-xs text-foreground">{name}</span>
          {note && <span className="block truncate text-xs text-muted-foreground">{note}</span>}
        </span>
      </div>
    ))}
  </div>
);

const SURFACES: Swatch[] = [
  { className: 'bg-background', name: 'background', note: 'Latar halaman' },
  { className: 'bg-card', name: 'card / surface', note: 'Kartu, panel' },
  { className: 'bg-surface-2', name: 'surface-2 / muted', note: 'Baris, isian' },
  { className: 'bg-border', name: 'border', note: 'Garis tipis' },
  { className: 'bg-border-strong', name: 'border-strong / input', note: 'Garis kontrol' },
  { className: 'bg-foreground', name: 'foreground', note: 'Teks utama' },
  { className: 'bg-muted-foreground', name: 'muted-foreground', note: 'Teks kedua' },
  { className: 'bg-faint', name: 'faint', note: 'Meta, placeholder' },
];

const PRIMARY: Swatch[] = [
  { className: 'bg-primary', name: 'bg-primary', note: 'Isi tombol' },
  { className: 'bg-primary-accent', name: 'text-primary', note: 'Ikon, aksen, fokus' },
  { className: 'bg-primary-ink', name: 'primary-ink', note: 'Teks tautan' },
  { className: 'bg-primary-soft', name: 'primary-soft', note: 'Latar terpilih' },
];

const STATUS: Swatch[] = [
  { className: 'bg-ok', name: 'ok', note: 'Aman, selesai' },
  { className: 'bg-ok-soft', name: 'ok-soft' },
  { className: 'bg-warn', name: 'warn', note: 'Menipis, menunggu' },
  { className: 'bg-warn-soft', name: 'warn-soft' },
  { className: 'bg-bad', name: 'bad', note: 'Habis, ditolak' },
  { className: 'bg-bad-soft', name: 'bad-soft' },
  { className: 'bg-info', name: 'info', note: 'Informasi' },
  { className: 'bg-info-soft', name: 'info-soft' },
];

const CATEGORIES: Swatch[] = [
  { className: 'bg-cat-obat', name: 'cat-obat', note: 'Obat' },
  { className: 'bg-cat-bhp', name: 'cat-bhp', note: 'BHP' },
  { className: 'bg-cat-imun', name: 'cat-imun', note: 'Imunisasi' },
  { className: 'bg-cat-alkes', name: 'cat-alkes', note: 'Alat kesehatan' },
];

const CHART: Swatch[] = [
  { className: 'bg-chart-ser1', name: 'chart-ser1', note: 'Seri 1 / masuk' },
  { className: 'bg-chart-ser2', name: 'chart-ser2', note: 'Seri 2 / keluar' },
  { className: 'bg-chart-plus', name: 'chart-plus', note: 'Selisih lebih' },
  { className: 'bg-chart-minus', name: 'chart-minus', note: 'Selisih kurang' },
  { className: 'bg-chart-r1', name: 'chart-r1', note: 'Alasan 1' },
  { className: 'bg-chart-r2', name: 'chart-r2', note: 'Alasan 2' },
  { className: 'bg-chart-r3', name: 'chart-r3', note: 'Alasan 3' },
  { className: 'bg-chart-r4', name: 'chart-r4', note: 'Alasan 4' },
  { className: 'bg-chart-r5', name: 'chart-r5', note: 'Alasan 5' },
  { className: 'bg-chart-r6', name: 'chart-r6', note: 'Alasan 6' },
];

export const TokenDocs: React.FC = () => (
  <DocSection
    id="token"
    title="Token & Tema"
    description="Semua warna, gradien, dan radius berasal dari variabel CSS di src/index.css yang dipetakan di tailwind.config.js. Jangan menulis warna hex atau kelas palet Tailwind (bg-green-100, text-gray-500) di halaman."
    importPath="src/index.css · tailwind.config.js · useTheme() dari '@/app/providers/ThemeProvider'"
  >
    <DocExample
      title="Permukaan dan teks"
      note="Teks utama dan teks kedua lolos kontras 4,5:1 di kedua mode. faint hanya untuk meta yang tidak wajib dibaca (placeholder, keterangan tambahan)."
      code={`<div className="bg-card text-foreground">…</div>
<p className="text-muted-foreground">Keterangan</p>`}
    >
      <SwatchGrid swatches={SURFACES} />
    </DocExample>

    <DocExample
      title="Primer"
      note="bg-primary dipasangkan dengan teks putih. text-/border-/ring-primary otomatis memakai warna aksen yang tetap terbaca di mode gelap."
      code={`<button className="bg-primary text-primary-foreground">…</button>
<Icon className="text-primary" />
<a className="text-primary-ink">Lihat detail</a>
<div className="bg-primary-soft">Terpilih</div>`}
    >
      <SwatchGrid swatches={PRIMARY} />
    </DocExample>

    <DocExample
      title="Status dan kategori"
      note="Pasangkan warna status dengan versi soft-nya untuk chip (lihat Badge). Token soft dan kaca sudah membawa transparansi, jadi jangan diberi pengubah opasitas (/10)."
      code={`<span className="bg-warn-soft text-warn">Menipis</span>
<span className="bg-cat-bhp" />`}
    >
      <SwatchGrid swatches={[...STATUS, ...CATEGORIES]} />
    </DocExample>

    <DocExample
      title="Grafik"
      note="Palet grafik sudah lolos validator buta warna di mode terang dan gelap. Di SVG pakai fill/stroke dengan currentColor dan kelas text-chart-*."
      code={`<rect className="fill-current text-chart-ser1" />
<path stroke="currentColor" className="text-chart-minus" />`}
    >
      <SwatchGrid swatches={CHART} />
    </DocExample>

    <DocExample
      title="Gradien dan kaca"
      note="Hanya untuk header (bg-grad-hero) dan sidebar (bg-grad-side). Elemen di atasnya memakai token kaca dan teks on-grad."
      code={`<div className="bg-grad-hero text-on-grad">
  <span className="border border-glass-line bg-glass text-on-grad-2">12 produk</span>
</div>`}
    >
      <div className="grid w-full gap-3 sm:grid-cols-[2fr_1fr]">
        <div className="space-y-2 rounded-card bg-grad-hero p-4 text-on-grad">
          <p className="text-base font-bold">Data Produk</p>
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex h-6 items-center rounded-full border border-glass-line bg-glass px-2.5 text-xs text-on-grad-2">
              248 produk
            </span>
            <span className="inline-flex h-6 items-center rounded-full border border-glass-line bg-glass-2 px-2.5 text-xs text-on-grad">
              12 menipis
            </span>
          </div>
        </div>
        <div className="flex min-h-24 items-end rounded-card bg-grad-side p-4 text-xs text-on-grad-3">
          Sidebar
        </div>
      </div>
    </DocExample>

    <DocExample
      title="Tipografi dan radius"
      note="Font DM Sans untuk teks, DM Mono (font-mono) untuk kode dan nomor transaksi. Kartu memakai rounded-card (14px), kontrol rounded-control (8px)."
      code={`<p className="text-sm">Isi 14px</p>
<p className="text-meta">Meta 13px</p>
<p className="text-xs">Meta 12px</p>
<p className="text-2xs">Label badge 11px</p>
<span className="font-mono">SK-2026-00128</span>`}
    >
      <div className="space-y-1">
        <p className="text-sm text-foreground">text-sm · Isi 14px</p>
        <p className="text-meta text-muted-foreground">text-meta · Meta 13px</p>
        <p className="text-xs text-muted-foreground">text-xs · Meta 12px</p>
        <p className="text-2xs text-muted-foreground">text-2xs · Label badge 11px</p>
        <p className="font-mono text-meta text-foreground">font-mono · SK-2026-00128</p>
      </div>
      <div className="flex gap-3">
        <span className="flex size-16 items-center justify-center rounded-card border bg-surface-2 text-xs text-muted-foreground">
          card
        </span>
        <span className="flex size-16 items-center justify-center rounded-control border bg-surface-2 text-xs text-muted-foreground">
          control
        </span>
      </div>
    </DocExample>

    <DocExample
      title="Tema dan ukuran"
      note="Terang / Sistem / Gelap dan Standar / Besar disimpan di localStorage. Besar menaikkan font-size elemen html ×1,15, jadi semua ukuran berbasis rem ikut naik; karena itu ukuran baru wajib memakai rem, bukan px. Untuk mencoba, buka Profil › Tampilan."
      code={`const { theme, setTheme, resolvedTheme, size, setSize } = useTheme();
setTheme('system'); // 'light' | 'system' | 'dark'
setSize('besar');   // 'standar' | 'besar'`}
    >
      <p className="text-sm text-muted-foreground">
        Kelas <code className="font-mono text-xs">dark</code> dan atribut{' '}
        <code className="font-mono text-xs">data-size="besar"</code> dipasang di elemen html.
      </p>
    </DocExample>
  </DocSection>
);
