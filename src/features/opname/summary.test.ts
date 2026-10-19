import { describe, expect, it } from 'vitest';
import { Category, Unit, type Product } from '@/features/products/types';
import type { RunItem } from './catalog';
import type { OpnameRun } from './types';
import { lastOpnamedAt, summarizeOpnames } from './summary';

const product = (id: string, price = 1000): Product => ({
  id,
  code: id,
  name: id,
  category: Category.Obat,
  unit: Unit.Tablet,
  purchasePrice: price,
  sellingPrice: price,
  stock: 0,
  minStock: 0,
  description: '',
  color: '',
});

const item = (
  id: string,
  sys: number,
  phys: number,
  reasonCode: RunItem['reasonCode'] = null,
): RunItem => ({
  detailId: id,
  product: product(id),
  systemStock: sys,
  physicalStock: phys,
  finalStock: null,
  reasonCode,
  reasonText: null,
  note: null,
});

const run = (id: string, completedAt: string, items: RunItem[]): OpnameRun => ({
  id,
  code: `OPN-${id}`,
  name: 'Opname',
  status: 'selesai',
  scheduleId: null,
  scheduleName: null,
  startedAt: completedAt,
  completedAt,
  step: 3,
  auditor: '-',
  items,
});

const history = [
  run('1', '2026-10-15T10:00:00', [
    item('a', 10, 8, 'rusak'),
    item('b', 5, 5),
    item('c', 3, 4, 'salah_hitung'),
  ]),
  run('2', '2026-10-18T09:00:00', [item('a', 8, 7, 'rusak')]),
  run('3', '2026-09-01T09:00:00', [item('z', 1, 0, 'hilang')]),
];

describe('summarizeOpnames', () => {
  const s = summarizeOpnames(
    history,
    new Date('2026-10-13T00:00:00'),
    new Date('2026-10-19T23:59:59'),
  );

  it('hanya memakai opname dalam rentang', () => {
    expect(s.runs.map((r) => r.id)).toEqual(['1', '2']);
  });

  it('menghitung angka utama', () => {
    expect(s).toMatchObject({
      counted: 4,
      diffs: 3,
      minusCount: 2,
      plusCount: 1,
      minus: -3000,
      plus: 1000,
      net: -2000,
      accuracy: 25,
    });
  });

  it('mengisi ember harian', () => {
    expect(s.buckets).toHaveLength(7);
    expect(s.buckets[2]).toMatchObject({ minus: -2000, plus: 1000, sessions: 1 });
    expect(s.buckets[5]).toMatchObject({ minus: -1000, sessions: 1 });
  });

  it('mengurutkan produk dan alasan', () => {
    expect(s.top.map((t) => [t.productId, t.value])).toEqual([
      ['a', -3000],
      ['c', 1000],
    ]);
    expect(s.reasons.map((r) => [r.code, r.count])).toEqual([
      ['rusak', 2],
      ['salah_hitung', 1],
    ]);
  });
});

describe('lastOpnamedAt', () => {
  it('mengambil tanggal terbaru per produk', () => {
    expect(lastOpnamedAt(history).get('a')).toEqual(new Date('2026-10-18T09:00:00'));
  });
});
