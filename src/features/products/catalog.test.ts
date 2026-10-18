import { describe, expect, it } from 'vitest';
import { nextProductCode, stockStatus } from './catalog';

describe('stockStatus', () => {
  it('habis, menipis (<= minimum), aman', () => {
    expect(stockStatus({ stock: 0, minStock: 10 })).toBe('habis');
    expect(stockStatus({ stock: 10, minStock: 10 })).toBe('menipis');
    expect(stockStatus({ stock: 11, minStock: 10 })).toBe('aman');
  });
});

describe('nextProductCode', () => {
  it('melanjutkan nomor terbesar dengan awalan yang sama', () => {
    expect(nextProductCode('OBT', ['OBT-0001', 'OBT-0029', 'BHP-0040', 'ID-X1'])).toBe('OBT-0030');
    expect(nextProductCode('ALK', [])).toBe('ALK-0001');
  });
});
