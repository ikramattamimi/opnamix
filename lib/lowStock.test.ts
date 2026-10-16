import { describe, expect, it } from 'vitest';
import { getLowStockItems, isLowStock } from './lowStock';

describe('isLowStock', () => {
  it('rendah saat qty di bawah buffer', () => {
    expect(isLowStock({ qty: 3, buffer_stok: 5 })).toBe(true);
  });

  it('rendah saat qty sama dengan buffer', () => {
    expect(isLowStock({ qty: 5, buffer_stok: 5 })).toBe(true);
  });

  it('aman saat qty di atas buffer', () => {
    expect(isLowStock({ qty: 6, buffer_stok: 5 })).toBe(false);
  });

  it('stok habis tetap rendah walau buffer belum diisi', () => {
    expect(isLowStock({ qty: 0, buffer_stok: null })).toBe(true);
  });

  it('buffer belum diisi dan stok masih ada dianggap aman', () => {
    expect(isLowStock({ qty: 4, buffer_stok: null })).toBe(false);
  });
});

describe('getLowStockItems', () => {
  const items = [
    { nama: 'A', qty: 8, buffer_stok: 10 },
    { nama: 'B', qty: 50, buffer_stok: 10 },
    { nama: 'C', qty: 0, buffer_stok: 5 },
    { nama: 'D', qty: 2, buffer_stok: 2 },
    { nama: 'E', qty: 1, buffer_stok: 20 },
  ];

  it('hanya mengambil yang rendah, urut dari qty paling sedikit', () => {
    expect(getLowStockItems(items).map((i) => i.nama)).toEqual(['C', 'E', 'D', 'A']);
  });

  it('memotong sesuai limit', () => {
    expect(getLowStockItems(items, 3).map((i) => i.nama)).toEqual(['C', 'E', 'D']);
  });

  it('tidak mengubah urutan array asal', () => {
    getLowStockItems(items);
    expect(items[0].nama).toBe('A');
  });
});
