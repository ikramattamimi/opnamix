import { describe, expect, it } from 'vitest';
import { cleanBatch, formatExpiry, isExpiringSoon, monthToExpiryDate } from './expiry';

const NOW = new Date(2026, 9, 18); // 18 Okt 2026

describe('monthToExpiryDate', () => {
  it('mengisi hari terakhir bulan', () => {
    expect(monthToExpiryDate('2027-03')).toBe('2027-03-31');
    expect(monthToExpiryDate('2028-02')).toBe('2028-02-29');
  });
  it('kosong atau tidak valid menjadi string kosong', () => {
    expect(monthToExpiryDate('')).toBe('');
    expect(monthToExpiryDate('2027-13')).toBe('');
  });
});

describe('isExpiringSoon', () => {
  it('kurang dari 6 bulan lagi', () => {
    expect(isExpiringSoon('2027-03-31', NOW)).toBe(true);
    expect(isExpiringSoon('2027-03', NOW)).toBe(true);
  });
  it('sudah lewat juga dianggap dekat', () => {
    expect(isExpiringSoon('2026-01-01', NOW)).toBe(true);
  });
  it('6 bulan atau lebih tidak ditandai', () => {
    expect(isExpiringSoon('2027-04-18', NOW)).toBe(false);
    expect(isExpiringSoon('2028-01', NOW)).toBe(false);
  });
  it('tanpa tanggal tidak ditandai', () => {
    expect(isExpiringSoon('-', NOW)).toBe(false);
    expect(isExpiringSoon(null, NOW)).toBe(false);
  });
});

describe('formatExpiry', () => {
  it('bulan dan tahun', () => {
    expect(formatExpiry('2027-03-31')).toBe('Mar 2027');
    expect(formatExpiry('-')).toBe('-');
  });
});

describe('cleanBatch', () => {
  it('membuang isian lama', () => {
    expect(cleanBatch('EXP: 2027-01-01')).toBe('');
    expect(cleanBatch('-')).toBe('');
    expect(cleanBatch(' B2301 ')).toBe('B2301');
  });
});
