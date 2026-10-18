import { describe, expect, it } from 'vitest';
import {
  getDisplayNameFromMasterObat,
  getProductDisplayName,
  ingredientSummary,
  parseIngredients,
} from './productDisplay';
import { Category } from './types';

describe('parseIngredients', () => {
  it('memisah per koma dan mengambil kekuatan', () => {
    expect(parseIngredients('Paracetamol 500 mg, Kafein 50 mg; Vitamin B1')).toEqual([
      { name: 'Paracetamol', strength: '500 mg' },
      { name: 'Kafein', strength: '50 mg' },
      { name: 'Vitamin B1', strength: '' },
    ]);
  });
});

describe('getProductDisplayName', () => {
  const pct = { name: 'Paracetamol', strength: '500 mg' };
  const cof = { name: 'Kafein', strength: '50 mg' };

  it('obat satu zat memakai zat + kekuatan', () => {
    expect(
      getProductDisplayName({ category: Category.Obat, brand: 'Sanmol', ingredients: [pct] }),
    ).toBe('Paracetamol 500 mg');
  });

  it('obat kombinasi memakai merek + sediaan + isi', () => {
    expect(
      getProductDisplayName({
        category: Category.Obat,
        brand: 'OBH Combi',
        dosageForm: 'Sirup',
        packageSize: '100 ml',
        ingredients: [pct, cof],
      }),
    ).toBe('OBH Combi Sirup 100 ml');
  });

  it('obat kombinasi generik memakai nama atau daftar zat', () => {
    expect(getProductDisplayName({ category: Category.Obat, ingredients: [pct, cof] })).toBe(
      'Paracetamol, Kafein',
    );
  });

  it('kategori lain memakai nama yang diketik', () => {
    expect(
      getProductDisplayName({ category: Category.BHP, name: ' Spuit 3 ml ', brand: 'Terumo' }),
    ).toBe('Spuit 3 ml');
  });

  it('ringkasan kandungan', () => {
    expect(ingredientSummary([pct, { name: 'Kafein', strength: '' }])).toBe(
      'Paracetamol 500 mg, Kafein',
    );
  });
});

describe('getDisplayNameFromMasterObat', () => {
  it('menambahkan merek dalam kurung bila belum ada di nama', () => {
    expect(
      getDisplayNameFromMasterObat({
        nama: 'Spuit 3 ml',
        jenis: 'BHP (Habis Pakai)',
        merek: 'Terumo',
      }),
    ).toBe('Spuit 3 ml (Terumo)');
    expect(
      getDisplayNameFromMasterObat({
        nama: 'Sanmol - Paracetamol 500mg',
        jenis: 'Obat',
        merek: 'Sanmol',
      }),
    ).toBe('Sanmol - Paracetamol 500mg');
  });

  it('data lama tanpa nama memakai merek dan kandungan', () => {
    expect(
      getDisplayNameFromMasterObat({
        nama: '',
        jenis: 'Obat',
        merek: 'Sanmol',
        kandungan: 'Paracetamol',
      }),
    ).toBe('Sanmol - Paracetamol');
  });

  it('data kosong menghasilkan "Unknown"', () => {
    expect(getDisplayNameFromMasterObat(null)).toBe('Unknown');
    expect(getDisplayNameFromMasterObat({ nama: '', jenis: 'Obat' })).toBe('Unknown');
  });
});
