import { supabase } from '@/lib/supabaseClient';
import { Product, PaginationParams, PaginatedResponse } from '@/types';
import { getProductDisplayName } from './productDisplay';
import { mapProductFromDB } from './mappers';

export const productsApi = {
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
    const normalizedName = getProductDisplayName(product);

    const { data, error } = await supabase
      .from('master_obat')
      .insert({
        kode: product.code!,
        nama: normalizedName,
        jenis: product.category,
        satuan: product.unit,
        harga: product.sellingPrice,
        qty: product.stock,
        buffer_stok: product.minStock,
        is_active: true,
        merek: product.brand,
        kandungan: product.composition,
      })
      .select()
      .single();

    if (error) throw error;
    return mapProductFromDB(data);
  },

  updateProduct: async (id: string, product: Partial<Product>) => {
    const normalizedName = getProductDisplayName(product);

    const { data, error } = await supabase
      .from('master_obat')
      .update({
        kode: product.code,
        nama: normalizedName,
        jenis: product.category,
        satuan: product.unit,
        harga: product.sellingPrice,
        qty: product.stock,
        buffer_stok: product.minStock,
        merek: product.brand,
        kandungan: product.composition,
      })
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) throw error;
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

  // Fetch distinct supplier names from past stock-in transactions
  getDistinctSuppliers: async () => {
    const { data, error } = await supabase
      .from('transaksi')
      .select('nama_pasien')
      .eq('tipe', 'masuk')
      .not('nama_pasien', 'is', null);
    if (error) throw error;
    const unique = [...new Set((data || []).map((d) => d.nama_pasien).filter(Boolean))];
    return unique as string[];
  },
};
