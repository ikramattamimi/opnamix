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

// Baris bawah card: "Obat · Sirup 60 ml", kategori lain "BHP · Pcs"
export function productMetaText(
  p: Pick<Product, 'category' | 'dosageForm' | 'packageSize' | 'unit'>,
): string {
  const meta = CATEGORY_META[p.category] ?? CATEGORY_META[Category.Obat];
  const form =
    p.category === Category.Obat
      ? [p.dosageForm, p.packageSize].filter((v) => v?.trim()).join(' ')
      : '';
  return `${meta.short} · ${form || p.unit}`;
}

// Pencarian produk: nama, merek, kode, dan semua nama zat
export function productMatches(
  p: Pick<Product, 'name' | 'brand' | 'code' | 'ingredients'>,
  query: string,
): boolean {
  const q = query.trim().toLocaleLowerCase('id-ID');
  if (!q) return true;
  const haystack = [p.name, p.brand, p.code, ...(p.ingredients ?? []).map((i) => i.name)]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase('id-ID');
  return q.split(/\s+/).every((word) => haystack.includes(word));
}

export type ProductSort = 'nama' | 'stok' | 'harga';

export const PRODUCT_SORTS: { value: ProductSort; label: string }[] = [
  { value: 'nama', label: 'Urut: Nama A–Z' },
  { value: 'stok', label: 'Urut: Stok paling kritis' },
  { value: 'harga', label: 'Urut: Harga jual tertinggi' },
];

// Stok kritis = rasio stok terhadap minimum paling kecil
export function sortProducts<
  T extends Pick<Product, 'name' | 'stock' | 'minStock' | 'sellingPrice'>,
>(list: readonly T[], sort: ProductSort): T[] {
  const compare: Record<ProductSort, (a: T, b: T) => number> = {
    nama: (a, b) => a.name.localeCompare(b.name, 'id'),
    stok: (a, b) => a.stock / Math.max(a.minStock, 1) - b.stock / Math.max(b.minStock, 1),
    harga: (a, b) => b.sellingPrice - a.sellingPrice,
  };
  return [...list].sort((a, b) => compare[sort](a, b) || a.name.localeCompare(b.name, 'id'));
}

// Nama zat unik dari semua produk, untuk saran TagInput
export function collectIngredientNames(
  products: readonly Pick<Product, 'ingredients'>[],
): string[] {
  const names = new Map<string, string>();
  for (const p of products)
    for (const i of p.ingredients ?? []) {
      const key = i.name.trim().toLocaleLowerCase('id-ID');
      if (key && !names.has(key)) names.set(key, i.name.trim());
    }
  return [...names.values()].sort((a, b) => a.localeCompare(b, 'id'));
}
