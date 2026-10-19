// Warna seri grafik, hanya dari token: chart-* untuk seri dan alasan, status
// (ok/warn/bad) untuk kesehatan stok, dan cat-* untuk kategori produk. Kelas
// ditulis utuh supaya terbaca oleh Tailwind.

export type ChartColor =
  | 'ser1'
  | 'ser2'
  | 'minus'
  | 'plus'
  | 'r1'
  | 'r2'
  | 'r3'
  | 'r4'
  | 'r5'
  | 'r6'
  | 'ok'
  | 'warn'
  | 'bad'
  | 'obat'
  | 'bhp'
  | 'imun'
  | 'alkes'
  | 'neutral';

export const CHART_FILL: Record<ChartColor, string> = {
  ser1: 'fill-chart-ser1',
  ser2: 'fill-chart-ser2',
  minus: 'fill-chart-minus',
  plus: 'fill-chart-plus',
  r1: 'fill-chart-r1',
  r2: 'fill-chart-r2',
  r3: 'fill-chart-r3',
  r4: 'fill-chart-r4',
  r5: 'fill-chart-r5',
  r6: 'fill-chart-r6',
  ok: 'fill-ok',
  warn: 'fill-warn',
  bad: 'fill-bad',
  obat: 'fill-cat-obat',
  bhp: 'fill-cat-bhp',
  imun: 'fill-cat-imun',
  alkes: 'fill-cat-alkes',
  neutral: 'fill-faint',
};

export const CHART_BG: Record<ChartColor, string> = {
  ser1: 'bg-chart-ser1',
  ser2: 'bg-chart-ser2',
  minus: 'bg-chart-minus',
  plus: 'bg-chart-plus',
  r1: 'bg-chart-r1',
  r2: 'bg-chart-r2',
  r3: 'bg-chart-r3',
  r4: 'bg-chart-r4',
  r5: 'bg-chart-r5',
  r6: 'bg-chart-r6',
  ok: 'bg-ok',
  warn: 'bg-warn',
  bad: 'bg-bad',
  obat: 'bg-cat-obat',
  bhp: 'bg-cat-bhp',
  imun: 'bg-cat-imun',
  alkes: 'bg-cat-alkes',
  neutral: 'bg-faint',
};

/** Warna alasan/kategori ke-i (r1..r6, berulang) */
export const categoricalColor = (index: number): ChartColor =>
  (['r1', 'r2', 'r3', 'r4', 'r5', 'r6'] as const)[index % 6];
