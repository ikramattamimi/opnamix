import { describe, expect, it } from 'vitest';
import { bucketIndex, bucketUnit, timeBuckets } from './timeBuckets';

const d = (s: string) => new Date(`${s}T00:00:00`);
const e = (s: string) => new Date(`${s}T23:59:59.999`);

describe('bucketUnit', () => {
  it('memilih satuan dari panjang rentang', () => {
    expect(bucketUnit(d('2026-10-19'), e('2026-10-19'))).toBe('hour');
    expect(bucketUnit(d('2026-10-13'), e('2026-10-19'))).toBe('day');
    expect(bucketUnit(d('2026-09-20'), e('2026-10-19'))).toBe('week');
    expect(bucketUnit(d('2026-07-21'), e('2026-10-19'))).toBe('month');
  });
});

describe('timeBuckets', () => {
  it('membagi 7 hari menjadi 7 ember harian', () => {
    const b = timeBuckets(d('2026-10-13'), e('2026-10-19'));
    expect(b).toHaveLength(7);
    expect(b[0].label).toBe('13 Okt');
    expect(b[6].end.getTime()).toBe(e('2026-10-19').getTime());
  });

  it('ember bulanan dipotong pada awal rentang', () => {
    const b = timeBuckets(d('2026-07-21'), e('2026-10-19'));
    expect(b.map((x) => x.label)).toEqual(['Jul', 'Agu', 'Sep', 'Okt']);
    expect(b[0].start.getDate()).toBe(21);
  });

  it('menemukan ember sebuah tanggal', () => {
    const b = timeBuckets(d('2026-10-13'), e('2026-10-19'));
    expect(bucketIndex(b, new Date('2026-10-15T10:00:00'))).toBe(2);
    expect(bucketIndex(b, new Date('2026-11-01T10:00:00'))).toBe(-1);
  });
});
