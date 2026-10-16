import { Category, Product } from '../types';

type ProductNameSource = Partial<Pick<Product, 'name' | 'brand' | 'composition' | 'category'>>;

const normalizePart = (value?: string) => value?.trim() || '';

export const getProductDisplayName = (product: ProductNameSource): string => {
  const name = normalizePart(product.name);
  const brand = normalizePart(product.brand);
  const composition = normalizePart(product.composition);
  const combinedName = brand && composition
    ? `${brand} - ${composition}`
    : [brand, composition].filter(Boolean).join(' ').trim();

  if (product.category && product.category !== Category.Obat) {
    return name || combinedName;
  }

  return combinedName || name;
};

export const getProductDisplayNameFromDb = (product?: {
  nama?: string | null;
  jenis?: string | null;
  merek?: string | null;
  kandungan?: string | null;
} | null): string => {
  if (!product) return '';

  return getProductDisplayName({
    name: product.nama || '',
    category: (product.jenis as Category) || undefined,
    brand: product.merek || '',
    composition: product.kandungan || '',
  });
};
