import { Category, type Ingredient, type Product } from './types';

// Aturan nama produk.
// - Obat satu zat: nama = zat + kekuatan ("Paracetamol 500 mg").
// - Obat 2+ zat: nama = merek + sediaan + isi ("OBH Combi Sirup 100 ml");
//   tanpa merek memakai nama yang sudah ada atau daftar zat.
// - Kategori lain: nama diketik langsung.
// Merek ditampilkan terpisah (BrandTag); di teks biasa ditambahkan dalam kurung.

const clean = (value?: string | null) => value?.trim() || '';

export const ingredientLabel = (i: Ingredient) =>
  [clean(i.name), clean(i.strength)].filter(Boolean).join(' ');

export const ingredientSummary = (ingredients: readonly Ingredient[]) =>
  ingredients.map(ingredientLabel).filter(Boolean).join(', ');

export const isCombination = (p: Pick<Product, 'ingredients'>) => (p.ingredients?.length ?? 0) > 1;

// Pecah teks kandungan: "Paracetamol 500 mg, Kafein 50 mg" → dua zat.
// Bagian yang diawali angka dianggap kekuatan.
export function parseIngredients(text: string): Ingredient[] {
  return text
    .split(/[,;\n]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const match = part.match(/^(.*?)\s+(\d.*)$/);
      return match
        ? { name: match[1].trim(), strength: match[2].trim() }
        : { name: part, strength: '' };
    });
}

type NameSource = Partial<
  Pick<Product, 'name' | 'brand' | 'category' | 'ingredients' | 'dosageForm' | 'packageSize'>
>;

// Nama yang disimpan ke kolom nama
export function getProductDisplayName(product: NameSource): string {
  const name = clean(product.name);
  if (product.category !== Category.Obat) return name;

  const ingredients = (product.ingredients ?? []).filter((i) => clean(i.name));
  if (ingredients.length === 1) return ingredientLabel(ingredients[0]);
  if (ingredients.length > 1) {
    const brand = clean(product.brand);
    if (brand) {
      return [brand, clean(product.dosageForm), clean(product.packageSize)]
        .filter(Boolean)
        .join(' ');
    }
    return name || ingredients.map((i) => clean(i.name)).join(', ');
  }
  return name;
}

// Teks satu baris untuk tabel/laporan: nama + (merek) bila merek belum ada di nama
export const withBrand = (name: string, brand?: string | null) => {
  const b = clean(brand);
  return b && !name.toLocaleLowerCase('id-ID').includes(b.toLocaleLowerCase('id-ID'))
    ? `${name} (${b})`
    : name;
};

export const getProductDisplayNameFromDb = (
  product?: {
    nama?: string | null;
    jenis?: string | null;
    merek?: string | null;
    kandungan?: string | null;
  } | null,
): string => {
  if (!product) return '';
  // Data lama tanpa nama: bentuk dari merek dan kandungan
  const name =
    clean(product.nama) ||
    [clean(product.merek), clean(product.kandungan)].filter(Boolean).join(' - ');
  return name ? withBrand(name, product.merek) : '';
};

export const getDisplayNameFromMasterObat = (
  item?: Parameters<typeof getProductDisplayNameFromDb>[0],
): string => getProductDisplayNameFromDb(item) || 'Unknown';
