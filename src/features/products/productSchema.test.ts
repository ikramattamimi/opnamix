import { describe, expect, it } from 'vitest';
import { emptyProductFormValues, productFormSchema, type ProductFormValues } from './productSchema';
import { Category } from './types';

const valid: ProductFormValues = {
  ...emptyProductFormValues,
  category: Category.Alkes,
  name: 'Kasa Steril',
  sellingPrice: 5000,
  stock: 10,
  minStock: 2,
};

const errorsOf = (values: ProductFormValues) => {
  const result = productFormSchema.safeParse(values);
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message]));
};

describe('productFormSchema', () => {
  it('menerima produk yang lengkap', () => {
    expect(productFormSchema.safeParse(valid).success).toBe(true);
  });

  it('form kosong menampilkan pesan per field', () => {
    expect(errorsOf({ ...emptyProductFormValues, category: Category.Alkes })).toEqual({
      name: 'Nama produk wajib diisi',
      sellingPrice: 'Harga jual harus lebih dari 0',
      stock: 'Stok tidak boleh negatif',
      minStock: 'Stok minimum tidak boleh negatif',
    });
  });

  it('nama non-obat minimal 3 karakter', () => {
    expect(errorsOf({ ...valid, name: 'Ka' }).name).toBe('Nama produk minimal 3 karakter');
    expect(errorsOf({ ...valid, name: '   ' }).name).toBe('Nama produk wajib diisi');
  });

  it('obat memakai merek atau kandungan sebagai nama', () => {
    const medicine = { ...valid, category: Category.Obat, name: '' };
    expect(errorsOf({ ...medicine, brand: 'Ab' }).name).toBe(
      'Isi merek atau kandungan obat minimal 3 karakter',
    );
    expect(errorsOf({ ...medicine, composition: 'Paracetamol' }).name).toBeUndefined();
  });

  it('harga jual harus lebih dari 0', () => {
    expect(errorsOf({ ...valid, sellingPrice: 0 }).sellingPrice).toBe(
      'Harga jual harus lebih dari 0',
    );
  });

  it('stok dan stok minimum tidak boleh negatif', () => {
    expect(errorsOf({ ...valid, stock: -1 }).stock).toBe('Stok tidak boleh negatif');
    expect(errorsOf({ ...valid, minStock: -1 }).minStock).toBe('Stok minimum tidak boleh negatif');
  });

  it('stok minimum tidak boleh lebih dari stok awal', () => {
    expect(errorsOf({ ...valid, stock: 5, minStock: 6 }).minStock).toBe(
      'Stok minimum tidak boleh lebih dari stok awal',
    );
    expect(errorsOf({ ...valid, stock: 5, minStock: 5 }).minStock).toBeUndefined();
  });

  it('stok 0 tidak dibandingkan dengan stok minimum (aturan lama)', () => {
    expect(errorsOf({ ...valid, stock: 0, minStock: 5 }).minStock).toBeUndefined();
  });
});
