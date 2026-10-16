import { supabase } from '@/lib/supabaseClient';
import { Service, ServiceCategoryType, PaginationParams, PaginatedResponse } from '@/types';
import { mapServiceFromDB, mapServiceCategoryFromDB } from './mappers';

// Kategori jasa opsional: '' dari pilihan "Pilih Kategori" disimpan sebagai null.
// undefined tetap undefined agar kolomnya tidak ikut diubah saat update.
const toServiceCategoryId = (categoryId?: string) =>
  categoryId === undefined ? undefined : categoryId ? parseInt(categoryId) : null;

const generateServiceCategoryCodeBase = (name: string) =>
  name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
    .slice(0, 20) || 'KATEGORI';

const generateUniqueServiceCategoryCode = async (name: string) => {
  const baseCode = generateServiceCategoryCodeBase(name);

  const { data, error } = await supabase.from('service_categories').select('code');

  if (error) throw error;

  const existingCodes = new Set((data || []).map((item) => item.code));
  if (!existingCodes.has(baseCode)) {
    return baseCode;
  }

  let suffix = 2;
  let candidate = `${baseCode}_${suffix}`;
  while (existingCodes.has(candidate)) {
    suffix += 1;
    candidate = `${baseCode}_${suffix}`;
  }

  return candidate;
};

export const servicesApi = {
  // SERVICES
  getServices: async (params?: PaginationParams): Promise<PaginatedResponse<Service>> => {
    const { page = 1, perPage = 10, search = '' } = params || {};
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from('master_jasa')
      .select(
        `
        *,
        service_categories(name)
      `,
        { count: 'exact' },
      )
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('nama');

    if (search) {
      query = query.or(`nama.ilike.%${search}%,kode.ilike.%${search}%`);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) throw error;

    return {
      data: data.map(mapServiceFromDB),
      total: count || 0,
      page,
      perPage,
      totalPages: Math.ceil((count || 0) / perPage),
    };
  },

  // SERVICE CATEGORIES
  getServiceCategories: async (): Promise<ServiceCategoryType[]> => {
    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    return (data || []).map(mapServiceCategoryFromDB);
  },

  createServiceCategory: async (category: {
    name: string;
    description?: string;
  }): Promise<ServiceCategoryType> => {
    const generatedCode = await generateUniqueServiceCategoryCode(category.name);

    const { data, error } = await supabase
      .from('service_categories')
      .insert({
        name: category.name.trim(),
        code: generatedCode,
        description: category.description?.trim() || null,
        is_active: true,
      })
      .select('*')
      .single();

    if (error) throw error;

    return mapServiceCategoryFromDB(data);
  },

  createService: async (service: Partial<Service>) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('master_jasa')
      .insert({
        kode: service.code!,
        nama: service.name!,
        harga: service.price,
        category_id: toServiceCategoryId(service.categoryId),
        is_active: true,
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return mapServiceFromDB(data);
  },

  updateService: async (id: string, service: Partial<Service>) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('master_jasa')
      .update({
        kode: service.code,
        nama: service.name,
        harga: service.price,
        category_id: toServiceCategoryId(service.categoryId),
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) throw error;
    return mapServiceFromDB(data);
  },

  deleteService: async (id: string) => {
    const { error } = await supabase
      .from('master_jasa')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', parseInt(id));

    if (error) throw error;
  },
};
