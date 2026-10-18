import { describe, expect, it } from 'vitest';
import {
  emptyProductFormValues,
  formValuesToProduct,
  validateProductForm,
  type ProductFormValues,
} from './productSchema';
import { Category, Unit, type Product } from './types';

const pct = { name: 'Paracetamol', strength: '500 mg' };
const medicine: ProductFormValues = {
  ...emptyProductFormValues,
  ingredients: [pct],
  sellingPrice: 3500,
  stock: 100,
  minStock: 10,
};

describe('validateProductForm', () => {
  it('menerima obat satu zat yang lengkap', () => {
    expect(validateProductForm(medicine, { isNew: true })).toEqual({});
  });

  it('obat wajib punya kandungan', () => {
    expect(validateProductForm({ ...medicine, ingredients: [] }, { isNew: true })).toEqual({
      ingredients: 'Isi minimal satu kandungan',
    });
  });

  it('kategori lain wajib punya nama minimal 3 karakter', () => {
    const bhp = { ...medicine, category: Category.BHP, ingredients: [] };
    expect(validateProductForm({ ...bhp, name: '' }, { isNew: true }).name).toBe(
      'Nama produk wajib diisi',
    );
    expect(validateProductForm({ ...bhp, name: 'ab' }, { isNew: true }).name).toBe(
      'Nama produk minimal 3 karakter',
    );
    expect(validateProductForm({ ...bhp, name: 'Spuit 3 ml' }, { isNew: true })).toEqual({});
  });

  it('harga jual harus lebih dari 0', () => {
    expect(validateProductForm({ ...medicine, sellingPrice: null }, { isNew: true })).toEqual({
      sellingPrice: 'Harga jual harus lebih dari 0',
    });
  });

  it('stok awal hanya wajib untuk produk baru', () => {
    const noStock = { ...medicine, stock: null };
    expect(validateProductForm(noStock, { isNew: true }).stock).toBe('Stok awal wajib diisi');
    expect(validateProductForm(noStock, { isNew: false })).toEqual({});
  });

  it('stok minimum tidak melebihi stok awal, kecuali saat edit', () => {
    const high = { ...medicine, minStock: 200 };
    expect(validateProductForm(high, { isNew: true }).minStock).toBe(
      'Stok minimum tidak boleh lebih dari stok awal',
    );
    expect(validateProductForm(high, { isNew: false })).toEqual({});
  });
});

describe('formValuesToProduct', () => {
  it('membentuk nama obat dari kandungan dan menyertakan stok awal', () => {
    expect(formValuesToProduct({ ...medicine, brand: ' Sanmol ' })).toMatchObject({
      name: 'Paracetamol 500 mg',
      brand: 'Sanmol',
      stock: 100,
      ingredients: [pct],
    });
  });

  it('tidak mengirim stok saat edit dan mengosongkan data khusus obat untuk BHP', () => {
    const existing = { id: '1', category: Category.BHP, ingredients: [] } as unknown as Product;
    const result = formValuesToProduct(
      {
        ...medicine,
        category: Category.BHP,
        name: 'Spuit 3 ml',
        unit: Unit.Pcs,
        packageSize: '3 ml',
      },
      existing,
    );
    expect(result).not.toHaveProperty('stock');
    expect(result).toMatchObject({ name: 'Spuit 3 ml', ingredients: [], packageSize: '' });
  });
});
