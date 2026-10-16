import { describe, expect, it } from 'vitest';
import { calculateOpnameDifference } from './opnameCalc';

describe('calculateOpnameDifference', () => {
  it('bernilai 0 saat stok fisik sama dengan stok sistem', () => {
    expect(calculateOpnameDifference(10, 10)).toBe(0);
  });

  it('positif saat stok fisik lebih banyak', () => {
    expect(calculateOpnameDifference(12, 10)).toBe(2);
  });

  it('negatif saat stok fisik lebih sedikit', () => {
    expect(calculateOpnameDifference(7, 10)).toBe(-3);
  });

  it('stok fisik yang belum diisi dihitung 0', () => {
    expect(calculateOpnameDifference(undefined, 10)).toBe(-10);
  });
});
