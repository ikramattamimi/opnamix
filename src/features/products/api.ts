import { supabase } from '@/lib/supabaseClient';
import { Category, Product } from './types';
import { PaginationParams, PaginatedResponse } from '@/types/pagination';
import { getProductDisplayName } from './productDisplay';
import type { ProductRow } from './mappers';
import { mapProductFromDB } from './mappers';

const PRODUCT_SELECT = '*, product_ingredients(nama_zat, kekuatan, urutan)';
// Batas baris per permintaan PostgREST
const CHUNK = 1000;

// Kolom master_obat dari data form. Stok hanya ditulis saat membuat produk;
// setelah itu stok berubah lewat Stok Masuk, Stok Keluar, atau Opname.
const toRow = (product: Partial<Product>) => ({
  nama: getProductDisplayName(product),
  jenis: product.category,
  satuan: product.unit,
  harga: product.sellingPrice,
  harga_beli: product.purchasePrice || null,
  buffer_stok: product.minStock,
  merek: product.brand?.trim() || null,
  sediaan: product.category === Category.Obat ? product.dosageForm?.trim() || null : null,
  isi_kemasan: product.category === Category.Obat ? product.packageSize?.trim() || null : null,
});

const saveIngredients = async (productId: number, product: Partial<Product>) => {
  const items =
    product.category === Category.Obat
      ? (product.ingredients ?? [])
          .filter((i) => i.name.trim())
          .map((i) => ({ nama_zat: i.name.trim(), kekuatan: i.strength.trim() || null }))
      : [];
  const { error } = await supabase.rpc('save_product_ingredients', {
    p_product_id: productId,
    p_items: items,
  });
  if (error) throw error;
};

export const productsApi = {
  // Semua produk aktif beserta kandungannya (grid Data Produk menyaring dan
  // mengurutkan di browser)
  getAllProducts: async (): Promise<Product[]> => {
    const rows: ProductRow[] = [];
    for (let from = 0; ; from += CHUNK) {
      const { data, error } = await supabase
        .from('master_obat')
        .select(PRODUCT_SELECT)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('nama')
        .range(from, from + CHUNK - 1);
      if (error) throw error;
      rows.push(...(data as ProductRow[]));
      if (data.length < CHUNK) break;
    }
    return rows.map(mapProductFromDB);
  },

  // PRODUCTS
  getProducts: async (params?: PaginationParams): Promise<PaginatedResponse<Product>> => {
    const { page = 1, perPage = 10, search = '' } = params || {};
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from('master_obat')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('nama');

    if (search) {
      query = query.or(
        `nama.ilike.%${search}%,kode.ilike.%${search}%,merek.ilike.%${search}%,kandungan.ilike.%${search}%`,
      );
    }

    const { data, error, count } = await query.range(from, to);

    if (error) throw error;

    return {
      data: data.map(mapProductFromDB),
      total: count || 0,
      page,
      perPage,
      totalPages: Math.ceil((count || 0) / perPage),
    };
  },

  createProduct: async (product: Partial<Product>) => {
    const { data, error } = await supabase
      .from('master_obat')
      .insert({ ...toRow(product), kode: product.code!, qty: product.stock, is_active: true })
      .select()
      .single();

    if (error) throw error;
    await saveIngredients(data.id, product);
    return mapProductFromDB(data);
  },

  updateProduct: async (id: string, product: Partial<Product>) => {
    const { data, error } = await supabase
      .from('master_obat')
      .update({ ...toRow(product), kode: product.code })
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) throw error;
    await saveIngredients(data.id, product);
    return mapProductFromDB(data);
  },

  deleteProduct: async (id: string) => {
    // Soft delete
    const { error } = await supabase
      .from('master_obat')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', parseInt(id));

    if (error) throw error;
  },
};
