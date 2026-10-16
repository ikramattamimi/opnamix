import { describe, expect, it } from 'vitest';
import { Category, Unit, type Product } from '@/features/products/types';
import {
  filterProducts,
  getCategoryStats,
  getStockStatus,
  getStockSummary,
  getTopStockProducts,
} from './stockAnalytics';

const product = (overrides: Partial<Product>): Product => ({
  id: 'id',
  code: 'KODE',
  name: 'Produk',
  category: Category.Obat,
  unit: Unit.Tablet,
  purchasePrice: 0,
  sellingPrice: 1000,
  stock: 100,
  minStock: 10,
  description: '',
  color: 'bg-primary',
  ...overrides,
});

describe('getStockStatus', () => {
  it('kritikal saat stok <= setengah batas minimum', () => {
    expect(getStockStatus({ stock: 5, minStock: 10 })).toBe('Kritikal');
    expect(getStockStatus({ stock: 0, minStock: 10 })).toBe('Kritikal');
  });

  it('menipis saat stok di atas setengah tapi <= batas minimum', () => {
    expect(getStockStatus({ stock: 6, minStock: 10 })).toBe('Menipis');
    expect(getStockStatus({ stock: 10, minStock: 10 })).toBe('Menipis');
  });

  it('aman saat stok di atas batas minimum', () => {
    expect(getStockStatus({ stock: 11, minStock: 10 })).toBe('Aman');
  });

  it('batas minimum ganjil memakai pembagian desimal', () => {
    expect(getStockStatus({ stock: 2, minStock: 5 })).toBe('Kritikal');
    expect(getStockStatus({ stock: 3, minStock: 5 })).toBe('Menipis');
  });

  it('stok 0 dengan batas minimum 0 dianggap kritikal', () => {
    expect(getStockStatus({ stock: 0, minStock: 0 })).toBe('Kritikal');
  });
});

describe('filterProducts', () => {
  const products = [
    product({ id: '1', name: 'Paracetamol', code: 'OBT-001', stock: 100 }),
    product({ id: '2', name: 'Amoxicillin', code: 'OBT-002', stock: 8 }),
    product({ id: '3', name: 'Kasa Steril', code: 'BHP-001', category: Category.BHP, stock: 2 }),
  ];
  const all = { search: '', category: 'Semua', status: 'Semua' };

  it('tanpa filter mengembalikan semua produk', () => {
    expect(filterProducts(products, all)).toHaveLength(3);
  });

  it('mencari nama atau kode tanpa membedakan huruf besar kecil', () => {
    expect(filterProducts(products, { ...all, search: 'PARA' }).map((p) => p.id)).toEqual(['1']);
    expect(filterProducts(products, { ...all, search: 'bhp' }).map((p) => p.id)).toEqual(['3']);
  });

  it('memfilter kategori', () => {
    expect(filterProducts(products, { ...all, category: Category.BHP }).map((p) => p.id)).toEqual([
      '3',
    ]);
  });

  it('memfilter status', () => {
    expect(filterProducts(products, { ...all, status: 'Menipis' }).map((p) => p.id)).toEqual(['2']);
    expect(filterProducts(products, { ...all, status: 'Kritikal' }).map((p) => p.id)).toEqual([
      '3',
    ]);
    expect(filterProducts(products, { ...all, status: 'Aman' }).map((p) => p.id)).toEqual(['1']);
  });
});

describe('getStockSummary', () => {
  it('menghitung nilai, SKU, menipis (termasuk kritikal), dan kritikal', () => {
    const summary = getStockSummary([
      product({ stock: 100, sellingPrice: 2000 }),
      product({ stock: 8, sellingPrice: 500 }),
      product({ stock: 2, sellingPrice: 1000 }),
    ]);
    expect(summary).toEqual({
      totalValue: 100 * 2000 + 8 * 500 + 2 * 1000,
      totalSku: 3,
      lowStockCount: 2,
      criticalStockCount: 1,
    });
  });

  it('daftar kosong menghasilkan nol', () => {
    expect(getStockSummary([])).toEqual({
      totalValue: 0,
      totalSku: 0,
      lowStockCount: 0,
      criticalStockCount: 0,
    });
  });
});

describe('getCategoryStats', () => {
  it('menghitung jumlah dan persen per kategori sesuai urutan muncul', () => {
    expect(
      getCategoryStats([
        { category: Category.BHP },
        { category: Category.Obat },
        { category: Category.Obat },
      ]),
    ).toEqual([
      { name: Category.BHP, count: 1, percent: 33 },
      { name: Category.Obat, count: 2, percent: 67 },
    ]);
  });

  it('daftar kosong menghasilkan array kosong', () => {
    expect(getCategoryStats([])).toEqual([]);
  });
});

describe('getTopStockProducts', () => {
  const items = [{ stock: 5 }, { stock: 50 }, { stock: 1 }, { stock: 30 }];

  it('mengurutkan dari stok terbanyak dan memotong sesuai limit', () => {
    expect(getTopStockProducts(items, 2)).toEqual([{ stock: 50 }, { stock: 30 }]);
  });

  it('default mengambil 5 produk', () => {
    expect(getTopStockProducts([...items, ...items])).toHaveLength(5);
  });

  it('tidak mengubah urutan array asal', () => {
    getTopStockProducts(items);
    expect(items[0].stock).toBe(5);
  });
});
