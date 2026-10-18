import { Boxes, Pill, Stethoscope, Syringe, type LucideIcon } from 'lucide-react';
import type { CategoryTone } from '@/components/data/categoryTone';
import type { StatusTone } from '@/components/data/StatusChip';
import { Category, type Product } from './types';

// Data tampilan per kategori, sediaan, dan status stok produk.

export interface CategoryMeta {
  label: string;
  short: string;
  icon: LucideIcon;
  tone: CategoryTone;
  /** Awalan kode produk */
  prefix: string;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  [Category.Obat]: { label: 'Obat', short: 'Obat', icon: Pill, tone: 'obat', prefix: 'OBT' },
  [Category.BHP]: {
    label: 'BHP (Habis Pakai)',
    short: 'BHP',
    icon: Boxes,
    tone: 'bhp',
    prefix: 'BHP',
  },
  [Category.Imunisasi]: {
    label: 'Imunisasi',
    short: 'Imunisasi',
    icon: Syringe,
    tone: 'imun',
    prefix: 'IMN',
  },
  [Category.Alkes]: {
    label: 'Alat Kesehatan',
    short: 'Alkes',
    icon: Stethoscope,
    tone: 'alkes',
    prefix: 'ALK',
  },
};

export const CATEGORIES = Object.values(Category);

export const DOSAGE_FORMS = [
  'Tablet',
  'Tablet kunyah',
  'Kaplet',
  'Kapsul',
  'Sirup',
  'Drop',
  'Injeksi',
  'Salep',
  'Serbuk',
  'Suppositoria',
] as const;

export type StockStatus = 'aman' | 'menipis' | 'habis';

// Menipis bila stok <= minimum, sama dengan isLowStock di dashboard dan trigger STOCK_LOW
export const stockStatus = (p: Pick<Product, 'stock' | 'minStock'>): StockStatus =>
  p.stock <= 0 ? 'habis' : p.stock <= p.minStock ? 'menipis' : 'aman';

export const STOCK_STATUS_META: Record<StockStatus, { label: string; tone: StatusTone }> = {
  aman: { label: 'Aman', tone: 'ok' },
  menipis: { label: 'Menipis', tone: 'warn' },
  habis: { label: 'Habis', tone: 'bad' },
};

// Kode berikutnya untuk awalan kategori: OBT-0030 setelah OBT-0029
export function nextProductCode(prefix: string, existingCodes: readonly string[]): string {
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  const max = existingCodes.reduce((acc, code) => {
    const match = code.match(pattern);
    return match ? Math.max(acc, Number(match[1])) : acc;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(4, '0')}`;
}
