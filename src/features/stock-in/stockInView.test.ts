import { describe, expect, it } from 'vitest';
import { filterReceipts, stockInStats, supplierNames, totalUnits } from './stockInView';
import type { StockInItem, StockInReceipt } from './types';

const item = (over: Partial<StockInItem> = {}): StockInItem => ({
  id: '1',
  productId: '1',
  productName: 'Paracetamol 500 mg',
  category: 'Obat',
  expiryDate: '2028-01-31',
  quantity: 10,
  unit: 'Strip',
  batch: '',
  price: 1000,
  ...over,
});

const make = (over: Partial<StockInReceipt>): StockInReceipt => ({
  id: 'INV-1',
  invoiceNumber: 'INV-1',
  supplierName: 'PT Sehat',
  date: '2026-10-10',
  items: [item()],
  status: 'Selesai',
  receivedBy: 'Rina',
  total: 10000,
  createdAt: '2026-10-10T09:00:00',
  ...over,
});

const NOW = new Date(2026, 9, 18);

describe('filterReceipts', () => {
  const list = [
    make({ id: 'a' }),
    make({
      id: 'b',
      supplierName: 'CV Farma',
      invoiceNumber: 'F-77',
      items: [item({ expiryDate: '2027-02-28' })],
    }),
  ];
  it('menyaring supplier, kata kunci, dan kedaluwarsa dekat', () => {
    const base = { query: '', supplier: 'Semua', expiring: false, now: NOW };
    expect(filterReceipts(list, { ...base, supplier: 'CV Farma' })[0].id).toBe('b');
    expect(filterReceipts(list, { ...base, query: 'f-77' })[0].id).toBe('b');
    expect(filterReceipts(list, { ...base, expiring: true }).map((r) => r.id)).toEqual(['b']);
  });
});

describe('stockInStats', () => {
  it('menghitung bulan ini dan batch kedaluwarsa dekat', () => {
    const stats = stockInStats(
      [
        make({ total: 5000, items: [item({ expiryDate: '2027-01-31' }), item()] }),
        make({ total: 9000, date: '2026-09-30', createdAt: '2026-10-01T10:00:00' }),
      ],
      NOW,
    );
    expect(stats).toEqual({ monthCount: 1, monthValue: 5000, expiringBatches: 1 });
  });
});

describe('ringkasan', () => {
  it('jumlah unit dan daftar supplier', () => {
    expect(totalUnits(make({ items: [item(), item({ quantity: 5 })] }))).toBe(15);
    expect(supplierNames([make({ supplierName: 'B' }), make({ supplierName: 'A' })])).toEqual([
      'A',
      'B',
    ]);
  });
});
