import { describe, expect, it } from 'vitest';
import {
  formatDateForDisplay,
  formatDateTimeForDisplay,
  rp,
  rpShort,
  rpSigned,
  signed,
  agoShort,
  dayLabel,
  initials,
} from './format';

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

describe('format angka', () => {
  it('rp membulatkan dan memakai titik ribuan', () => {
    expect(rp(12500.4)).toBe('Rp 12.500');
  });
  it('rpShort meringkas jutaan', () => {
    expect(rpShort(1_250_000)).toBe('Rp 1,3 jt');
    expect(rpShort(950_000)).toBe('Rp 950.000');
  });
  it('rpSigned dan signed memberi tanda', () => {
    expect(rpSigned(3000)).toBe('+Rp 3.000');
    expect(rpSigned(-3000)).toBe('−Rp 3.000');
    expect(rpSigned(0)).toBe('Rp 0');
    expect(signed(-12)).toBe('−12');
  });
});

describe('format waktu', () => {
  const now = new Date(2026, 9, 18, 11, 40);
  it('agoShort', () => {
    expect(agoShort(new Date(2026, 9, 18, 11, 35), now)).toBe('5 mnt lalu');
    expect(agoShort(new Date(2026, 9, 18, 8, 40), now)).toBe('3 jam lalu');
    expect(agoShort(new Date(2026, 9, 16, 11, 40), now)).toBe('2 hari lalu');
  });
  it('dayLabel', () => {
    expect(dayLabel(new Date(2026, 9, 18, 8), now)).toBe('Hari ini · Minggu, 18 Oktober');
    expect(dayLabel(new Date(2026, 9, 17, 8), now)).toBe('Kemarin · Sabtu, 17 Oktober');
    expect(dayLabel(new Date(2025, 0, 2), now)).toBe('Kamis, 2 Januari 2025');
  });
});

describe('initials', () => {
  it('dua huruf awal, cadangan "?"', () => {
    expect(initials('Rina Kartika')).toBe('RK');
    expect(initials('budi')).toBe('B');
    expect(initials('  ')).toBe('?');
  });
});
