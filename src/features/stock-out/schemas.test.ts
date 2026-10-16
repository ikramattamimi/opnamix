import { describe, expect, it } from 'vitest';
import {
  MIN_CONTENT_MESSAGE,
  emptyManualItem,
  emptyRequestDrug,
  isDraftDrugRow,
  stockOutManualSchema,
  stockOutRequestSchema,
  type StockOutManualValues,
  type StockOutRequestValues,
} from './schemas';

const issuesOf = (result: {
  success: boolean;
  error?: { issues: { path: PropertyKey[]; message: string }[] };
}) => Object.fromEntries((result.error?.issues ?? []).map((i) => [i.path.join('.'), i.message]));

const manual = (overrides: Partial<StockOutManualValues> = {}): StockOutManualValues => ({
  formNumber: 'OUT-1',
  date: '2026-10-01',
  patientName: 'Budi',
  patientBirthDate: '',
  reason: '',
  items: [{ productId: 'p1', productName: 'Paracetamol', unit: 'Tablet', quantity: 2 }],
  ...overrides,
});

const request = (overrides: Partial<StockOutRequestValues> = {}): StockOutRequestValues => ({
  formNumber: '#REQ-2026-100',
  patientName: 'Budi',
  patientBirthDate: '',
  nakesName: 'Nakes A',
  drugs: [{ ...emptyRequestDrug(), productId: 'p1', productName: 'Paracetamol', quantity: 2 }],
  serviceIds: [],
  serviceFee: 0,
  discount: 0,
  ...overrides,
});

describe('stockOutManualSchema', () => {
  it('data lengkap lolos', () => {
    expect(stockOutManualSchema.safeParse(manual()).success).toBe(true);
  });

  it('field wajib kosong menghasilkan pesan per field', () => {
    const result = stockOutManualSchema.safeParse(
      manual({ formNumber: ' ', date: '', patientName: '', items: [emptyManualItem()] }),
    );
    expect(issuesOf(result)).toEqual({
      formNumber: 'Nomor formulir wajib diisi',
      date: 'Tanggal wajib diisi',
      patientName: 'Nama pasien wajib diisi',
      'items.0.productId': 'Produk wajib dipilih',
    });
  });

  it('jumlah kosong (NaN) atau 0 ditolak', () => {
    const item = { productId: 'p1', productName: 'P', unit: 'Tablet' };
    const result = stockOutManualSchema.safeParse(
      manual({
        items: [
          { ...item, quantity: NaN },
          { ...item, quantity: 0 },
        ],
      }),
    );
    expect(issuesOf(result)).toEqual({
      'items.0.quantity': 'Jumlah harus lebih dari 0',
      'items.1.quantity': 'Jumlah harus lebih dari 0',
    });
  });
});

describe('isDraftDrugRow', () => {
  it('baris baru yang belum diisi adalah draft', () => {
    expect(isDraftDrugRow(emptyRequestDrug())).toBe(true);
    expect(isDraftDrugRow({ ...emptyRequestDrug(), quantity: NaN })).toBe(true);
  });

  it('baris dengan produk atau jumlah lain bukan draft', () => {
    expect(isDraftDrugRow({ ...emptyRequestDrug(), productId: 'p1' })).toBe(false);
    expect(isDraftDrugRow({ ...emptyRequestDrug(), quantity: 3 })).toBe(false);
  });
});

describe('stockOutRequestSchema', () => {
  it('obat valid lolos', () => {
    expect(stockOutRequestSchema.safeParse(request()).success).toBe(true);
  });

  it('hanya jasa tanpa obat lolos', () => {
    expect(
      stockOutRequestSchema.safeParse(request({ drugs: [], serviceIds: ['s1'] })).success,
    ).toBe(true);
  });

  it('tanpa obat dan jasa menampilkan pesan umum', () => {
    const result = stockOutRequestSchema.safeParse(request({ drugs: [emptyRequestDrug()] }));
    expect(issuesOf(result)).toEqual({ drugs: MIN_CONTENT_MESSAGE });
  });

  it('baris obat tidak lengkap menghasilkan pesan per baris, bersama field lain', () => {
    const result = stockOutRequestSchema.safeParse(
      request({
        formNumber: '',
        drugs: [
          { ...emptyRequestDrug(), quantity: 3 },
          { ...emptyRequestDrug(), productId: 'p1', quantity: NaN },
        ],
      }),
    );
    expect(issuesOf(result)).toEqual({
      formNumber: 'Nomor formulir wajib diisi',
      'drugs.0.productId': 'Produk wajib dipilih',
      'drugs.1.quantity': 'Jumlah harus lebih dari 0',
    });
  });
});
