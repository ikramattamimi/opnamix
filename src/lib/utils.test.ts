import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('ukuran teks kustom tidak membuang warna teks', () => {
    expect(cn('text-meta', 'text-grad-ink')).toBe('text-meta text-grad-ink');
    expect(cn('text-2xs text-ok')).toBe('text-2xs text-ok');
  });

  it('kelas yang bertentangan tetap digabung', () => {
    expect(cn('text-meta', 'text-sm')).toBe('text-sm');
    expect(cn('rounded-lg', 'rounded-card')).toBe('rounded-card');
    expect(cn('w-rail', 'w-sbw')).toBe('w-sbw');
  });
});
