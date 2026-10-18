import { describe, expect, it } from 'vitest';
import { BriefcaseMedical, Stethoscope, TestTube } from 'lucide-react';
import { serviceCategoryMeta, serviceMatches } from './catalog';

describe('serviceCategoryMeta', () => {
  it('mencocokkan ikon dari nama kategori, dengan ikon umum untuk yang lain', () => {
    expect(serviceCategoryMeta('Konsultasi').icon).toBe(Stethoscope);
    expect(serviceCategoryMeta('Pemeriksaan Lab').icon).toBe(TestTube);
    expect(serviceCategoryMeta('Lain-lain').icon).toBe(BriefcaseMedical);
    expect(serviceCategoryMeta(undefined).tone).toBe('neutral');
  });
});

describe('serviceMatches', () => {
  it('mencari di nama dan kode', () => {
    const s = { name: 'Rawat luka kecil', code: 'RAWA-123456' };
    expect(serviceMatches(s, 'luka')).toBe(true);
    expect(serviceMatches(s, 'rawa-123')).toBe(true);
    expect(serviceMatches(s, 'injeksi')).toBe(false);
  });
});
