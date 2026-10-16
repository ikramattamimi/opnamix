import { describe, expect, it } from 'vitest';
import {
  MAX_RECEIPT_FILE_SIZE,
  emptyStockInItem,
  receiptFileSchema,
  stockInFormSchema,
  type StockInFormInput,
} from './stockInSchema';

const validItem = { productId: 'p1', expiryDate: '2027-01-01', quantity: 10, unit: 'Box' };
const valid: StockInFormInput = {
  invoiceNumber: 'INV-001',
  supplierName: '',
  date: '2026-10-17',
  items: [validItem],
  file: null,
};

const issuesOf = (values: StockInFormInput) => {
  const result = stockInFormSchema.safeParse(values);
  if (result.success) return {};
  return Object.fromEntries(
    result.error.issues.map((issue) => [issue.path.join('.'), issue.message]),
  );
};

const imageOfSize = (size: number, type = 'image/jpeg') =>
  new File([new Uint8Array(size)], 'nota.jpg', { type });

describe('stockInFormSchema', () => {
  it('menerima penerimaan tanpa supplier dan tanpa foto', () => {
    expect(stockInFormSchema.safeParse(valid).success).toBe(true);
  });

  it('form kosong menampilkan pesan per field', () => {
    expect(issuesOf({ ...valid, invoiceNumber: '', items: [emptyStockInItem()] })).toEqual({
      invoiceNumber: 'Nomor nota wajib diisi',
      'items.0.productId': 'Pilih produk terlebih dahulu',
      'items.0.expiryDate': 'Tanggal kedaluwarsa wajib diisi',
      'items.0.quantity': 'Jumlah harus lebih dari 0',
    });
  });

  it('jumlah yang dikosongkan wajib diisi', () => {
    expect(issuesOf({ ...valid, items: [{ ...validItem, quantity: undefined }] })).toEqual({
      'items.0.quantity': 'Jumlah wajib diisi',
    });
  });

  it('tanggal penerimaan wajib diisi', () => {
    expect(issuesOf({ ...valid, date: '' }).date).toBe('Tanggal penerimaan wajib diisi');
  });
});

describe('receiptFileSchema', () => {
  it('menerima gambar sampai 5MB', () => {
    expect(receiptFileSchema.safeParse(imageOfSize(MAX_RECEIPT_FILE_SIZE)).success).toBe(true);
  });

  it('menolak gambar di atas 5MB', () => {
    const result = receiptFileSchema.safeParse(imageOfSize(MAX_RECEIPT_FILE_SIZE + 1));
    expect(result.error?.issues[0].message).toBe('Ukuran file maksimal 5MB');
  });

  it('menolak file yang bukan gambar', () => {
    const result = receiptFileSchema.safeParse(imageOfSize(10, 'application/pdf'));
    expect(result.error?.issues[0].message).toBe('File harus berupa gambar');
  });
});
