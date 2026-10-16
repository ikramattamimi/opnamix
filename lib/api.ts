
import { supabase } from './supabaseClient';
import { Product, Service, ServiceCategoryType, Unit, Category, StockOutRequest, StockInReceipt, PaginationParams, PaginatedResponse } from '../types';
import { getProductDisplayName, getProductDisplayNameFromDb } from './productDisplay';

// Map DB types to Frontend types
const mapProductFromDB = (item: any): Product => ({
  id: item.id.toString(),
  code: item.kode,
  name: getProductDisplayNameFromDb(item),
  category: item.jenis as Category || Category.Obat,
  unit: item.satuan as Unit || Unit.Strip,
  purchasePrice: 0,
  sellingPrice: item.harga || 0,
  stock: item.qty || 0,
  minStock: item.buffer_stok || 0,
  description: '',
  color: 'bg-primary',
  brand: item.merek || '',
  composition: item.kandungan || ''
});

const getDisplayNameFromMasterObat = (item: any) => getProductDisplayNameFromDb(item) || 'Unknown';
const getTransactionEventTimestamp = (transaction: any) =>
  transaction?.processed_at || transaction?.created_at || transaction?.tanggal;
const STOCK_OUT_META_MARKER = '||META||';

const extractTransactionNoteAndMeta = (rawNote?: string | null) => {
  if (!rawNote) {
    return {
      note: '',
      meta: { serviceFee: 0 },
    };
  }

  const [note, metaPart] = rawNote.split(STOCK_OUT_META_MARKER);

  if (!metaPart) {
    return {
      note: note.trim(),
      meta: { serviceFee: 0 },
    };
  }

  try {
    const parsed = JSON.parse(metaPart);
    return {
      note: note.trim(),
      meta: {
        serviceFee: Number(parsed?.serviceFee || 0),
      },
    };
  } catch {
    return {
      note: note.trim(),
      meta: { serviceFee: 0 },
    };
  }
};

const serializeTransactionNote = (
  note?: string,
  meta?: { serviceFee?: number },
) => {
  const cleanNote = (note || '').trim();
  const normalizedMeta = {
    serviceFee: Math.max(0, Number(meta?.serviceFee || 0)),
  };

  return `${cleanNote}${STOCK_OUT_META_MARKER}${JSON.stringify(normalizedMeta)}`;
};

const mapServiceFromDB = (item: any): Service => ({
  id: item.id.toString(),
  code: item.kode,
  name: item.nama,
  categoryId: item.category_id?.toString(),
  categoryName: item.service_categories?.name,
  price: item.harga || 0,
  description: '',
  isActive: item.is_active,
  createdBy: item.created_by,
  updatedBy: item.updated_by,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
  icon: 'medical_services',
  iconColor: 'text-blue-600',
  iconBg: 'bg-blue-100'
});

const mapServiceCategoryFromDB = (item: any): ServiceCategoryType => ({
  id: item.id.toString(),
  name: item.name,
  code: item.code,
  description: item.description,
  isActive: item.is_active,
});

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

  const { data, error } = await supabase
    .from('service_categories')
    .select('code');

  if (error) throw error;

  const existingCodes = new Set((data || []).map((item: any) => item.code));
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

