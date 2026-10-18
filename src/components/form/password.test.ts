import { describe, expect, it } from 'vitest';
import { generatePassword } from './password';

describe('generatePassword', () => {
  it('panjang sesuai dan tanpa karakter yang mirip', () => {
    const pw = generatePassword(12);
    expect(pw).toHaveLength(12);
    expect(pw).not.toMatch(/[lIO01]/);
  });
});
