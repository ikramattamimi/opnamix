import { describe, expect, it } from 'vitest';
import { isoDay, resolveDateRange } from './dateRange';

const now = new Date(2026, 9, 18, 11, 40);
const none = { from: '', to: '' };

describe('resolveDateRange', () => {
  it('preset hari', () => {
    const r = resolveDateRange('7', none, now);
    expect(isoDay(r.from)).toBe('2026-10-12');
    expect(isoDay(r.to)).toBe('2026-10-18');
    expect(r.label).toBe('7 hari terakhir');
  });
  it('hari ini dan bulan ini', () => {
    expect(resolveDateRange('today', none, now).label).toBe('Hari ini');
    const m = resolveDateRange('month', none, now);
    expect(isoDay(m.from)).toBe('2026-10-01');
    expect(m.label).toBe('Oktober 2026');
  });
  it('kustom ditukar bila terbalik', () => {
    const r = resolveDateRange('custom', { from: '2026-10-10', to: '2026-10-01' }, now);
    expect(isoDay(r.from)).toBe('2026-10-01');
    expect(isoDay(r.to)).toBe('2026-10-10');
    expect(r.label).toBe('1 Okt – 10 Okt 2026');
  });
});
