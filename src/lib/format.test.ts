import { describe, expect, it } from 'vitest';
import { formatDateForDisplay, formatDateTimeForDisplay } from './format';

describe('formatDateForDisplay', () => {
  it('kosong atau tidak valid menjadi "-"', () => {
    expect(formatDateForDisplay()).toBe('-');
    expect(formatDateForDisplay('')).toBe('-');
    expect(formatDateForDisplay('bukan-tanggal')).toBe('-');
  });

  it('memakai format id-ID default', () => {
    const expected = new Date('2026-10-05').toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    expect(formatDateForDisplay('2026-10-05')).toBe(expected);
  });

  it('opsi format bisa diganti', () => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric' };
    expect(formatDateForDisplay('2026-10-05', options)).toBe(
      new Date('2026-10-05').toLocaleDateString('id-ID', options),
    );
  });
});

describe('formatDateTimeForDisplay', () => {
  it('kosong menjadi "-", tidak valid ditampilkan apa adanya', () => {
    expect(formatDateTimeForDisplay()).toBe('-');
    expect(formatDateTimeForDisplay('bukan-tanggal')).toBe('bukan-tanggal');
  });

  it('menyertakan jam dan menit', () => {
    const value = '2026-10-05T14:30:00';
    expect(formatDateTimeForDisplay(value)).toBe(
      new Date(value).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    );
  });
});
