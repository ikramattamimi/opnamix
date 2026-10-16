import type { Product } from '@/features/products/types';

// Status kesehatan stok di laporan analisis:
// Kritikal = stok <= setengah batas minimum, Menipis = stok <= batas minimum.
export type StockStatus = 'Kritikal' | 'Menipis' | 'Aman';

type StockFields = Pick<Product, 'stock' | 'minStock'>;

export const getStockStatus = (p: StockFields): StockStatus => {
  if (p.stock <= p.minStock / 2) return 'Kritikal';
  if (p.stock <= p.minStock) return 'Menipis';
  return 'Aman';
};

export interface StockFilter {
  search: string;
  // 'Semua' berarti tidak difilter
  category: string;
  status: string;
}

export const filterProducts = <T extends Product>(products: T[], filter: StockFilter): T[] => {
  const term = filter.search.toLowerCase();
  return products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(term) || p.code.toLowerCase().includes(term);
    const matchesCategory = filter.category === 'Semua' || p.category === filter.category;
    const matchesStatus = filter.status === 'Semua' || getStockStatus(p) === filter.status;
    return matchesSearch && matchesCategory && matchesStatus;
  });
};

export const getStockValue = (p: Pick<Product, 'stock' | 'sellingPrice'>): number =>
  p.stock * p.sellingPrice;

export interface StockSummary {
  totalValue: number;
  totalSku: number;
  // Termasuk yang kritikal
  lowStockCount: number;
  criticalStockCount: number;
}

export const getStockSummary = (products: Product[]): StockSummary => ({
  totalValue: products.reduce((acc, p) => acc + getStockValue(p), 0),
  totalSku: products.length,
  lowStockCount: products.filter((p) => getStockStatus(p) !== 'Aman').length,
  criticalStockCount: products.filter((p) => getStockStatus(p) === 'Kritikal').length,
});

export interface CategoryStat {
  name: string;
  count: number;
  percent: number;
}

// Jumlah produk per kategori, urut sesuai kategori pertama kali muncul.
export const getCategoryStats = (products: Pick<Product, 'category'>[]): CategoryStat[] => {
  const stats: Record<string, number> = {};
  products.forEach((p) => {
    stats[p.category] = (stats[p.category] || 0) + 1;
  });
  return Object.entries(stats).map(([name, count]) => ({
    name,
    count,
    percent: Math.round((count / products.length) * 100),
  }));
};

// Produk dengan stok terbanyak, tanpa mengubah array asal.
export const getTopStockProducts = <T extends Pick<Product, 'stock'>>(
  products: T[],
  limit = 5,
): T[] => [...products].sort((a, b) => b.stock - a.stock).slice(0, limit);
