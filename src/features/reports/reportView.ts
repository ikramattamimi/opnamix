import { bucketIndex, timeBuckets, type TimeBucket } from '@/components/charts/timeBuckets';
import { CATEGORIES } from '@/features/products/catalog';
import { stockStatus } from '@/features/products/catalog';
import type { Category, Product } from '@/features/products/types';
import type { MutationRow, MutationType, TransactionRow } from './types';

// Angka ringkas, ember grafik, dan daftar teratas untuk Laporan Stok dan
// Dashboard. Tanpa React/Supabase.

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

// ---- Posisi stok ----

export const stockValue = (p: Pick<Product, 'stock' | 'purchasePrice'>) =>
  Math.max(0, p.stock) * (p.purchasePrice || 0);

export function positionSummary(products: readonly Product[]) {
  const count = (s: ReturnType<typeof stockStatus>) =>
    products.filter((p) => stockStatus(p) === s).length;
  return {
    value: sum(products.map(stockValue)),
    count: products.length,
    aman: count('aman'),
    menipis: count('menipis'),
    habis: count('habis'),
  };
}

export function valueByCategory(products: readonly Product[]) {
  return CATEGORIES.map((category: Category) => {
    const items = products.filter((p) => p.category === category);
    return { category, count: items.length, value: sum(items.map(stockValue)) };
  })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.value - a.value);
}

export function topByStockValue(products: readonly Product[], n = 8) {
  return [...products]
    .filter((p) => stockValue(p) > 0)
    .sort((a, b) => stockValue(b) - stockValue(a))
    .slice(0, n);
}

// ---- Mutasi ----

export function mutationSummary(rows: readonly MutationRow[]) {
  const of = (t: MutationType) => rows.filter((r) => r.type === t);
  const units = (t: MutationType) => sum(of(t).map((r) => r.qty));
  return {
    inUnits: units('Masuk'),
    inRows: of('Masuk').length,
    inValue: sum(of('Masuk').map((r) => r.value)),
    outUnits: units('Keluar'),
    outRows: of('Keluar').length,
    outValue: sum(of('Keluar').map((r) => r.value)),
    adjUnits: units('Penyesuaian'),
    adjRows: of('Penyesuaian').length,
    total: rows.length,
  };
}

export interface ValueBucket extends TimeBucket {
  a: number;
  b: number;
  count: number;
  extra: number;
}

/** Nilai masuk (a) dan keluar (b) per ember; extra = jumlah penyesuaian */
export function mutationBuckets(rows: readonly MutationRow[], from: Date, to: Date): ValueBucket[] {
  const buckets = timeBuckets(from, to).map((b) => ({ ...b, a: 0, b: 0, count: 0, extra: 0 }));
  for (const r of rows) {
    const bucket = buckets[bucketIndex(buckets, new Date(r.date))];
    if (!bucket) continue;
    bucket.count++;
    if (r.type === 'Masuk') bucket.a += r.value;
    else if (r.type === 'Keluar') bucket.b += r.value;
    else bucket.extra++;
  }
  return buckets;
}

export interface TopItem {
  id: string;
  product: Product | null;
  name: string;
  brand: string;
  value: number;
}

export function topMovedProducts(rows: readonly MutationRow[], n = 6): TopItem[] {
  const map = new Map<string, TopItem>();
  for (const r of rows) {
    const prev = map.get(r.product.id);
    map.set(r.product.id, {
      id: r.product.id,
      product: r.product,
      name: r.product.name,
      brand: r.product.brand || 'Generik',
      value: (prev?.value ?? 0) + r.value,
    });
  }
  return [...map.values()].sort((a, b) => b.value - a.value).slice(0, n);
}

// ---- Transaksi keluar ----

export function transactionSummary(rows: readonly TransactionRow[]) {
  return {
    count: rows.length,
    pending: rows.filter((r) => r.status === 'Menunggu').length,
    drugTotal: sum(rows.map((r) => r.drugTotal)),
    serviceTotal: sum(rows.map((r) => r.serviceTotal)),
    services: sum(rows.map((r) => r.services.length)),
    total: sum(rows.map((r) => r.total)),
  };
}

/** Nilai obat & BHP (a) dan jasa (b) per ember */
export function transactionBuckets(
  rows: readonly TransactionRow[],
  from: Date,
  to: Date,
): ValueBucket[] {
  const buckets = timeBuckets(from, to).map((b) => ({ ...b, a: 0, b: 0, count: 0, extra: 0 }));
  for (const r of rows) {
    const bucket = buckets[bucketIndex(buckets, new Date(r.date))];
    if (!bucket) continue;
    bucket.count++;
    bucket.a += r.drugTotal;
    bucket.b += r.serviceTotal;
  }
  return buckets;
}

export function topSoldProducts(rows: readonly TransactionRow[], n = 6): TopItem[] {
  const map = new Map<string, TopItem>();
  for (const r of rows) {
    for (const d of r.drugs) {
      const id = d.productId || d.name;
      const prev = map.get(id);
      map.set(id, {
        id,
        product: null,
        name: d.name,
        brand: d.brand || 'Generik',
        value: (prev?.value ?? 0) + d.subtotal,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.value - a.value).slice(0, n);
}