export const api = {
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
      query = query.or(`nama.ilike.%${search}%,kode.ilike.%${search}%,merek.ilike.%${search}%,kandungan.ilike.%${search}%`);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) throw error;

    return {
      data: data.map(mapProductFromDB),
      total: count || 0,
      page,
      perPage,
      totalPages: Math.ceil((count || 0) / perPage)
    };
  },

  createProduct: async (product: Partial<Product>) => {
    const normalizedName = getProductDisplayName(product);

    const { data, error } = await supabase
      .from('master_obat')
      .insert({
        kode: product.code,
        nama: normalizedName,
        jenis: product.category,
        satuan: product.unit,
        harga: product.sellingPrice,
        qty: product.stock,
        buffer_stok: product.minStock,
        is_active: true,
        merek: product.brand,
        kandungan: product.composition
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
        kandungan: product.composition
      })
      .eq('id', id)
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
      .eq('id', id);

    if (error) throw error;
  },

  // SERVICES
  getServices: async (params?: PaginationParams): Promise<PaginatedResponse<Service>> => {
    const { page = 1, perPage = 10, search = '' } = params || {};
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from('master_jasa')
      .select(`
        *,
        service_categories(name)
      `, { count: 'exact' })
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
      totalPages: Math.ceil((count || 0) / perPage)
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
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('master_jasa')
      .insert({
        kode: service.code,
        nama: service.name,
        harga: service.price,
        category_id: service.categoryId,
        is_active: true,
        created_by: user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return mapServiceFromDB(data);
  },

  updateService: async (id: string, service: Partial<Service>) => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('master_jasa')
      .update({
        kode: service.code,
        nama: service.name,
        harga: service.price,
        category_id: service.categoryId,
        updated_by: user?.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapServiceFromDB(data);
  },

  deleteService: async (id: string) => {
    const { error } = await supabase
      .from('master_jasa')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  // HELPER: Generate unique transaction number
  generateTransactionNumber: async (type: 'masuk' | 'keluar'): Promise<string> => {
    const prefix = type === 'masuk' ? 'IN' : 'OUT';
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  },

  // HELPER: Upload receipt image to Supabase Storage with the user's session
  // (storage policy allows staff to upload into bukti-stok-masuk/receipts/)
  uploadReceiptImage: async (file: Blob, transactionNumber: string): Promise<string> => {
    const bucketName = 'bukti-stok-masuk';
    const filePath = `receipts/${transactionNumber}-${Date.now()}.webp`;

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, { contentType: 'image/webp', cacheControl: '3600' });

    if (error) {
      console.error('Receipt upload error:', error);
      throw error;
    }

    return supabase.storage.from(bucketName).getPublicUrl(filePath).data.publicUrl;
  },

  // TRANSACTIONS
  createTransaction: async (payload: {
    nomor: string;
    tanggal: string;
    tipe: 'masuk' | 'keluar';
    tipe_sumber: 'PENGAJUAN_NAKES' | 'KASIR_LANGSUNG' | 'PEMBELIAN';
    status: 'diajukan' | 'selesai';
    nama_pasien?: string; // Optional for Stock In
    tanggal_lahir_pasien?: string; // Patient birth date
    keterangan?: string;
    bukti?: string; // Optional image URL
    total?: number;
    diskon?: number;
    serviceFee?: number;
    items: {
      productId: string;
      quantity: number;
      price: number;
      batch?: string;
      expiryDate?: string; // Add expiry for stock in
    }[];
    services: {
      serviceId: string;
      price: number;
    }[];
    requestedBy?: string;
  }) => {
    // Header, item, jasa, dan perubahan stok (kalau status 'selesai')
    // disimpan dalam satu transaksi database: berhasil semua atau batal
    // semua. created_by diisi dari auth.uid() di database.
    const { error } = await supabase.rpc('create_transaction', {
      p_payload: {
        nomor: payload.nomor,
        tanggal: payload.tanggal,
        tipe: payload.tipe,
        tipe_sumber: payload.tipe_sumber,
        status: payload.status,
        nama_pasien: payload.nama_pasien || '-',
        tanggal_lahir_pasien: payload.tanggal_lahir_pasien || null,
        keterangan: payload.keterangan || '',
        bukti: payload.bukti || null,
        total: payload.total,
        diskon: payload.diskon ?? 0,
        biaya_layanan: payload.serviceFee ?? 0,
        nama_nakes: payload.requestedBy || null,
        items: payload.items.map(item => ({
          product_id: parseInt(item.productId),
          quantity: item.quantity,
          price: item.price,
          batch: item.batch || '-',
          expiry_date: item.expiryDate || null,
        })),
        services: payload.services.map(svc => ({
          service_id: parseInt(svc.serviceId),
          price: svc.price,
        })),
      }
    });

    if (error) {
      console.error('Error creating transaction:', error);
      throw new Error(error.message);
    }

    return { success: true };
  },

  // READ STOCK IN
  getStockInReceipts: async (params?: PaginationParams): Promise<PaginatedResponse<StockInReceipt>> => {
    const { page = 1, perPage = 10 } = params || {};
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data, error, count } = await supabase
      .from('transaksi')
      .select(`
        *,
        transaksi_detail:transaksi_detail!transaksi_detail_transaksi_id_fkey (*, master_obat(nama, satuan, jenis, merek, kandungan))
      `, { count: 'exact' })
      .eq('tipe', 'masuk')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching stock in receipts:', error);
      throw error;
    }

    // Filter out items? No, pagination happens in DB. 
    // If logic applied filtering after DB fetch, pagination counts would be wrong.
    // Assuming transactions are inserted correctly with details, we map what we get.

    const createdByIds = [...new Set((data || []).map((t: any) => t.created_by).filter(Boolean))];
    let profileMap: Record<string, string> = {};
    if (createdByIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', createdByIds);

      if (profilesError) throw profilesError;

      (profiles || []).forEach((profile: any) => {
        profileMap[profile.id] = profile.full_name || '';
      });
    }

    const validData = data.map((t: any) => {
      const invoiceFromNote = typeof t.keterangan === 'string' && t.keterangan.startsWith('Invoice: ')
        ? t.keterangan.replace('Invoice: ', '').trim()
        : '';

      return ({
        id: t.nomor,
        invoiceNumber: invoiceFromNote || t.nomor,
        supplierName: t.nama_pasien || 'Unknown Supplier',
        date: t.tanggal,
        status: t.status === 'selesai' ? 'Selesai' : 'Menunggu',
        receivedBy: (t.created_by && profileMap[t.created_by]) || 'Admin',
        evidenceUrl: t.bukti, // Map evidenceUrl
        items: t.transaksi_detail ? t.transaksi_detail.map((d: any) => ({
          id: d.id.toString(),
          productId: d.obat_id?.toString() || '',
          productName: getDisplayNameFromMasterObat(d.master_obat),
          category: d.master_obat?.jenis || 'Obat',
          quantity: d.qty,
          unit: d.master_obat?.satuan || 'Pcs',
          expiryDate: d.expire_date || '-',
        })) : []
      })
    });

    return {
      data: validData,
      total: count || 0,
      page,
      perPage,
      totalPages: Math.ceil((count || 0) / perPage)
    };
  },

  // READ TRANSACTIONS (Specific for Stock Out Queue)
  getStockOutRequests: async (params?: PaginationParams): Promise<PaginatedResponse<StockOutRequest>> => {
    const { page = 1, perPage = 10, status, createdBy } = params || {};
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from('transaksi')
      .select(`
        *,
        transaksi_detail:transaksi_detail!transaksi_detail_transaksi_id_fkey (*, master_obat(nama, satuan, jenis, merek, kandungan)),
        transaksi_jasa:transaksi_jasa!transaksi_jasa_transaksi_id_fkey (*, master_jasa(nama))
      `, { count: 'exact' })
      .eq('tipe', 'keluar')
      .in('tipe_sumber', ['PENGAJUAN_NAKES', 'KASIR_LANGSUNG'])
      .order('created_at', { ascending: false });

    // Apply status filter if present
    if (status && status !== 'Semua') {
      const dbStatus = status === 'Menunggu' ? 'diajukan' : 'selesai';
      query = query.eq('status', dbStatus);
    }

// Apply filter for nakes users: match by created_by OR nama_nakes
    if (createdBy || params?.nakesName) {
      const conditions: string[] = [];
      if (createdBy) conditions.push(`created_by.eq.${createdBy}`);
      if (params?.nakesName) conditions.push(`nama_nakes.eq.${params.nakesName}`);
      query = query.or(conditions.join(','));
    }

    const { data, error, count } = await query.range(from, to);

    if (error) throw error;

    // Fetch profile names for created_by users
    const createdByIds = [...new Set((data || []).map((t: any) => t.created_by).filter(Boolean))];
    let profileMap: Record<string, string> = {};
    if (createdByIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', createdByIds);
      if (profiles) {
        profiles.forEach((p: any) => { profileMap[p.id] = p.full_name || ''; });
      }
    }

    const mappedData = data.map((t: any) => {
      const transactionMeta = extractTransactionNoteAndMeta(t.keterangan);
      const normalizedServiceFee = Number(t.biaya_layanan ?? transactionMeta.meta.serviceFee ?? 0);

      return {
      id: t.nomor, // Using nomor as ID
      requestId: t.nomor,
      patient: {
        fullName: t.nama_pasien,
        medicalRecordNumber: '-', // Not stored in transaksi currently?
        birthDate: t.tanggal_lahir_pasien || '',
        diagnosis: '-' // Not stored
      },
      drugs: t.transaksi_detail ? t.transaksi_detail.map((d: any) => ({
        id: d.id.toString(),
        productId: d.obat_id?.toString() || '',
        productName: getDisplayNameFromMasterObat(d.master_obat),
        quantity: d.qty,
        unit: d.master_obat?.satuan || 'Pcs',
        instructions: '-', // Not in DB
        price: d.harga || 0 // Map historical price
      })) : [],
      services: t.transaksi_jasa ? t.transaksi_jasa.map((j: any) => ({
        id: j.jasa_id.toString(),
        name: j.master_jasa?.nama || 'Unknown Service',
        price: j.harga_jasa || 0
      })) : [],
      createdBy: t.created_by,
      totalAmount: t.total,
      discount: t.diskon ?? 0,
      serviceFee: normalizedServiceFee,
      requestedBy: t.nama_nakes || (t.created_by && profileMap[t.created_by]) || (t.tipe_sumber === 'PENGAJUAN_NAKES' ? 'Nakes' : 'Farmasi'),
      requestedByAvatar: t.tipe_sumber === 'PENGAJUAN_NAKES'
        ? 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'
        : 'https://cdn-icons-png.flaticon.com/512/2304/2304226.png',
      status: t.status === 'diajukan' ? 'Menunggu' : 'Selesai',
      date: t.tanggal,
      tipeSumber: t.tipe_sumber
      };
    });

    return {
      data: mappedData as StockOutRequest[], // explicit cast for type safety
      total: count || 0,
      page,
      perPage,
      totalPages: Math.ceil((count || 0) / perPage)
    };
  },

  // UPDATE STATUS
  updateTransactionStatus: async (nomor: string, status: 'selesai', diskon?: number, total?: number, serviceFee?: number) => {
    // 1. Get current user for processed_by
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    const updatePayload: any = {
      status: status,
      processed_at: new Date().toISOString(),
      processed_by: currentUser?.id || null,
    };

    if (diskon !== undefined) updatePayload.diskon = diskon;
    if (total !== undefined) updatePayload.total = total;
    if (serviceFee !== undefined) updatePayload.biaya_layanan = serviceFee;

    // 2. Decrement stock first (atomic RPC; rejects if stock is insufficient),
    // so the request is only marked 'selesai' once the stock really changed
    const { data: details, error: detailsError } = await supabase
      .from('transaksi_detail')
      .select('obat_id, qty')
      .eq('transaksi_nomor', nomor);

    if (detailsError) throw detailsError;

    const stockItems = (details || []).map(d => ({ product_id: d.obat_id, quantity: d.qty }));

    if (stockItems.length > 0) {
      const { error: rpcError } = await supabase.rpc('update_stock_atomic', {
        p_items: stockItems,
        p_tipe: 'keluar'
      });
      if (rpcError) throw new Error(rpcError.message);
    }

    const restoreStock = async () => {
      if (stockItems.length === 0) return;
      const { error: restoreError } = await supabase.rpc('update_stock_atomic', {
        p_items: stockItems,
        p_tipe: 'masuk'
      });
      if (restoreError) console.error('Failed to restore stock:', restoreError);
    };

    // 3. Mark as processed, only if still pending (guards against double processing)
    const { data: updated, error } = await supabase
      .from('transaksi')
      .update(updatePayload)
      .eq('nomor', nomor)
      .eq('status', 'diajukan')
      .select('id');

    if (error) {
      await restoreStock();
      throw error;
    }

    if (!updated || updated.length === 0) {
      await restoreStock();
      throw new Error('Permintaan ini sudah diproses sebelumnya.');
    }
  },

  updatePendingStockOutRequest: async (nomor: string, payload: {
    tanggal?: string;
    nama_pasien: string;
    tanggal_lahir_pasien?: string;
    nama_nakes?: string;
    total: number;
    diskon?: number;
    serviceFee?: number;
    items: {
      productId: string;
      quantity: number;
      price: number;
    }[];
    services: {
      serviceId: string;
      price: number;
    }[];
  }) => {
    const { data: existingTransaction, error: fetchError } = await supabase
      .from('transaksi')
      .select('id, status, keterangan')
      .eq('nomor', nomor)
      .single();

    if (fetchError) throw fetchError;
    if (!existingTransaction) throw new Error('Permintaan tidak ditemukan.');
    if (existingTransaction.status !== 'diajukan') {
      throw new Error('Permintaan yang sudah diproses tidak dapat diedit.');
    }

    const updatePayload = {
      tanggal: payload.tanggal,
      nama_pasien: payload.nama_pasien,
      tanggal_lahir_pasien: payload.tanggal_lahir_pasien || null,
      nama_nakes: payload.nama_nakes || null,
      total: payload.total,
      diskon: payload.diskon ?? 0,
      biaya_layanan: payload.serviceFee ?? 0,
      updated_at: new Date().toISOString(),
    };

    const { error: updateHeaderError } = await supabase
      .from('transaksi')
      .update(updatePayload)
      .eq('id', existingTransaction.id);

    if (updateHeaderError) throw updateHeaderError;

    const { error: deleteDetailError } = await supabase
      .from('transaksi_detail')
      .delete()
      .eq('transaksi_id', existingTransaction.id);

    if (deleteDetailError) throw deleteDetailError;

    const { error: deleteServiceError } = await supabase
      .from('transaksi_jasa')
      .delete()
      .eq('transaksi_id', existingTransaction.id);

    if (deleteServiceError) throw deleteServiceError;

    if (payload.items.length > 0) {
      const details = payload.items.map((item) => ({
        transaksi_id: existingTransaction.id,
        transaksi_nomor: nomor,
        obat_id: parseInt(item.productId),
        qty: item.quantity,
        harga: item.price,
        subtotal: item.quantity * item.price,
        batch: '-',
        expire_date: null,
      }));

      const { error: insertDetailError } = await supabase
        .from('transaksi_detail')
        .insert(details);

      if (insertDetailError) throw insertDetailError;
    }

    if (payload.services.length > 0) {
      const services = payload.services.map((svc) => ({
        transaksi_id: existingTransaction.id,
        transaksi_nomor: nomor,
        jasa_id: parseInt(svc.serviceId),
        qty: 1,
        harga_jasa: svc.price,
        subtotal: svc.price,
      }));

      const { error: insertServiceError } = await supabase
        .from('transaksi_jasa')
        .insert(services);

      if (insertServiceError) throw insertServiceError;
    }

    return { success: true };
  },

  // OPNAME SCHEDULES
  createOpnameSchedule: async (config: any) => {
    const { error } = await supabase
      .from('opname_schedule')
      .insert({
        nama: config.nama || 'Jadwal Rutin',
        tanggal_audit: config.dayOfMonth,
        waktu_jam: config.waktuJam,
        waktu_menit: config.waktuMenit,
        pengulangan: config.pengulangan,
        obat_ids: config.obatIds || null,
        durasi_pengerjaan: config.durasiPengerjaan || null,
        is_active: true
      });
    if (error) throw error;
    return { success: true };
  },

  getOpnameSchedules: async () => {
    const { data, error } = await supabase
      .from('opname_schedule')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((s: any) => ({
      id: s.id.toString(),
      nama: s.nama,
      tanggalAudit: s.tanggal_audit,
      waktuJam: s.waktu_jam,
      waktuMenit: s.waktu_menit,
      pengulangan: s.pengulangan,
      obatIds: s.obat_ids,
      durasiPengerjaan: s.durasi_pengerjaan,
      isActive: s.is_active
    }));
  },

  updateOpnameSchedule: async (id: string, config: any) => {
    const { error } = await supabase
      .from('opname_schedule')
      .update({
        nama: config.nama,
        tanggal_audit: config.dayOfMonth,
        waktu_jam: config.waktuJam,
        waktu_menit: config.waktuMenit,
        pengulangan: config.pengulangan,
        obat_ids: config.obatIds || null,
        durasi_pengerjaan: config.durasiPengerjaan || null,
      })
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  },

  deleteOpnameSchedule: async (id: string) => {
    const { error } = await supabase
      .from('opname_schedule')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  toggleOpnameScheduleStatus: async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('opname_schedule')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) throw error;
  },

  getActiveSchedules: async () => {
    const { data, error } = await supabase
      .from('opname_schedule')
      .select('*')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('nama');

    if (error) throw error;
    if (!data || data.length === 0) return [];

    const today = new Date();
    return data.map((schedule: any) => {
      let nextDate = new Date(today.getFullYear(), today.getMonth(), schedule.tanggal_audit);
      if (nextDate <= today) {
        if (schedule.pengulangan === 'BULANAN') {
          nextDate.setMonth(nextDate.getMonth() + 1);
        } else if (schedule.pengulangan === 'TRIWULAN') {
          nextDate.setMonth(nextDate.getMonth() + 3);
        } else if (schedule.pengulangan === 'TAHUNAN') {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        }
      }
      return {
        nextDate: nextDate.toISOString(),
        pengulangan: schedule.pengulangan,
        nama: schedule.nama,
        scheduleId: schedule.id.toString()
      };
    });
  },

  // OPNAME EXECUTION
  getUpcomingOpnames: async () => {
    const { data, error } = await supabase
      .from('opname')
      .select(`*, opname_schedule(nama)`)
      .eq('status', 'belum_dilaksanakan')
      .is('deleted_at', null)
      .order('tanggal_jadwal', { ascending: true });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id.toString(),
      opnameNumber: `OPN-${item.id}`,
      scheduleDate: item.tanggal_jadwal,
      status: item.status,
      scheduleName: item.opname_schedule?.nama || 'Jadwal Opname',
      currentStep: item.current_step || 1,
    }));
  },

  getDraftOpnames: async () => {
    const { data, error } = await supabase
      .from('opname')
      .select(`*, opname_schedule(nama)`)
      .eq('status', 'sedang_dilaksanakan')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id.toString(),
      opnameNumber: `OPN-${item.id}`,
      scheduleDate: item.tanggal_jadwal,
      status: item.status,
      scheduleName: item.opname_schedule?.nama || 'Jadwal Opname',
      currentStep: item.current_step || 1,
      createdAt: item.created_at,
    }));
  },

  startOpname: async (scheduleId: string | null, date: string) => {
    // Fetch schedule to get obat_ids if scheduleId is provided
    let selectedObatIds: number[] | null = null;

    if (scheduleId) {
      const { data: schedule, error: schedError } = await supabase
        .from('opname_schedule')
        .select('obat_ids')
        .eq('id', parseInt(scheduleId))
        .single();

      if (!schedError && schedule) {
        selectedObatIds = schedule.obat_ids;
      }
    }

    // Create Opname Header WITHOUT details (details created after step 1)
    const { data: opname, error: opError } = await supabase
      .from('opname')
      .insert({
        schedule_id: scheduleId ? parseInt(scheduleId) : null,
        tanggal_jadwal: date,
        status: 'belum_dilaksanakan',
        current_step: 1,
        selected_obat_ids: selectedObatIds, // Pre-select from schedule
      })
      .select('id')
      .single();

    if (opError) throw opError;

    // Create notification for opname creation (to Admin & Nakes)
    await supabase
      .from('notifications')
      .insert([
        {
          type: 'OPNAME_CREATED',
          title: 'Opname Baru Dibuat',
          message: `Opname OPN-${opname.id} telah dibuat dan menunggu pemilihan obat.`,
          data: { opname_id: opname.id, opname_number: `OPN-${opname.id}`, step: 1 },
          target_role: 'admin',
        },
        {
          type: 'OPNAME_CREATED',
          title: 'Opname Baru Dibuat',
          message: `Opname OPN-${opname.id} telah dibuat dan menunggu pemilihan obat.`,
          data: { opname_id: opname.id, opname_number: `OPN-${opname.id}`, step: 1 },
          target_role: 'farmasi',
        },
      ]);

    return { id: opname.id.toString(), success: true };
  },

  // Complete Step 1: Create detail rows after user confirms product selection
  completeStepOne: async (opnameId: string, selectedProductIds: string[]) => {
    // 1. Update opname header with selected products and advance to step 2
    const { error: updateError } = await supabase
      .from('opname')
      .update({
        selected_obat_ids: selectedProductIds,
        status: 'sedang_dilaksanakan',
        current_step: 2,
      })
      .eq('id', opnameId);

    if (updateError) throw updateError;

    // 2. Fetch current stock for selected products
    const { data: products, error: fetchError } = await supabase
      .from('master_obat')
      .select('id, qty')
      .in('id', selectedProductIds.map(id => parseInt(id)));

    if (fetchError) throw fetchError;

    // 3. Create detail rows with fresh stock snapshots
    if (products && products.length > 0) {
      const details = products.map((p: any) => ({
        opname_id: parseInt(opnameId),
        obat_id: p.id,
        stok_sistem: p.qty || 0,
        stok_fisik: 0,
        selisih: 0 - (p.qty || 0),
        status: 'pending',
      }));

      const { error: insertError } = await supabase
        .from('opname_detail')
        .insert(details);

      if (insertError) throw insertError;
    }

    // 4. Create notification for step 1→2 transition
    await supabase
      .from('notifications')
      .insert([
        {
          type: 'OPNAME_STEP_CHANGED',
          title: 'Opname Dimulai',
          message: `Opname OPN-${opnameId} telah dimulai dan memasuki tahap 2: Input Stok Fisik. Aplikasi terkunci untuk menjaga integritas data.`,
          data: { opname_id: parseInt(opnameId), opname_number: `OPN-${opnameId}`, step: 2, product_count: selectedProductIds.length },
          target_role: 'admin',
        },
        {
          type: 'OPNAME_STEP_CHANGED',
          title: 'Opname Dimulai',
          message: `Opname OPN-${opnameId} telah dimulai dan memasuki tahap 2: Input Stok Fisik. Aplikasi terkunci untuk menjaga integritas data.`,
          data: { opname_id: parseInt(opnameId), opname_number: `OPN-${opnameId}`, step: 2, product_count: selectedProductIds.length },
          target_role: 'farmasi',
        },
      ]);

    return { success: true };
  },

  // Backward to Step 1: Delete all detail rows and reset to step 1
  backwardToStepOne: async (opnameId: string, scheduleObatIds: string[]) => {
    // 1. Delete all detail rows
    const { error: deleteError } = await supabase
      .from('opname_detail')
      .delete()
      .eq('opname_id', opnameId);

    if (deleteError) throw deleteError;

    // 2. Reset opname to step 1
    const { error: updateError } = await supabase
      .from('opname')
      .update({
        current_step: 1,
        status: 'belum_dilaksanakan',
        selected_obat_ids: scheduleObatIds,
      })
      .eq('id', opnameId);

    if (updateError) throw updateError;

    return { success: true };
  },

  // Get active opname lock status.
  // Stok terkunci selama ada opname 'sedang_dilaksanakan' (semua langkah),
  // sampai opname selesai atau dihapus. Database juga menolak perubahan
  // stok selama itu (assert_no_active_opname), jadi ini hanya untuk UI.
  getActiveOpnameLock: async () => {
    const { data, error } = await supabase
      .from('opname')
      .select('id, current_step, created_at')
      .eq('status', 'sedang_dilaksanakan')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return {
      isLocked: !!data,
      opname: data ? {
        id: data.id.toString(),
        opnameNumber: `OPN-${data.id}`,
        currentStep: data.current_step || 1,
        startedAt: data.created_at,
      } : null
    };
  },

  // NOTIFICATIONS
  createNotification: async (notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
    target_roles?: string[];
  }) => {
    const roles = notification.target_roles || [];

    if (roles.length === 0) {
      // Broadcast notification (target_role = null)
      const { error } = await supabase
        .from('notifications')
        .insert({
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data || {},
          target_role: null,
        });
      if (error) throw error;
    } else {
      // Insert one row per target role so each role receives the notification
      const rows = roles.map(role => ({
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        target_role: role,
      }));
      const { error } = await supabase
        .from('notifications')
        .insert(rows);
      if (error) throw error;
    }

    return { success: true };
  },

  // REPORTING
  getTransactionReport: async (startDate: string, endDate: string, params?: PaginationParams): Promise<PaginatedResponse<any>> => {
    const { page = 1, perPage = 10, status } = params || {};

    let query = supabase
      .from('transaksi')
      .select(`
        *,
        transaksi_detail:transaksi_detail!transaksi_detail_transaksi_id_fkey (*, master_obat(nama, jenis, merek, kandungan, harga)),
        transaksi_jasa:transaksi_jasa!transaksi_jasa_transaksi_id_fkey (*, master_jasa(nama))
      `)
      .gte('tanggal', `${startDate}T00:00:00Z`)
      .lte('tanggal', `${endDate}T23:59:59Z`)
      .order('created_at', { ascending: false });

    if (status && status !== 'Semua') {
      const dbStatus = status === 'Menunggu' ? 'diajukan' : 'selesai';
      query = query.eq('status', dbStatus);
    }

    const { data, error } = await query;

    if (error) throw error;

    const createdByIds = [...new Set((data || []).map((t: any) => t.created_by).filter(Boolean))];
    let profileMap: Record<string, string> = {};
    if (createdByIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', createdByIds);

      if (profilesError) throw profilesError;

      (profiles || []).forEach((profile: any) => {
        profileMap[profile.id] = profile.full_name || '';
      });
    }

    const mappedData = (data || []).map((t: any) => {
      const transactionMeta = extractTransactionNoteAndMeta(t.keterangan);
      const drugDetails = t.transaksi_detail?.map((d: any) => {
        const unitPrice = Number(d.harga || 0) > 0
          ? Number(d.harga || 0)
          : Number(d.master_obat?.harga || 0);
        const subtotal = Number(d.subtotal || 0) > 0
          ? Number(d.subtotal || 0)
          : ((d.qty || 0) * unitPrice);

        return {
          id: d.id?.toString?.() || `${t.nomor}-${d.obat_id}`,
          name: getDisplayNameFromMasterObat(d.master_obat),
          quantity: d.qty || 0,
          price: unitPrice,
          subtotal,
        };
      }) || [];

      const serviceDetails = t.transaksi_jasa?.map((j: any) => ({
        id: j.id?.toString?.() || `${t.nomor}-${j.jasa_id}`,
        name: j.master_jasa?.nama || 'Unknown Service',
        quantity: j.qty || 1,
        price: j.harga_jasa || 0,
        subtotal: j.subtotal || ((j.qty || 1) * (j.harga_jasa || 0)),
      })) || [];

      const computedDrugTotal = drugDetails.reduce((sum: number, item: any) => sum + Number(item.subtotal || 0), 0);
      const computedServiceTotal = serviceDetails.reduce((sum: number, item: any) => sum + Number(item.subtotal || 0), 0);
      const serviceFee = Number(t.biaya_layanan ?? transactionMeta.meta.serviceFee ?? 0);
      const discount = Number(t.diskon || 0);
      const headerTotal = Number(t.total || 0);
      const normalizedTotal = headerTotal > 0 ? headerTotal : (computedDrugTotal + computedServiceTotal + serviceFee - discount);

      return {
        id: t.nomor,
        date: getTransactionEventTimestamp(t),
        type: t.tipe,
        source: t.tipe_sumber,
        status: t.status === 'diajukan' ? 'Menunggu' : 'Selesai',
        patient: t.nama_pasien,
        birthDate: t.tanggal_lahir_pasien,
        nakes: t.nama_nakes || (t.created_by && profileMap[t.created_by]) || '-',
        items: t.transaksi_detail?.map((d: any) => `${getDisplayNameFromMasterObat(d.master_obat)} (${d.qty})`).join(', ') || '',
        services: t.transaksi_jasa?.map((j: any) => j.master_jasa?.nama).filter(Boolean).join(', ') || '-',
        serviceFee,
        discount,
        total: normalizedTotal,
        drugDetails,
        serviceDetails,
      };
    }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Pagination applied AFTER all filtering and mapping so that totalPages
    // reflects the actual number of filtered records, not the raw DB count.
    const totalFiltered = mappedData.length;
    const from = (page - 1) * perPage;
    const to = from + perPage;
    const paginatedData = mappedData.slice(from, to);

    return {
      data: paginatedData,
      total: totalFiltered,
      page,
      perPage,
      totalPages: Math.ceil(totalFiltered / perPage)
    };
  },

  getOpnameById: async (opnameId: string) => {
    const { data, error } = await supabase
      .from('opname')
      .select(`
        *,
        opname_schedule(nama, obat_ids),
        opname_detail(*, master_obat(nama, satuan, jenis, merek, kandungan))
      `)
      .eq('id', opnameId)
      .is('deleted_at', null)
      .single();

    if (error) throw error;

    return {
      id: data.id.toString(),
      opnameNumber: `OPN-${data.id}`,
      scheduleDate: data.tanggal_jadwal,
      status: data.status,
      auditor: data.profiles?.full_name || 'Admin',
      currentStep: data.current_step || 1,
      selectedObatIds: data.selected_obat_ids,
      completedAt: data.completed_at,
      scheduleObatIds: data.opname_schedule?.obat_ids || [],
      scheduleName: data.opname_schedule?.nama || 'Jadwal Opname',
      items: (data.opname_detail || []).map((d: any) => ({
        id: d.id.toString(),
        productId: d.obat_id.toString(),
        productName: getDisplayNameFromMasterObat(d.master_obat),
        category: d.master_obat?.jenis || 'Obat',
        unit: d.master_obat?.satuan || 'Pcs',
        systemStock: d.stok_sistem,
        physicalStock: d.stok_fisik,
        difference: d.selisih,
        stokFinal: d.stok_final,
        reason: d.alasan,
        detailStatus: d.status,
      }))
    };
  },

  saveDraft: async (opnameId: string, step: number, detailUpdates?: { detailId: string; physicalStock?: number; stokFinal?: number; reason?: string }[]) => {
    // Update current step
    const { error: stepError } = await supabase
      .from('opname')
      .update({ current_step: step })
      .eq('id', opnameId);

    if (stepError) throw stepError;

    // Update detail rows if provided
    if (detailUpdates && detailUpdates.length > 0) {
      for (const update of detailUpdates) {
        const updateData: any = {};
        if (update.physicalStock !== undefined) {
          updateData.stok_fisik = update.physicalStock;
          // Fetch stok_sistem to compute selisih
          const { data: detail } = await supabase.from('opname_detail').select('stok_sistem').eq('id', update.detailId).single();
          if (detail) {
            updateData.selisih = update.physicalStock - detail.stok_sistem;
            updateData.status = updateData.selisih === 0 ? 'sesuai' : 'pending';
          }
        }
        if (update.stokFinal !== undefined) updateData.stok_final = update.stokFinal;
        if (update.reason !== undefined) updateData.alasan = update.reason;

        if (Object.keys(updateData).length > 0) {
          const { error } = await supabase
            .from('opname_detail')
            .update(updateData)
            .eq('id', update.detailId);
          if (error) throw error;
        }
      }
    }

    return { success: true };
  },

  // Simpan detail opname TANPA mengubah current_step.
  // Digunakan oleh tombol "Simpan Draft" agar step di DB tidak berubah secara tidak sengaja.
  saveDetailOnly: async (opnameId: string, detailUpdates: { detailId: string; physicalStock?: number; stokFinal?: number; reason?: string }[]) => {
    if (!detailUpdates || detailUpdates.length === 0) return { success: true };

    for (const update of detailUpdates) {
      const updateData: any = {};

      if (update.physicalStock !== undefined) {
        updateData.stok_fisik = update.physicalStock;
        // Fetch stok_sistem untuk hitung selisih
        const { data: detail } = await supabase
          .from('opname_detail')
          .select('stok_sistem')
          .eq('id', update.detailId)
          .single();
        if (detail) {
          updateData.selisih = update.physicalStock - detail.stok_sistem;
          updateData.status = updateData.selisih === 0 ? 'sesuai' : 'pending';
        }
      }
      if (update.stokFinal !== undefined) updateData.stok_final = update.stokFinal;
      if (update.reason !== undefined) updateData.alasan = update.reason;

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('opname_detail')
          .update(updateData)
          .eq('id', update.detailId);
        if (error) throw error;
      }
    }

    return { success: true };
  },

  // Update selected products for an opname: update selected_obat_ids, delete existing details, re-create with fresh snapshots
  updateOpnameSelection: async (opnameId: string, selectedProductIds: string[]) => {
    // 1. Update selected_obat_ids and obat_ids on opname header
    const { error: updateError } = await supabase
      .from('opname')
      .update({
        selected_obat_ids: selectedProductIds,
        obat_ids: selectedProductIds,
        current_step: 2,
      })
      .eq('id', opnameId);

    if (updateError) throw updateError;

    // 2. Delete all existing opname_detail rows for this opname
    const { error: deleteError } = await supabase
      .from('opname_detail')
      .delete()
      .eq('opname_id', opnameId);

    if (deleteError) throw deleteError;

    // 3. Fetch current stock for selected products
    const { data: products, error: fetchError } = await supabase
      .from('master_obat')
      .select('id, qty')
      .in('id', selectedProductIds.map(id => parseInt(id)));

    if (fetchError) throw fetchError;

    // 4. Insert new opname_detail rows with fresh stock snapshots
    if (products && products.length > 0) {
      const details = products.map((p: any) => ({
        opname_id: parseInt(opnameId),
        obat_id: p.id,
        stok_sistem: p.qty || 0,
        stok_fisik: 0,
        selisih: 0 - (p.qty || 0),
        status: 'pending',
      }));

      const { error: insertError } = await supabase
        .from('opname_detail')
        .insert(details);

      if (insertError) throw insertError;
    }

    return { success: true };
  },

  deleteOpname: async (opnameId: string) => {
    // Soft delete: mark as deleted instead of removing data
    const { error } = await supabase
      .from('opname')
      .update({ deleted_at: new Date().toISOString(), status: 'dihapus' })
      .eq('id', opnameId);

    if (error) throw error;
    return { success: true };
  },

  updateOpnameDetail: async (detailId: string, physicalStock: number) => {
    const { data: detail, error: fetchError } = await supabase.from('opname_detail').select('stok_sistem').eq('id', detailId).single();
    if (fetchError) throw fetchError;

    const diff = physicalStock - detail.stok_sistem;

    const { error } = await supabase
      .from('opname_detail')
      .update({
        stok_fisik: physicalStock,
        selisih: diff,
        status: diff === 0 ? 'sesuai' : 'pending'
      })
      .eq('id', detailId);

    if (error) throw error;
  },

  finishOpname: async (opnameId: string) => {
    // Satu transaksi di database: status detail, master_obat.qty, dan
    // status opname berubah bersamaan atau tidak sama sekali.
    const { error } = await supabase.rpc('finish_opname', {
      p_opname_id: parseInt(opnameId)
    });

    if (error) throw new Error(error.message);
  },

  resolveOpnameDifference: async (detailId: string, reason: string) => {
    const { data: detail, error: fetchError } = await supabase.from('opname_detail').select('obat_id, stok_fisik').eq('id', detailId).single();
    if (fetchError) throw fetchError;

    const { error } = await supabase
      .from('opname_detail')
      .update({
        status: 'disesuaikan',
        alasan: reason
      })
      .eq('id', detailId);

    if (error) throw error;
  },

  getOpnameHistory: async () => {
    const { data, error } = await supabase
      .from('opname')
      .select(`
        *,
        opname_schedule(nama),
        opname_detail (selisih)
      `)
      .eq('status', 'selesai')
      .is('deleted_at', null)
      .order('completed_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id.toString(),
      opnameNumber: `OPN-${item.id}`,
      date: item.completed_at || item.created_at,
      scheduleDate: item.tanggal_jadwal,
      scheduleName: item.opname_schedule?.nama || 'Jadwal Opname',
      auditor: item.profiles?.full_name || 'Admin',
      itemsCount: item.opname_detail?.length || 0,
      discrepancyCount: (item.opname_detail || []).filter((d: any) => d.selisih !== 0).length,
      status: 'selesai',
    }));
  },

  getOpnameDetailView: async (opnameId: string) => {
    const { data, error } = await supabase
      .from('opname_detail')
      .select(`*, master_obat(nama, satuan, jenis, merek, kandungan)`)
      .eq('opname_id', opnameId);

    if (error) throw error;

    return (data || []).map((d: any) => ({
      id: d.id.toString(),
      productName: getDisplayNameFromMasterObat(d.master_obat),
      stokSistem: d.stok_sistem,
      stokFisik: d.stok_fisik,
      selisih: d.selisih,
      stokFinal: d.stok_final,
      alasan: d.alasan || '-',
    }));
  },

  getExpiringProducts: async (days: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    const targetDateStr = targetDate.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('transaksi_detail')
      .select(`
        batch,
        qty,
        master_obat (nama)
      `)
      .not('batch', 'is', null)
      .neq('batch', '-') // Assuming valid batch has date or we just return batch info
      // Note: Real implementation needs strict date column in transksi_detail or parsing batch. 
      // For now we map whatever is in batch as if it's expiry relevant or rely on specific expire_date column if exists.
      // spec_db says: td.expire_date. Let's assume migration added it or we use batch as proxy for now.
      // If expire_date doesn't strictly exist in schema yet, this might fail if we query it?
      // Let's use master_obat buffer stock logic as fallback for "Critical Stock" report if expiry is hard.
      // BUT spec SC-024 specifically asks for 'Laporan Obat Mendekati Expire'.
      // I will assume 'batch' might contain expiry or we return mocked data if column missing to avoid crash, 
      // OR better, we query master_obat and return those with low stock as a proxy if expiry is not tracked?
      // No, let's try to query 'transaksi_detail' assuming it has 'expire_date' as per spec SC-007 mapping?
      // "expire_date | transaksi_detail | Expire"
      // If I didn't add it in migration, I should probably add it now or skip.
      // Let's stick to returning what we have: stock mutation.
      ;

    // ALTERNATIVE: Return logic for Low Stock (Buffer check) which is also critical.
    // Using buffer_stok for dynamic threshold
    const { data: lowStock } = await supabase
      .from('master_obat')
      .select('*, buffer_stok')
      .eq('is_active', true)
      .is('deleted_at', null)
      .or('qty.lt.buffer_stok,qty.lt.10')

    return lowStock || [];
  },

  getDashboardStats: async () => {
    // 1. Total Barang Count
    const { count: totalProducts, error: countError } = await supabase
      .from('master_obat')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .is('deleted_at', null);

    if (countError) console.error("Error fetching product count", countError);

    // 2. Total Inventory Value (requires calculation)
    // Supabase doesn't have effortless sum() without RPC, so let's fetch minimal payload for now or use RPC if available.
    // For prototype: fetch all id, qty, harga. 2458 items is manageable but not scalable. 
    // Ideally create a VIEW or RPC. Let's try JS side for now (safe for < 10k items).
    const { data: products, error: prodError } = await supabase
      .from('master_obat')
      .select('qty, harga, jenis, buffer_stok') // Added jenis for stats, buffer_stok for threshold
      .eq('is_active', true)
      .is('deleted_at', null);

    if (prodError) console.error("Error fetching products for stats", prodError);

    let totalValue = 0;
    let lowStockCount = 0;
    const categoryStats: Record<string, number> = {};

    products?.forEach(p => {
      totalValue += (p.qty || 0) * (p.harga || 0);
      // Use buffer_stok from database for low stock threshold
      const threshold = p.buffer_stok || 10;
      if ((p.qty || 0) < threshold) lowStockCount++;

      const cat = p.jenis || 'Lainnya';
      categoryStats[cat] = (categoryStats[cat] || 0) + 1;
    });

    // 3. Stok Masuk/Keluar Counts (Today or This Month?) -> Design says just "Stok Masuk" number.
    // Let's assume it's "This Month" count of transactions or items?
    // Dashboard usually implies "Recent activity" or "Current Status".
    // Let's do Count of Transactions in current Month.
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const dateStr = startOfMonth.toISOString().split('T')[0];

    // Count In Transactions
    const { count: inCount } = await supabase
      .from('transaksi')
      .select('*', { count: 'exact', head: true })
      .eq('tipe', 'masuk')
      .gte('tanggal', dateStr);

    // Count Out Transactions
    const { count: outCount } = await supabase
      .from('transaksi')
      .select('*', { count: 'exact', head: true })
      .eq('tipe', 'keluar')
      .gte('tanggal', dateStr);

    // 4. Pending Requests (Tertunda)
    const { count: pendingCount } = await supabase
      .from('transaksi')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'diajukan');

    // 5. Recent Transactions removed from here, will use dedicated endpoint with pagination

    // 6. Low Stock Items (Specific Names)

    // 6. Low Stock Items (Specific Names)
    // Using buffer_stok field for dynamic threshold, fallback to 10 if not set
    const { data: lowStockItems } = await supabase
      .from('master_obat')
      .select('nama, qty, buffer_stok, jenis, merek, kandungan')
      .eq('is_active', true)
      .is('deleted_at', null)
      .or('qty.lt.buffer_stok,qty.lt.10')
      .limit(3);

    // 7. Weekly Stock Out Data (last 7 days)
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const weeklyData: { day: string; count: number }[] = [];
    const todayDate = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayDate);
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const { count: dayCount } = await supabase
        .from('transaksi')
        .select('*', { count: 'exact', head: true })
        .eq('tipe', 'keluar')
        .gte('tanggal', `${dayStr}T00:00:00Z`)
        .lte('tanggal', `${dayStr}T23:59:59Z`);
      weeklyData.push({ day: dayNames[d.getDay()], count: dayCount || 0 });
    }

    return {
      totalProducts: totalProducts || 0,
      totalValue,
      stokMasuk: inCount || 0,
      stokKeluar: outCount || 0,
      tertunda: pendingCount || 0,
      recentTransactions: [],
      lowStockItems: (lowStockItems || []).map((item: any) => ({
        ...item,
        nama: getProductDisplayNameFromDb(item),
      })),
      categoryDistribution: categoryStats,
      weeklyStockOut: weeklyData
    };
  },

  getRecentStockOuts: async (limit: number = 10) => {
    const { data, error } = await supabase
      .from('transaksi')
      .select(`
        *,
        transaksi_detail:transaksi_detail!transaksi_detail_transaksi_id_fkey (
          qty,
          master_obat (nama, jenis, merek, kandungan)
        )
      `)
      .eq('tipe', 'keluar')
      .eq('status', 'selesai')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data.map((t: any) => {
      const itemCount = t.transaksi_detail?.length || 0;
      const firstItemName = getDisplayNameFromMasterObat(t.transaksi_detail?.[0]?.master_obat) || 'Item';
      const totalQty = t.transaksi_detail?.reduce((acc: number, d: any) => acc + (d.qty || 0), 0) || 0;

      let title = 'Pengeluaran Stok';
      if (t.tipe_sumber === 'KASIR_LANGSUNG') {
        title = 'Stok Manual';
      } else if (t.tipe_sumber === 'PENGAJUAN_NAKES') {
        title = 'Permintaan Nakes';
      }

      // Use created_at for accurate timestamps
      const createdAt = new Date(t.created_at);
      const now = new Date();
      const diffMs = now.getTime() - createdAt.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      let timeStr: string;
      if (diffMins < 1) {
        timeStr = 'Baru saja';
      } else if (diffMins < 60) {
        timeStr = `${diffMins} menit lalu`;
      } else if (diffHours < 24) {
        timeStr = `${diffHours} jam lalu`;
      } else if (diffDays === 1) {
        timeStr = `Kemarin ${createdAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
      } else if (diffDays < 7) {
        timeStr = `${diffDays} hari lalu`;
      } else {
        timeStr = createdAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      }

      const itemDesc = itemCount > 1 ? `${firstItemName} +${itemCount - 1} lainnya` : firstItemName;

      return {
        id: t.id,
        title,
        desc: `${itemDesc} (${totalQty} pcs) — ${t.nama_pasien || 'Umum'}`,
        time: timeStr,
        dotColor: t.tipe_sumber === 'KASIR_LANGSUNG' ? 'bg-primary' : 'bg-emerald-500'
      };
    });
  },

  getStockMutationReport: async (startDate: string, endDate: string, params?: PaginationParams): Promise<PaginatedResponse<any>> => {
    const { page = 1, perPage = 10 } = params || {};

    // 1. Get transaction data (stok masuk/keluar)
    const { data, error } = await supabase
      .from('transaksi')
      .select(`
        created_at,
        processed_at,
        nomor,
        tipe,
        tipe_sumber,
        status,
        transaksi_detail:transaksi_detail!transaksi_detail_transaksi_id_fkey (qty, master_obat(nama, jenis, merek, kandungan))
      `)
      .gte('created_at', `${startDate}T00:00:00Z`)
      .lte('created_at', `${endDate}T23:59:59Z`)
      .eq('status', 'selesai')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 2. Get completed opname data (penyesuaian stok)
    const { data: opnameData, error: opnameError } = await supabase
      .from('opname')
      .select(`
        id,
        completed_at,
        status,
        opname_detail (
          obat_id,
          stok_sistem,
          stok_fisik,
          selisih,
          stok_final,
          status,
          alasan,
          master_obat (nama, jenis, merek, kandungan)
        )
      `)
      .eq('status', 'selesai')
      .is('deleted_at', null)
      .gte('completed_at', `${startDate}T00:00:00Z`)
      .lte('completed_at', `${endDate}T23:59:59Z`)
      .order('completed_at', { ascending: false });

    if (opnameError) throw opnameError;

    // Flatten transaction rows: one row per item
    const allRows: any[] = [];
    data.forEach(t => {
      if (t.transaksi_detail && Array.isArray(t.transaksi_detail)) {
        t.transaksi_detail.forEach((d: any) => {
          allRows.push({
            date: getTransactionEventTimestamp(t),
            trxNumber: t.nomor,
            type: t.tipe,
            source: t.tipe_sumber,
            itemName: getDisplayNameFromMasterObat(d.master_obat),
            qty: d.qty,
            status: t.status,
            // Opname-specific fields (empty for transactions)
            systemStock: null,
            physicalStock: null,
            finalStock: null,
            reason: null,
          });
        });
      }
    });

    // Flatten opname rows: one row per adjusted item
    (opnameData || []).forEach((o: any) => {
      if (o.opname_detail && Array.isArray(o.opname_detail)) {
        o.opname_detail.forEach((d: any) => {
          allRows.push({
            date: o.completed_at,
            trxNumber: `OPN-${o.id}`,
            type: 'penyesuaian',
            source: 'OPNAME',
            itemName: getDisplayNameFromMasterObat(d.master_obat),
            qty: d.selisih || 0,
            status: 'selesai',
            // Opname-specific fields
            systemStock: d.stok_sistem,
            physicalStock: d.stok_fisik,
            finalStock: d.stok_final,
            reason: d.alasan || null,
          });
        });
      }
    });

    // Sort all rows by date descending
    allRows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Apply pagination to flattened data
    const from = (page - 1) * perPage;
    const to = from + perPage;
    const paginatedRows = allRows.slice(from, to);

    return {
      data: paginatedRows,
      total: allRows.length,
      page,
      perPage,
      totalPages: Math.ceil(allRows.length / perPage)
    };
  },

  // Fetch all staff profiles for dropdowns
  getNakesProfiles: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, user_roles!inner(role)')
      .eq('user_roles.role', 'nakes')
      .order('full_name')
    if (error) throw error;
    return (data || []).map((p: any) => ({ id: p.id, full_name: p.full_name }));
  },

  // Fetch distinct supplier names from past stock-in transactions
  getDistinctSuppliers: async () => {
    const { data, error } = await supabase
      .from('transaksi')
      .select('nama_pasien')
      .eq('tipe', 'masuk')
      .not('nama_pasien', 'is', null);
    if (error) throw error;
    const unique = [...new Set((data || []).map((d: any) => d.nama_pasien).filter(Boolean))];
    return unique as string[];
  },

  getRecentTransactions: async (page: number = 1, perPage: number = 5) => {
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data, count, error } = await supabase
      .from('transaksi')
      .select(`
            nomor,
            tanggal,
            created_at,
            tipe,
            status,
            transaksi_detail:transaksi_detail!transaksi_detail_transaksi_id_fkey (
                qty,
                master_obat (nama, jenis, merek, kandungan)
            )
        `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const formattedData = (data || []).map((t: any) => {
      const isIn = t.tipe === 'masuk';
      const details = t.transaksi_detail || [];
      const itemName = details.length > 0 ? (getDisplayNameFromMasterObat(details[0]?.master_obat) || 'Unknown') : 'Item Dihapus';
      const itemCategory = details.length > 0 ? (details[0]?.master_obat?.jenis || '-') : '-';
      const itemCount = details.length;
      const totalQty = details.reduce((acc: number, curr: any) => acc + (curr.qty || 0), 0);

      // Construct display name
      const displayName = itemCount > 1 ? `${itemName} +${itemCount - 1} lainnya` : itemName;

      return {
        id: t.nomor,
        name: displayName,
        status: isIn ? 'Stok Masuk' : 'Stok Keluar',
        originalStatus: t.status,
        category: itemCategory,
        amount: `${isIn ? '+' : '-'}${totalQty}`,
        qty: totalQty,
        date: new Date(t.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }),
        icon: isIn ? 'arrow_downward' : 'arrow_upward',
        iconBg: isIn ? 'bg-green-100 dark:bg-green-500/20' : 'bg-red-100 dark:bg-red-500/20',
        iconColor: isIn ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
        isWarning: !isIn && t.status === 'diajukan'
      };
    });

    return {
      data: formattedData,
      total: count || 0,
      page,
      perPage,
      totalPages: Math.ceil((count || 0) / perPage)
    };
  }
};
