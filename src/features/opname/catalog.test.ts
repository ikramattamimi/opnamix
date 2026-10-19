import { describe, expect, it } from 'vitest';
import { Category, Unit, type Product } from '@/features/products/types';
import {
  daysUntil,
  diffOf,
  nextRun,
  runName,
  runStats,
  scheduleScope,
  scopeProductIds,
  valueOf,
  type RunItem,
} from './catalog';

const product = (id: string, category = Category.Obat, price = 1000): Product => ({
  id,
  code: id,
  name: `Produk ${id}`,
  category,
  unit: Unit.Tablet,
  purchasePrice: price,
  sellingPrice: price,
  stock: 10,
  minStock: 2,
  description: '',
  color: '',
});

const item = (over: Partial<RunItem>): RunItem => ({
  detailId: '1',
  product: product('p1'),
  systemStock: 10,
  physicalStock: null,
  finalStock: null,
  reasonCode: null,
  reasonText: null,
  note: null,
  ...over,
});

describe('diffOf dan valueOf', () => {
  it('belum dihitung berarti selisih null, bukan stok 0', () => {
    expect(diffOf(item({}))).toBeNull();
    expect(valueOf(item({}))).toBe(0);
  });

  it('stok final mengalahkan hitungan fisik', () => {
    expect(diffOf(item({ physicalStock: 7 }))).toBe(-3);
    expect(diffOf(item({ physicalStock: 7, finalStock: 9 }))).toBe(-1);
    expect(valueOf(item({ physicalStock: 12 }))).toBe(2000);
  });
});

describe('runStats', () => {
  it('menghitung progres, selisih, alasan, dan nilai', () => {
    const s = runStats([
      item({ detailId: 'a', physicalStock: 10 }),
      item({ detailId: 'b', physicalStock: 8, reasonCode: 'rusak' }),
      item({ detailId: 'c', physicalStock: 11 }),
      item({ detailId: 'd' }),
    ]);
    expect(s).toEqual({
      n: 4,
      counted: 3,
      ok: 1,
      diff: 2,
      reasoned: 1,
      minus: -2000,
      plus: 1000,
      net: -1000,
    });
  });
});

describe('nextRun', () => {
  const base = { waktuJam: 9, waktuMenit: 0, isActive: true };
  const now = new Date(2026, 9, 19, 12, 0);

  it('tanggal audit bulan ini kalau belum lewat', () => {
    expect(nextRun({ ...base, tanggalAudit: 25, pengulangan: 'BULANAN' }, now)).toEqual(
      new Date(2026, 9, 25, 9, 0),
    );
  });

  it('maju satu periode kalau sudah lewat', () => {
    expect(nextRun({ ...base, tanggalAudit: 1, pengulangan: 'BULANAN' }, now)).toEqual(
      new Date(2026, 10, 1, 9, 0),
    );
    expect(nextRun({ ...base, tanggalAudit: 1, pengulangan: 'TRIWULAN' }, now)).toEqual(
      new Date(2027, 0, 1, 9, 0),
    );
  });

  it('jadwal nonaktif tidak punya tanggal berikutnya', () => {
    expect(
      nextRun({ ...base, isActive: false, tanggalAudit: 25, pengulangan: 'BULANAN' }, now),
    ).toBeNull();
  });

  it('menghitung sisa hari', () => {
    expect(daysUntil(new Date(2026, 9, 25, 9), now)).toBe(6);
  });
});

describe('cakupan jadwal', () => {
  const products = [product('1'), product('2', Category.BHP), product('3', Category.Alkes)];

  it('null semua berarti semua produk', () => {
    expect(scopeProductIds(scheduleScope({ obatIds: null, kategori: null }), products)).toEqual([
      '1',
      '2',
      '3',
    ]);
  });

  it('kategori dan pilih manual', () => {
    expect(
      scopeProductIds(scheduleScope({ obatIds: null, kategori: [Category.BHP] }), products),
    ).toEqual(['2']);
    expect(
      scopeProductIds(scheduleScope({ obatIds: ['3', '99'], kategori: null }), products),
    ).toEqual(['3']);
  });
});

describe('runName', () => {
  it('memilih nama sesi', () => {
    expect(runName({ name: 'Cek obat oral', scheduleName: 'Bulanan' })).toBe('Cek obat oral');
    expect(runName({ name: null, scheduleName: 'Bulanan' })).toBe('Bulanan');
    expect(runName({})).toBe('Opname cepat');
  });
});
