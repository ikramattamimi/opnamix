import { describe, expect, it } from 'vitest';
import {
  emptyServiceFormValues,
  generateCategoryCodePreview,
  serviceCategoryFormSchema,
  serviceFormSchema,
} from './serviceSchema';

const errorsOf = (values: unknown) => {
  const result = serviceFormSchema.safeParse(values);
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message]));
};

describe('serviceFormSchema', () => {
  it('menerima jasa yang lengkap tanpa kategori', () => {
    expect(
      serviceFormSchema.safeParse({ ...emptyServiceFormValues, name: 'Konsultasi', price: 50000 })
        .success,
    ).toBe(true);
  });

  it('form kosong menampilkan pesan per field', () => {
    expect(errorsOf(emptyServiceFormValues)).toEqual({
      name: 'Nama jasa minimal 3 karakter',
      price: 'Harga harus lebih dari 0',
    });
  });

  it('nama dihitung setelah spasi dibuang', () => {
    expect(errorsOf({ ...emptyServiceFormValues, name: '  ab  ', price: 1 }).name).toBe(
      'Nama jasa minimal 3 karakter',
    );
  });

  it('harga 0 ditolak', () => {
    expect(errorsOf({ ...emptyServiceFormValues, name: 'Suntik', price: 0 }).price).toBe(
      'Harga harus lebih dari 0',
    );
  });
});

describe('serviceCategoryFormSchema', () => {
  it('nama kategori wajib diisi', () => {
    const result = serviceCategoryFormSchema.safeParse({ name: '  ', description: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe('Nama kategori wajib diisi.');
  });
});

describe('generateCategoryCodePreview', () => {
  it('mengubah nama menjadi kode huruf besar', () => {
    expect(generateCategoryCodePreview(' Rawat  Jalan! ')).toBe('RAWAT_JALAN');
    expect(generateCategoryCodePreview('')).toBe('KATEGORI');
  });
});
