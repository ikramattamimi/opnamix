import { Product, Unit, Category } from '@/types';
import type { Tables } from '@/lib/database.types';
import { getProductDisplayNameFromDb } from './productDisplay';

// Map DB types to Frontend types
export const mapProductFromDB = (item: Tables<'master_obat'>): Product => ({
  id: item.id.toString(),
  code: item.kode,
  name: getProductDisplayNameFromDb(item),
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
});
