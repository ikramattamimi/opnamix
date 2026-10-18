import { Product, Unit, Category, type Ingredient } from './types';
import type { Tables } from '@/lib/database.types';
import { getProductDisplayNameFromDb, parseIngredients } from './productDisplay';

type IngredientRow = Pick<Tables<'product_ingredients'>, 'nama_zat' | 'kekuatan' | 'urutan'>;
export type ProductRow = Tables<'master_obat'> & { product_ingredients?: IngredientRow[] | null };

const mapIngredients = (item: ProductRow): Ingredient[] => {
  const rows = item.product_ingredients ?? [];
  if (rows.length) {
    return [...rows]
      .sort((a, b) => a.urutan - b.urutan)
      .map((r) => ({ name: r.nama_zat, strength: r.kekuatan ?? '' }));
  }
  // Data lama yang belum punya baris kandungan
  return item.kandungan ? parseIngredients(item.kandungan) : [];
};

// Map DB types to Frontend types
export const mapProductFromDB = (item: ProductRow): Product => ({
  id: item.id.toString(),
  code: item.kode,
  name: item.nama?.trim() || getProductDisplayNameFromDb(item),
  category: (item.jenis as Category) || Category.Obat,
  unit: (item.satuan as Unit) || Unit.Strip,
  purchasePrice: 0,
  sellingPrice: item.harga || 0,
  stock: item.qty || 0,
  minStock: item.buffer_stok || 0,
  description: '',
  color: 'bg-primary',
  brand: item.merek || '',
  composition: item.kandungan || '',
  dosageForm: item.sediaan || '',
  packageSize: item.isi_kemasan || '',
  ingredients: (item.jenis as Category) === Category.Obat ? mapIngredients(item) : [],
});
