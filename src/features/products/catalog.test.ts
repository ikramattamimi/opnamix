import { describe, expect, it } from 'vitest';
import {
  nextProductCode,
  productMatches,
  productMetaText,
  sortProducts,
  stockStatus,
} from './catalog';
import { Category, Unit } from './types';

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

describe('productMetaText', () => {
  it('obat memakai sediaan dan isi, kategori lain memakai satuan', () => {
    const base = { unit: Unit.Botol, dosageForm: 'Sirup', packageSize: '60 ml' };
    expect(productMetaText({ ...base, category: Category.Obat })).toBe('Obat · Sirup 60 ml');
    expect(productMetaText({ ...base, category: Category.BHP })).toBe('BHP · Botol');
    expect(
      productMetaText({ ...base, category: Category.Obat, dosageForm: '', packageSize: '' }),
    ).toBe('Obat · Botol');
  });
});

describe('productMatches', () => {
  const p = {
    name: 'OBH Combi Sirup 100 ml',
    brand: 'OBH Combi',
    code: 'OBT-0012',
    ingredients: [
      { name: 'Succus liquiritiae', strength: '' },
      { name: 'Ephedrine HCl', strength: '' },
    ],
  };
  it('mencari di nama, merek, kode, dan nama zat', () => {
    expect(productMatches(p, 'obt-0012')).toBe(true);
    expect(productMatches(p, 'ephedrine')).toBe(true);
    expect(productMatches(p, 'sirup ephedrine')).toBe(true);
    expect(productMatches(p, 'paracetamol')).toBe(false);
    expect(productMatches(p, '  ')).toBe(true);
  });
});

describe('sortProducts', () => {
  const list = [
    { name: 'B', stock: 50, minStock: 10, sellingPrice: 1000 },
    { name: 'A', stock: 5, minStock: 10, sellingPrice: 3000 },
    { name: 'C', stock: 0, minStock: 0, sellingPrice: 2000 },
  ];
  it('nama, stok kritis, dan harga tertinggi', () => {
    expect(sortProducts(list, 'nama').map((p) => p.name)).toEqual(['A', 'B', 'C']);
    expect(sortProducts(list, 'stok').map((p) => p.name)).toEqual(['C', 'A', 'B']);
    expect(sortProducts(list, 'harga').map((p) => p.name)).toEqual(['A', 'C', 'B']);
  });
});
