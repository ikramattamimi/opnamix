import { describe, expect, it } from 'vitest';
import {
  applyDate,
  applyPeriod,
  createInitialDateRange,
  getPeriodRange,
  toDateInputValue,
} from './reportPeriod';

// Hasil dibandingkan lewat toDateInputValue supaya test tidak bergantung zona waktu mesin.
const today = new Date(2026, 9, 17, 12, 0, 0);

describe('getPeriodRange', () => {
  it('daily: hari ini sampai hari ini', () => {
    expect(getPeriodRange('daily', today)).toEqual({
      start: toDateInputValue(today),
      end: toDateInputValue(today),
    });
  });

  it('weekly: 7 hari ke belakang sampai hari ini', () => {
    expect(getPeriodRange('weekly', today)).toEqual({
      start: toDateInputValue(new Date(2026, 9, 10, 12, 0, 0)),
      end: toDateInputValue(today),
    });
  });

  it('monthly: awal sampai akhir bulan berjalan', () => {
    expect(getPeriodRange('monthly', today)).toEqual({
      start: toDateInputValue(new Date(2026, 9, 1)),
      end: toDateInputValue(new Date(2026, 9, 31)),
    });
  });

  it('yearly: 1 Januari sampai 31 Desember', () => {
    expect(getPeriodRange('yearly', today)).toEqual({
      start: toDateInputValue(new Date(2026, 0, 1)),
      end: toDateInputValue(new Date(2026, 11, 31)),
    });
  });

  it('custom tidak mengubah tanggal', () => {
    expect(getPeriodRange('custom', today)).toBeNull();
  });

  it('tidak mengubah objek tanggal yang dioper', () => {
    const date = new Date(2026, 9, 17, 12, 0, 0);
    getPeriodRange('weekly', date);
    expect(date.getDate()).toBe(17);
  });
});

describe('createInitialDateRange', () => {
  it('mulai dengan periode hari ini', () => {
    expect(createInitialDateRange(today)).toEqual({
      period: 'daily',
      startDate: toDateInputValue(today),
      endDate: toDateInputValue(today),
    });
  });
});

describe('applyPeriod', () => {
  const current = { period: 'custom' as const, startDate: '2026-01-05', endDate: '2026-02-01' };

  it('mengganti periode sekaligus tanggalnya', () => {
    expect(applyPeriod(current, 'yearly', today)).toEqual({
      period: 'yearly',
      startDate: toDateInputValue(new Date(2026, 0, 1)),
      endDate: toDateInputValue(new Date(2026, 11, 31)),
    });
  });

  it('custom mempertahankan tanggal yang ada', () => {
    const daily = createInitialDateRange(today);
    expect(applyPeriod(daily, 'custom', today)).toEqual({ ...daily, period: 'custom' });
  });
});

describe('applyDate', () => {
  it('mengubah satu tanggal dan memindah periode ke custom', () => {
    const daily = createInitialDateRange(today);
    expect(applyDate(daily, 'startDate', '2026-10-01')).toEqual({
      period: 'custom',
      startDate: '2026-10-01',
      endDate: daily.endDate,
    });
  });
});
