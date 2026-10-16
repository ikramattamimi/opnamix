import { describe, expect, it } from 'vitest';
import {
  addDrug,
  cloneRequest,
  removeDrug,
  toggleService,
  updateDrug,
  validateRequestEdit,
} from './requestItems';
import { RequestedDrug, StockOutRequest } from './types';

const products = [
  { id: 'p1', name: 'Paracetamol', unit: 'Tablet', sellingPrice: 5000 },
  { id: 'p2', name: 'Amoxicillin', unit: 'Kapsul', sellingPrice: 8000 },
];

const services = [
  { id: 's1', name: 'Injeksi', price: 15000 },
  { id: 's2', name: 'Nebulizer', price: 25000 },
];

const drug = (id: string, overrides: Partial<RequestedDrug> = {}): RequestedDrug => ({
  id,
  productId: 'p1',
  productName: 'Paracetamol',
  quantity: 2,
  unit: 'Tablet',
  instructions: '-',
  price: 5000,
  ...overrides,
});

const request = (overrides: Partial<StockOutRequest> = {}): StockOutRequest => ({
  id: 'REQ-1',
  requestId: '#REQ-2026-001',
  patient: { fullName: 'Budi', medicalRecordNumber: '-', birthDate: '', diagnosis: '-' },
  drugs: [drug('d1'), drug('d2', { productId: 'p2', productName: 'Amoxicillin', price: 8000 })],
  services: [{ id: 's1', name: 'Injeksi', price: 15000 }],
  totalAmount: 0,
  discount: 0,
  serviceFee: 0,
  requestedBy: 'Nakes A',
  requestedByAvatar: '',
  status: 'Menunggu',
  date: '2026-10-01',
  tipeSumber: 'PENGAJUAN_NAKES',
  createdBy: 'u1',
  ...overrides,
});

describe('updateDrug', () => {
  it('mengganti produk beserta nama, satuan, dan harga', () => {
    const next = updateDrug(request(), 'd1', 'productId', 'p2', products);
    expect(next.drugs[0]).toMatchObject({
      productId: 'p2',
      productName: 'Amoxicillin',
      unit: 'Kapsul',
      price: 8000,
      quantity: 2,
    });
    expect(next.drugs[1]).toEqual(request().drugs[1]);
  });

  it('produk tidak dikenal mengosongkan nama dan harga, satuan lama dipertahankan', () => {
    const next = updateDrug(request(), 'd1', 'productId', 'x', products);
    expect(next.drugs[0]).toMatchObject({
      productId: 'x',
      productName: '',
      unit: 'Tablet',
      price: 0,
    });
  });

  it('jumlah minimal 1, input kosong atau tidak valid menjadi 1', () => {
    expect(updateDrug(request(), 'd1', 'quantity', '5', products).drugs[0].quantity).toBe(5);
    expect(updateDrug(request(), 'd1', 'quantity', '0', products).drugs[0].quantity).toBe(1);
    expect(updateDrug(request(), 'd1', 'quantity', '-3', products).drugs[0].quantity).toBe(1);
    expect(updateDrug(request(), 'd1', 'quantity', '', products).drugs[0].quantity).toBe(1);
  });

  it('tidak mengubah permintaan asli', () => {
    const original = request();
    updateDrug(original, 'd1', 'quantity', 9, products);
    expect(original.drugs[0].quantity).toBe(2);
  });
});

describe('addDrug', () => {
  it('menambah baris obat dengan jumlah 1 dan harga produk', () => {
    const next = addDrug(request(), products[1], 'tmp-1');
    expect(next.drugs).toHaveLength(3);
    expect(next.drugs[2]).toEqual({
      id: 'tmp-1',
      productId: 'p2',
      productName: 'Amoxicillin',
      quantity: 1,
      unit: 'Kapsul',
      instructions: '-',
      price: 8000,
    });
  });
});

describe('removeDrug', () => {
  it('menghapus baris sesuai id', () => {
    const next = removeDrug(request(), 'd1');
    expect(next.drugs.map((d) => d.id)).toEqual(['d2']);
  });

  it('id tidak ada tidak mengubah daftar', () => {
    expect(removeDrug(request(), 'zzz').drugs).toHaveLength(2);
  });
});

describe('toggleService', () => {
  it('jasa yang sudah dipilih dilepas', () => {
    expect(toggleService(request(), 's1', services).services).toEqual([]);
  });

  it('jasa baru ditambahkan dengan nama dan harga dari master', () => {
    const next = toggleService(request(), 's2', services);
    expect(next.services).toEqual([
      { id: 's1', name: 'Injeksi', price: 15000 },
      { id: 's2', name: 'Nebulizer', price: 25000 },
    ]);
  });

  it('jasa tidak dikenal tidak mengubah permintaan', () => {
    const original = request();
    expect(toggleService(original, 'zzz', services)).toBe(original);
  });
});

describe('validateRequestEdit', () => {
  it('permintaan valid mengembalikan null', () => {
    expect(validateRequestEdit(request())).toBeNull();
  });

  it('nama pasien kosong', () => {
    const req = request({
      patient: { fullName: '  ', medicalRecordNumber: '-', birthDate: '', diagnosis: '-' },
    });
    expect(validateRequestEdit(req)).toBe('Nama pasien wajib diisi.');
  });

  it('tanpa obat dan jasa', () => {
    expect(validateRequestEdit(request({ drugs: [], services: [] }))).toBe(
      'Tambahkan minimal satu obat atau satu jasa.',
    );
  });

  it('hanya jasa tetap valid', () => {
    expect(validateRequestEdit(request({ drugs: [] }))).toBeNull();
  });

  it('obat tanpa produk atau jumlah 0', () => {
    const message = 'Pastikan semua item obat sudah dipilih dan jumlahnya valid.';
    expect(validateRequestEdit(request({ drugs: [drug('d1', { productId: '' })] }))).toBe(message);
    expect(validateRequestEdit(request({ drugs: [drug('d1', { quantity: 0 })] }))).toBe(message);
  });
});

describe('cloneRequest', () => {
  it('menyalin pasien, obat, dan jasa tanpa berbagi referensi', () => {
    const original = request();
    const copy = cloneRequest(original);
    expect(copy).toEqual(original);
    expect(copy.patient).not.toBe(original.patient);
    expect(copy.drugs[0]).not.toBe(original.drugs[0]);
    expect(copy.services[0]).not.toBe(original.services[0]);
  });
});
