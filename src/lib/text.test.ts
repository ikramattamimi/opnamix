import { describe, expect, it } from 'vitest';
import { closestMatch, levenshtein } from './text';

describe('levenshtein', () => {
  it('menghitung jarak edit', () => {
    expect(levenshtein('paracetamol', 'paracetamol')).toBe(0);
    expect(levenshtein('paracetamol', 'parasetamol')).toBe(1);
    expect(levenshtein('', 'abc')).toBe(3);
  });
});

describe('closestMatch', () => {
  it('menemukan kemungkinan salah ketik, abaikan yang sama persis', () => {
    expect(closestMatch('Parasetamol', ['Paracetamol', 'Ibuprofen'])).toBe('Paracetamol');
    expect(closestMatch('Paracetamol', ['Paracetamol'])).toBeNull();
    expect(closestMatch('Vitamin', ['Paracetamol'])).toBeNull();
  });
});
