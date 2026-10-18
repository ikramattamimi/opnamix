import {
  Bandage,
  BriefcaseMedical,
  HeartPulse,
  Stethoscope,
  Syringe,
  TestTube,
  type LucideIcon,
} from 'lucide-react';
import type { Tone } from '@/components/data/ToneIcon';
import type { Service } from './types';

// Ikon dan warna kategori jasa. Kategori diatur pengguna, jadi dicocokkan dari
// kata di namanya; yang tidak dikenali memakai ikon umum.

export interface ServiceCategoryMeta {
  icon: LucideIcon;
  tone: Tone;
}

const RULES: { match: RegExp; meta: ServiceCategoryMeta }[] = [
  { match: /konsul|kontrol/i, meta: { icon: Stethoscope, tone: 'obat' } },
  { match: /tindakan|luka|rawat/i, meta: { icon: Bandage, tone: 'alkes' } },
  { match: /lab|tes|darah|urin/i, meta: { icon: TestTube, tone: 'imun' } },
  { match: /fisik|vital|ekg/i, meta: { icon: HeartPulse, tone: 'bad' } },
  { match: /imunisasi|vaksin|suntik|injeksi/i, meta: { icon: Syringe, tone: 'bhp' } },
];

const FALLBACK: ServiceCategoryMeta = { icon: BriefcaseMedical, tone: 'neutral' };

export const serviceCategoryMeta = (name?: string | null): ServiceCategoryMeta =>
  (name && RULES.find((r) => r.match.test(name))?.meta) || FALLBACK;

export const NO_CATEGORY = 'Tanpa kategori';

export function serviceMatches(s: Pick<Service, 'name' | 'code'>, query: string): boolean {
  const q = query.trim().toLocaleLowerCase('id-ID');
  if (!q) return true;
  const haystack = `${s.name} ${s.code}`.toLocaleLowerCase('id-ID');
  return q.split(/\s+/).every((word) => haystack.includes(word));
}
