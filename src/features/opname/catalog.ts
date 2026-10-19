import type { ChartColor } from '@/components/charts/chartColors';
import { monthName } from '@/lib/format';
import type { Category, Product } from '@/features/products/types';
import type { OpnameSchedule, PengulanganOpname } from './types';

// Logika opname tanpa React/Supabase: alasan selisih, statistik sesi, nilai
// rupiah selisih, jadwal berikutnya, dan cakupan jadwal.

// ---- Alasan selisih ----

export const REASONS = [
  { code: 'belum_dicatat', label: 'Transaksi belum dicatat', color: 'r1' },
  { code: 'rusak', label: 'Rusak', color: 'r2' },
  { code: 'kedaluwarsa', label: 'Kedaluwarsa', color: 'r3' },
  { code: 'salah_hitung', label: 'Salah hitung sebelumnya', color: 'r4' },
  { code: 'salah_input', label: 'Salah input stok', color: 'r5' },
  { code: 'hilang', label: 'Hilang', color: 'r6' },
  { code: 'lainnya', label: 'Lainnya', color: 'ser2' },
] as const satisfies readonly { code: string; label: string; color: ChartColor }[];

export type ReasonCode = (typeof REASONS)[number]['code'];

export const isReasonCode = (value: unknown): value is ReasonCode =>
  REASONS.some((r) => r.code === value);

export const reasonMeta = (code: ReasonCode) => REASONS.find((r) => r.code === code)!;

// ---- Item dan statistik ----

export interface RunItem {
  detailId: string;
  product: Product;
  systemStock: number;
  physicalStock: number | null;
  /** Stok final berbeda dari hitungan fisik (lanjutan) */
  finalStock: number | null;
  reasonCode: ReasonCode | null;
  /** Alasan teks bebas dari data lama */
  reasonText: string | null;
  note: string | null;
}

export const isCounted = (i: Pick<RunItem, 'physicalStock'>) => i.physicalStock !== null;

export const finalOf = (i: Pick<RunItem, 'finalStock' | 'physicalStock'>) =>
  i.finalStock ?? i.physicalStock;

/** Selisih final − sistem; null kalau belum dihitung */
export const diffOf = (i: Pick<RunItem, 'finalStock' | 'physicalStock' | 'systemStock'>) => {
  const final = finalOf(i);
  return final === null ? null : final - i.systemStock;
};

/** Nilai rupiah selisih memakai harga beli */
export const valueOf = (i: RunItem) => (diffOf(i) ?? 0) * (i.product.purchasePrice || 0);

export const hasReason = (i: Pick<RunItem, 'reasonCode' | 'reasonText'>) =>
  !!i.reasonCode || !!i.reasonText?.trim();

export const reasonLabel = (i: Pick<RunItem, 'reasonCode' | 'reasonText'>) =>
  i.reasonCode ? reasonMeta(i.reasonCode).label : i.reasonText?.trim() || null;

export interface RunStats {
  n: number;
  counted: number;
  ok: number;
  diff: number;
  reasoned: number;
  minus: number;
  plus: number;
  net: number;
}

export function runStats(items: readonly RunItem[]): RunStats {
  const s: RunStats = {
    n: items.length,
    counted: 0,
    ok: 0,
    diff: 0,
    reasoned: 0,
    minus: 0,
    plus: 0,
    net: 0,
  };
  for (const i of items) {
    const d = diffOf(i);
    if (d === null) continue;
    s.counted++;
    if (d === 0) {
      s.ok++;
      continue;
    }
    s.diff++;
    if (hasReason(i)) s.reasoned++;
    const v = valueOf(i);
    if (v < 0) s.minus += v;
    else s.plus += v;
    s.net += v;
  }
  return s;
}

// ---- Jadwal ----

const PERIOD_MONTHS: Record<PengulanganOpname, number> = { BULANAN: 1, TRIWULAN: 3, TAHUNAN: 12 };

export const FREQUENCY_LABEL: Record<PengulanganOpname, string> = {
  BULANAN: 'Bulanan',
  TRIWULAN: 'Triwulan',
  TAHUNAN: 'Tahunan',
};

/**
 * Tanggal opname berikutnya: tanggal audit bulan ini pada jamnya, atau satu
 * periode setelahnya kalau sudah lewat. null kalau jadwal nonaktif/tidak lengkap.
 */
export function nextRun(
  s: Pick<OpnameSchedule, 'tanggalAudit' | 'waktuJam' | 'waktuMenit' | 'pengulangan' | 'isActive'>,
  now: Date = new Date(),
): Date | null {
  if (s.isActive === false || !s.tanggalAudit) return null;
  const d = new Date(
    now.getFullYear(),
    now.getMonth(),
    s.tanggalAudit,
    s.waktuJam ?? 8,
    s.waktuMenit ?? 0,
  );
  if (d <= now) d.setMonth(d.getMonth() + PERIOD_MONTHS[s.pengulangan]);
  return d;
}

export type ScheduleScope =
  | { type: 'semua' }
  | { type: 'kategori'; categories: Category[] }
  | { type: 'manual'; productIds: string[] };

export function scheduleScope(s: Pick<OpnameSchedule, 'obatIds' | 'kategori'>): ScheduleScope {
  if (s.kategori?.length) return { type: 'kategori', categories: s.kategori };
  if (s.obatIds) return { type: 'manual', productIds: s.obatIds.map(String) };
  return { type: 'semua' };
}

export function scopeProductIds(scope: ScheduleScope, products: readonly Product[]): string[] {
  if (scope.type === 'semua') return products.map((p) => p.id);
  if (scope.type === 'kategori')
    return products.filter((p) => scope.categories.includes(p.category)).map((p) => p.id);
  const known = new Set(products.map((p) => p.id));
  return scope.productIds.filter((id) => known.has(id));
}

export function scopeLabel(scope: ScheduleScope, categoryLabel: (c: Category) => string): string {
  if (scope.type === 'semua') return 'Semua produk';
  if (scope.type === 'kategori') return scope.categories.map(categoryLabel).join(', ');
  return `Pilih manual · ${scope.productIds.length} produk`;
}

export const timeLabel = (s: Pick<OpnameSchedule, 'waktuJam' | 'waktuMenit'>) =>
  `${String(s.waktuJam ?? 8).padStart(2, '0')}.${String(s.waktuMenit ?? 0).padStart(2, '0')}`;

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/** "Sabtu, 1 November 2026" */
export const longDate = (d: Date) =>
  `${HARI[d.getDay()]}, ${d.getDate()} ${monthName(d.getMonth())} ${d.getFullYear()}`;

export const daysUntil = (d: Date, now: Date = new Date()) =>
  Math.ceil(
    (new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() -
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) /
      864e5,
  );

export const opnameCode = (id: string | number) => `OPN-${id}`;

/** Nama sesi: nama opname cepat, nama jadwal, atau "Opname cepat" */
export const runName = (r: { name?: string | null; scheduleName?: string | null }) =>
  r.name?.trim() || r.scheduleName?.trim() || 'Opname cepat';
