import { describe, expect, it } from 'vitest';
import { clamp, formatThousands, parseDigits } from './number';

describe('angka isian', () => {
  it('parseDigits mengambil digit saja', () => {
    expect(parseDigits('Rp 12.500')).toBe(12500);
    expect(parseDigits('')).toBeNull();
    expect(parseDigits('abc')).toBeNull();
    expect(parseDigits('0')).toBe(0);
  });
  it('formatThousands memakai titik ribuan', () => {
    expect(formatThousands(1250000)).toBe('1.250.000');
  });
  it('clamp', () => {
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(-1, 0, 10)).toBe(0);
  });
});
