import { describe, expect, it } from 'vitest';
import { calculateRequestTotals } from './stockOutTotals';
import { RequestedDrug, RequestedService } from '../types';

const drug = (quantity: number, price?: number): RequestedDrug => ({
  id: `d-${quantity}-${price}`,
  productId: '1',
  productName: 'Paracetamol',
  quantity,
  unit: 'tablet',
  instructions: '',
  price,
});

const service = (price: number): RequestedService => ({ id: `s-${price}`, name: 'Jasa', price });

const baseRequest = {
  drugs: [drug(2, 5000), drug(1, 10000)],
  services: [service(15000)],
  discount: 0,
  serviceFee: 2000,
};

describe('calculateRequestTotals', () => {
  it('menjumlahkan obat (harga x qty), jasa, dan biaya layanan dengan diskon 0', () => {
    expect(calculateRequestTotals(baseRequest)).toEqual({
      totalDrugs: 20000,
      totalServices: 15000,
      serviceFee: 2000,
      discount: 0,
      grandTotal: 37000,
    });
  });

  it('mengurangi diskon nominal dari grand total', () => {
    const totals = calculateRequestTotals({ ...baseRequest, discount: 7000 });
    expect(totals.discount).toBe(7000);
    expect(totals.grandTotal).toBe(30000);
  });

  it('diskon penuh menghasilkan grand total 0', () => {
    expect(calculateRequestTotals({ ...baseRequest, discount: 37000 }).grandTotal).toBe(0);
  });

  it('diskon melebihi total tidak membuat grand total negatif', () => {
    expect(calculateRequestTotals({ ...baseRequest, discount: 100000 }).grandTotal).toBe(0);
  });

  it('tanpa jasa hanya menghitung obat dan biaya layanan', () => {
    const totals = calculateRequestTotals({ ...baseRequest, services: [] });
    expect(totals.totalServices).toBe(0);
    expect(totals.grandTotal).toBe(22000);
  });

  it('obat tanpa harga dihitung 0', () => {
    const totals = calculateRequestTotals({
      ...baseRequest,
      drugs: [drug(3)],
      services: [],
      serviceFee: 0,
    });
    expect(totals.totalDrugs).toBe(0);
    expect(totals.grandTotal).toBe(0);
  });

  it('override diskon dan biaya layanan (mode proses) menggantikan nilai di permintaan', () => {
    const totals = calculateRequestTotals(
      { ...baseRequest, discount: 5000 },
      { discount: 1000, serviceFee: 0 },
    );
    expect(totals.discount).toBe(1000);
    expect(totals.serviceFee).toBe(0);
    expect(totals.grandTotal).toBe(34000);
  });

  it('override 0 tetap dipakai, tidak jatuh ke nilai permintaan', () => {
    const totals = calculateRequestTotals({ ...baseRequest, discount: 5000 }, { discount: 0 });
    expect(totals.discount).toBe(0);
    expect(totals.grandTotal).toBe(37000);
  });
});
