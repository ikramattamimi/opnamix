import { describe, expect, it } from 'vitest';
import { Category, Unit, type Product } from '@/features/products/types';
import type { MutationRow, TransactionRow } from './types';
import {
  mutationBuckets,
  mutationSummary,
  positionSummary,
  topByStockValue,
  topMovedProducts,
  topSoldProducts,
  transactionSummary,
  valueByCategory,
} from './reportView';

const product = (id: string, over: Partial<Product> = {}): Product => ({
  id,
  code: id,
  name: `Produk ${id}`,
  category: Category.Obat,
  unit: Unit.Tablet,
  purchasePrice: 1000,
  sellingPrice: 1500,
  stock: 10,
  minStock: 2,
  description: '',
  color: '',
  ...over,
});

const mut = (
  key: string,
  type: MutationRow['type'],
  qty: number,
  date: string,
  p = product('a'),
): MutationRow => ({
  key,
  date,
  code: key,
  type,
  product: p,
  qty,
  value: Math.abs(qty) * p.purchasePrice,
  by: '-',
  note: '',
  link: { kind: 'stock-in' },
});

describe('posisi stok', () => {
  const products = [
    product('a'),
    product('b', { stock: 1, category: Category.BHP, purchasePrice: 500 }),
    product('c', { stock: 0 }),
  ];

  it('menghitung nilai dan status', () => {
    expect(positionSummary(products)).toEqual({
      value: 10500,
      count: 3,
      aman: 1,
      menipis: 1,
      habis: 1,
    });
  });

  it('mengelompokkan per kategori dan mengurutkan nilai terbesar', () => {
    expect(valueByCategory(products).map((c) => [c.category, c.value])).toEqual([
      [Category.Obat, 10000],
      [Category.BHP, 500],
    ]);
    expect(topByStockValue(products).map((p) => p.id)).toEqual(['a', 'b']);
  });
});

describe('mutasi', () => {
  const rows = [
    mut('1', 'Masuk', 5, '2026-10-15T10:00:00'),
    mut('2', 'Keluar', -2, '2026-10-15T11:00:00'),
    mut('3', 'Penyesuaian', -1, '2026-10-17T09:00:00'),
    mut('4', 'Keluar', -3, '2026-10-18T09:00:00', product('b', { purchasePrice: 2000 })),
  ];

  it('meringkas unit dan nilai per tipe', () => {
    expect(mutationSummary(rows)).toMatchObject({
      inUnits: 5,
      inValue: 5000,
      outUnits: -5,
      outRows: 2,
      outValue: 8000,
      adjUnits: -1,
      total: 4,
    });
  });

  it('mengisi ember harian', () => {
    const b = mutationBuckets(
      rows,
      new Date('2026-10-13T00:00:00'),
      new Date('2026-10-19T23:59:59'),
    );
    expect(b[2]).toMatchObject({ a: 5000, b: 2000, count: 2 });
    expect(b[4]).toMatchObject({ extra: 1 });
  });

  it('mengurutkan produk bergerak terbesar', () => {
    expect(topMovedProducts(rows).map((t) => [t.id, t.value])).toEqual([
      ['a', 8000],
      ['b', 6000],
    ]);
  });
});

describe('transaksi keluar', () => {
  const trx = (
    id: string,
    status: TransactionRow['status'],
    drugs: number,
    services: number,
  ): TransactionRow => ({
    id,
    code: id,
    date: '2026-10-15T10:00:00',
    processedAt: null,
    kind: 'Permintaan',
    status,
    patient: '-',
    requestedBy: '-',
    processedBy: null,
    note: '',
    drugs: [
      { id: `${id}d`, productId: 'a', name: 'A', quantity: 1, price: drugs, subtotal: drugs },
    ],
    services: services
      ? [{ id: `${id}s`, name: 'S', quantity: 1, price: services, subtotal: services }]
      : [],
    drugTotal: drugs,
    serviceTotal: services,
    serviceFee: 0,
    discount: 0,
    total: drugs + services,
  });

  it('meringkas dan mengurutkan produk', () => {
    const rows = [trx('1', 'Selesai', 3000, 5000), trx('2', 'Menunggu', 2000, 0)];
    expect(transactionSummary(rows)).toEqual({
      count: 2,
      pending: 1,
      drugTotal: 5000,
      serviceTotal: 5000,
      services: 1,
      total: 10000,
    });
    expect(topSoldProducts(rows)[0]).toMatchObject({ id: 'a', value: 5000 });
  });
});
