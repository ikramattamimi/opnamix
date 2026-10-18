// Kelas warna per kategori produk, dipakai CategoryIcon, BrandTag, dan Avatar.
export type CategoryTone = 'obat' | 'bhp' | 'imun' | 'alkes' | 'neutral';

export const CATEGORY_TONE_CLASS: Record<CategoryTone, string> = {
  obat: 'bg-cat-obat/15 text-cat-obat',
  bhp: 'bg-cat-bhp/15 text-cat-bhp',
  imun: 'bg-cat-imun/15 text-cat-imun',
  alkes: 'bg-cat-alkes/15 text-cat-alkes',
  neutral: 'bg-surface-2 text-muted-foreground',
};
