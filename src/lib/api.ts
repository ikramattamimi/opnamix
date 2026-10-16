import { supabase } from './supabaseClient';
import {
  Product,
  Service,
  ServiceCategoryType,
  Unit,
  Category,
  StockOutRequest,
  StockInReceipt,
  PaginationParams,
  PaginatedResponse,
  OpnameScheduleConfig,
  OpnameSchedule,
  OpnameStatus,
  OpnameItem,
  PengulanganOpname,
} from '@/types';
import type { Json, Tables } from './database.types';
import {
  getDisplayNameFromMasterObat,
  getProductDisplayName,
  getProductDisplayNameFromDb,
} from '@/features/products/productDisplay';
import { getLowStockItems } from '@/features/dashboard/lowStock';
import { toDate } from './utils';

// Nama lengkap user per id dari profiles. Id null/duplikat diabaikan.
const getProfileNames = async (ids: (string | null)[]): Promise<Record<string, string>> => {
  const uniqueIds = [...new Set(ids.filter((id): id is string => !!id))];
  if (uniqueIds.length === 0) return {};

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', uniqueIds);
  if (error) throw error;

  const names: Record<string, string> = {};
  (data || []).forEach((profile) => {
    names[profile.id] = profile.full_name || '';
  });
  return names;
};

// Map DB types to Frontend types
const mapProductFromDB = (item: Tables<'master_obat'>): Product => ({
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

const getTransactionEventTimestamp = (transaction: {
  processed_at?: string | null;
  created_at?: string | null;
  tanggal?: string | null;
}) => transaction?.processed_at || transaction?.created_at || transaction?.tanggal;
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

const mapServiceFromDB = (
  item: Tables<'master_jasa'> & { service_categories?: { name: string } | null },
): Service => ({
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
  iconBg: 'bg-blue-100',
});

const mapServiceCategoryFromDB = (item: Tables<'service_categories'>): ServiceCategoryType => ({
  id: item.id.toString(),
  name: item.name,
  code: item.code,
  description: item.description,
  isActive: item.is_active,
});

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

// Daftar id obat di kolom jsonb obat_ids / selected_obat_ids. Isinya bisa
// string atau number tergantung asal datanya, jadi pemakai selalu map(String).
type OpnameObatIds = (string | number)[];

// Satu baris laporan mutasi stok: item transaksi atau item opname.
export interface StockMutationRow {
  date: string | null | undefined;
  trxNumber: string | null;
  type: string | null;
  source: string | null;
  itemName: string;
  qty: number;
  status: string | null;
  systemStock: number | null;
  physicalStock: number | null;
  finalStock: number | null;
  reason: string | null;
}

type OpnameDetailUpdate = {
  detailId: string;
  physicalStock?: number;
  stokFinal?: number;
  reason?: string;
};

// p_step null berarti current_step tidak diubah. Tipe hasil generate tidak
// menandai argumen RPC yang boleh null, padahal SQL-nya menerima null.
const NO_STEP_CHANGE = null as unknown as number;

// Ubah ke format p_updates RPC save_opname_details. Field yang undefined
// tidak dikirim, sehingga kolomnya tidak diubah di database.
const toOpnameDetailUpdates = (updates?: OpnameDetailUpdate[]) =>
  (updates || []).map((u) => ({
    detail_id: parseInt(u.detailId),
    ...(u.physicalStock !== undefined && { physical_stock: u.physicalStock }),
    ...(u.stokFinal !== undefined && { stok_final: u.stokFinal }),
    ...(u.reason !== undefined && { reason: u.reason }),
  }));

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

  // HELPER: Generate unique transaction number from a database sequence
  // (format IN-YYYYMMDD-000123 / OUT-YYYYMMDD-000123)
  generateTransactionNumber: async (type: 'masuk' | 'keluar'): Promise<string> => {
    const { data, error } = await supabase.rpc('next_transaction_number', { p_tipe: type });
    if (error) throw new Error(error.message);
    return data as string;
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
        items: payload.items.map((item) => ({
          product_id: parseInt(item.productId),
          quantity: item.quantity,
          price: item.price,
          batch: item.batch || '-',
          expiry_date: item.expiryDate || null,
        })),
        services: payload.services.map((svc) => ({
          service_id: parseInt(svc.serviceId),
          price: svc.price,
        })),
      },
    });

    if (error) {
      console.error('Error creating transaction:', error);
      throw new Error(error.message);
    }

    return { success: true };
  },

  // READ STOCK IN
  getStockInReceipts: async (
    params?: PaginationParams,
  ): Promise<PaginatedResponse<StockInReceipt>> => {
    const { page = 1, perPage = 10 } = params || {};
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data, error, count } = await supabase
      .from('transaksi')
      .select(
        `
        *,
        transaksi_detail:transaksi_detail!transaksi_detail_transaksi_id_fkey (*, master_obat(nama, satuan, jenis, merek, kandungan))
      `,
        { count: 'exact' },
      )
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

    const profileMap = await getProfileNames((data || []).map((t) => t.created_by));

    const validData = data.map((t) => {
      const invoiceFromNote =
        typeof t.keterangan === 'string' && t.keterangan.startsWith('Invoice: ')
          ? t.keterangan.replace('Invoice: ', '').trim()
          : '';

      return {
        // nomor selalu diisi saat transaksi dibuat (next_transaction_number)
        id: t.nomor as string,
        invoiceNumber: invoiceFromNote || (t.nomor as string),
        supplierName: t.nama_pasien || 'Unknown Supplier',
        // tanggal selalu diisi saat transaksi dibuat
        date: t.tanggal as string,
        status: t.status === 'selesai' ? 'Selesai' : 'Menunggu',
        receivedBy: (t.created_by && profileMap[t.created_by]) || 'Admin',
        evidenceUrl: t.bukti, // Map evidenceUrl
        items: t.transaksi_detail
          ? t.transaksi_detail.map((d) => ({
              id: d.id.toString(),
              productId: d.obat_id?.toString() || '',
              productName: getDisplayNameFromMasterObat(d.master_obat),
              category: d.master_obat?.jenis || 'Obat',
              quantity: d.qty,
              unit: d.master_obat?.satuan || 'Pcs',
              expiryDate: d.expire_date || '-',
            }))
          : [],
      };
    });

    return {
      data: validData,
      total: count || 0,
      page,
      perPage,
      totalPages: Math.ceil((count || 0) / perPage),
    };
  },

  // READ TRANSACTIONS (Specific for Stock Out Queue)
  getStockOutRequests: async (
    params?: PaginationParams,
  ): Promise<PaginatedResponse<StockOutRequest>> => {
    const { page = 1, perPage = 10, status, createdBy } = params || {};
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from('transaksi')
      .select(
        `
        *,
        transaksi_detail:transaksi_detail!transaksi_detail_transaksi_id_fkey (*, master_obat(nama, satuan, jenis, merek, kandungan)),
        transaksi_jasa:transaksi_jasa!transaksi_jasa_transaksi_id_fkey (*, master_jasa(nama))
      `,
        { count: 'exact' },
      )
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
    const createdByIds = [
      ...new Set((data || []).map((t) => t.created_by).filter((id): id is string => Boolean(id))),
    ];
    const profileMap: Record<string, string> = {};
    if (createdByIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', createdByIds);
      if (profiles) {
        profiles.forEach((p) => {
          profileMap[p.id] = p.full_name || '';
        });
      }
    }

    const mappedData = data.map((t) => {
      const transactionMeta = extractTransactionNoteAndMeta(t.keterangan);
      const normalizedServiceFee = Number(t.biaya_layanan ?? transactionMeta.meta.serviceFee ?? 0);

      return {
        id: t.nomor, // Using nomor as ID
        requestId: t.nomor,
        patient: {
          fullName: t.nama_pasien,
          medicalRecordNumber: '-', // Not stored in transaksi currently?
          birthDate: t.tanggal_lahir_pasien || '',
          diagnosis: '-', // Not stored
        },
        drugs: t.transaksi_detail
          ? t.transaksi_detail.map((d) => ({
              id: d.id.toString(),
              productId: d.obat_id?.toString() || '',
              productName: getDisplayNameFromMasterObat(d.master_obat),
              quantity: d.qty,
              unit: d.master_obat?.satuan || 'Pcs',
              instructions: '-', // Not in DB
              price: d.harga || 0, // Map historical price
            }))
          : [],
        services: t.transaksi_jasa
          ? t.transaksi_jasa.map((j) => ({
              id: j.jasa_id.toString(),
              name: j.master_jasa?.nama || 'Unknown Service',
              price: j.harga_jasa || 0,
            }))
          : [],
        createdBy: t.created_by,
        totalAmount: t.total,
        discount: t.diskon ?? 0,
        serviceFee: normalizedServiceFee,
        requestedBy:
          t.nama_nakes ||
          (t.created_by && profileMap[t.created_by]) ||
          (t.tipe_sumber === 'PENGAJUAN_NAKES' ? 'Nakes' : 'Farmasi'),
        requestedByAvatar:
          t.tipe_sumber === 'PENGAJUAN_NAKES'
            ? 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'
            : 'https://cdn-icons-png.flaticon.com/512/2304/2304226.png',
        status: t.status === 'diajukan' ? 'Menunggu' : 'Selesai',
        date: t.tanggal,
        tipeSumber: t.tipe_sumber,
      };
    });

    return {
      data: mappedData as StockOutRequest[], // explicit cast for type safety
      total: count || 0,
      page,
      perPage,
      totalPages: Math.ceil((count || 0) / perPage),
    };
  },

  // UPDATE STATUS
  // Satu-satunya status tujuan adalah 'selesai'; pengurangan stok dan
  // perubahan status dilakukan dalam satu transaksi oleh RPC.
  updateTransactionStatus: async (
    nomor: string,
    _status: 'selesai',
    diskon?: number,
    total?: number,
    serviceFee?: number,
  ) => {
    const { error } = await supabase.rpc('process_stock_out_request', {
      p_nomor: nomor,
      // Argumen yang tidak dikirim memakai default SQL (null)
      p_diskon: diskon,
      p_total: total,
      p_biaya_layanan: serviceFee,
    });

    if (error) throw new Error(error.message);
  },

  updatePendingStockOutRequest: async (
    nomor: string,
    payload: {
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
    },
  ) => {
    // Header diganti dan item/jasa di-replace dalam satu transaksi;
    // ditolak di database kalau permintaan sudah bukan 'diajukan'.
    const { error } = await supabase.rpc('update_pending_stock_out_request', {
      p_nomor: nomor,
      p_payload: {
        tanggal: payload.tanggal ?? null,
        nama_pasien: payload.nama_pasien,
        tanggal_lahir_pasien: payload.tanggal_lahir_pasien || null,
        nama_nakes: payload.nama_nakes || null,
        total: payload.total,
        diskon: payload.diskon ?? 0,
        biaya_layanan: payload.serviceFee ?? 0,
        items: payload.items.map((item) => ({
          product_id: parseInt(item.productId),
          quantity: item.quantity,
          price: item.price,
        })),
        services: payload.services.map((svc) => ({
          service_id: parseInt(svc.serviceId),
          price: svc.price,
        })),
      },
    });

    if (error) throw new Error(error.message);

    return { success: true };
  },

  // OPNAME SCHEDULES
  createOpnameSchedule: async (config: OpnameScheduleConfig) => {
    const { error } = await supabase.from('opname_schedule').insert({
      nama: config.nama || 'Jadwal Rutin',
      tanggal_audit: config.dayOfMonth,
      waktu_jam: config.waktuJam,
      waktu_menit: config.waktuMenit,
      pengulangan: config.pengulangan,
      obat_ids: config.obatIds || null,
      durasi_pengerjaan: config.durasiPengerjaan || null,
      is_active: true,
    });
    if (error) throw error;
    return { success: true };
  },

  getOpnameSchedules: async (): Promise<OpnameSchedule[]> => {
    const { data, error } = await supabase
      .from('opname_schedule')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((s) => ({
      id: s.id.toString(),
      nama: s.nama,
      tanggalAudit: s.tanggal_audit,
      waktuJam: s.waktu_jam,
      waktuMenit: s.waktu_menit,
      pengulangan: s.pengulangan as PengulanganOpname,
      obatIds: s.obat_ids as string[] | null,
      durasiPengerjaan: s.durasi_pengerjaan,
      isActive: s.is_active,
    }));
  },

  updateOpnameSchedule: async (id: string, config: OpnameScheduleConfig) => {
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
      .eq('id', parseInt(id));

    if (error) throw error;
    return { success: true };
  },

  deleteOpnameSchedule: async (id: string) => {
    const { error } = await supabase
      .from('opname_schedule')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', parseInt(id));

    if (error) throw error;
  },

  toggleOpnameScheduleStatus: async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('opname_schedule')
      .update({ is_active: isActive })
      .eq('id', parseInt(id));

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
    return data.map((schedule) => {
      // tanggal_audit null diteruskan apa adanya (Date memperlakukannya sebagai 0)
      const nextDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        schedule.tanggal_audit as number,
      );
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
        scheduleId: schedule.id.toString(),
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

    return (data || []).map((item) => ({
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

    return (data || []).map((item) => ({
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
    let selectedObatIds: Json | null = null;

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
    await supabase.from('notifications').insert([
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
    // 1-3. Satu transaksi di database: opname menjadi 'sedang_dilaksanakan'
    // (stok terkunci), lalu detail dibuat dengan snapshot stok terbaru
    const { error: rpcError } = await supabase.rpc('complete_opname_step_one', {
      p_opname_id: parseInt(opnameId),
      p_selected_obat_ids: selectedProductIds,
    });

    if (rpcError) throw new Error(rpcError.message);

    // 4. Create notification for step 1→2 transition
    await supabase.from('notifications').insert([
      {
        type: 'OPNAME_STEP_CHANGED',
        title: 'Opname Dimulai',
        message: `Opname OPN-${opnameId} telah dimulai dan memasuki tahap 2: Input Stok Fisik. Aplikasi terkunci untuk menjaga integritas data.`,
        data: {
          opname_id: parseInt(opnameId),
          opname_number: `OPN-${opnameId}`,
          step: 2,
          product_count: selectedProductIds.length,
        },
        target_role: 'admin',
      },
      {
        type: 'OPNAME_STEP_CHANGED',
        title: 'Opname Dimulai',
        message: `Opname OPN-${opnameId} telah dimulai dan memasuki tahap 2: Input Stok Fisik. Aplikasi terkunci untuk menjaga integritas data.`,
        data: {
          opname_id: parseInt(opnameId),
          opname_number: `OPN-${opnameId}`,
          step: 2,
          product_count: selectedProductIds.length,
        },
        target_role: 'farmasi',
      },
    ]);

    return { success: true };
  },

  // Backward to Step 1: Delete all detail rows and reset to step 1
  backwardToStepOne: async (opnameId: string, scheduleObatIds: string[]) => {
    // Hapus detail dan reset ke step 1 dalam satu transaksi (kunci stok dilepas)
    const { error } = await supabase.rpc('backward_opname_to_step_one', {
      p_opname_id: parseInt(opnameId),
      p_schedule_obat_ids: scheduleObatIds,
    });

    if (error) throw new Error(error.message);

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
      opname: data
        ? {
            id: data.id.toString(),
            opnameNumber: `OPN-${data.id}`,
            currentStep: data.current_step || 1,
            startedAt: data.created_at,
          }
        : null,
    };
  },

  // NOTIFICATIONS
  createNotification: async (notification: {
    type: string;
    title: string;
    message: string;
    data?: Json;
    target_roles?: string[];
  }) => {
    const roles = notification.target_roles || [];

    if (roles.length === 0) {
      // Broadcast notification (target_role = null)
      const { error } = await supabase.from('notifications').insert({
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        target_role: null,
      });
      if (error) throw error;
    } else {
      // Insert one row per target role so each role receives the notification
      const rows = roles.map((role) => ({
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        target_role: role,
      }));
      const { error } = await supabase.from('notifications').insert(rows);
      if (error) throw error;
    }

    return { success: true };
  },

  // REPORTING
  getTransactionReport: async (startDate: string, endDate: string, params?: PaginationParams) => {
    const { page = 1, perPage = 10, status } = params || {};

    let query = supabase
      .from('transaksi')
      .select(
        `
        *,
        transaksi_detail:transaksi_detail!transaksi_detail_transaksi_id_fkey (*, master_obat(nama, jenis, merek, kandungan, harga)),
        transaksi_jasa:transaksi_jasa!transaksi_jasa_transaksi_id_fkey (*, master_jasa(nama))
      `,
      )
      .gte('tanggal', `${startDate}T00:00:00Z`)
      .lte('tanggal', `${endDate}T23:59:59Z`)
      .order('created_at', { ascending: false });

    if (status && status !== 'Semua') {
      const dbStatus = status === 'Menunggu' ? 'diajukan' : 'selesai';
      query = query.eq('status', dbStatus);
    }

    const { data, error } = await query;

    if (error) throw error;

    const profileMap = await getProfileNames((data || []).map((t) => t.created_by));

    const mappedData = (data || [])
      .map((t) => {
        const transactionMeta = extractTransactionNoteAndMeta(t.keterangan);
        const drugDetails =
          t.transaksi_detail?.map((d) => {
            const unitPrice =
              Number(d.harga || 0) > 0 ? Number(d.harga || 0) : Number(d.master_obat?.harga || 0);
            const subtotal =
              Number(d.subtotal || 0) > 0 ? Number(d.subtotal || 0) : (d.qty || 0) * unitPrice;

            return {
              id: d.id?.toString?.() || `${t.nomor}-${d.obat_id}`,
              name: getDisplayNameFromMasterObat(d.master_obat),
              quantity: d.qty || 0,
              price: unitPrice,
              subtotal,
            };
          }) || [];

        const serviceDetails =
          t.transaksi_jasa?.map((j) => ({
            id: j.id?.toString?.() || `${t.nomor}-${j.jasa_id}`,
            name: j.master_jasa?.nama || 'Unknown Service',
            quantity: j.qty || 1,
            price: j.harga_jasa || 0,
            subtotal: j.subtotal || (j.qty || 1) * (j.harga_jasa || 0),
          })) || [];

        const computedDrugTotal = drugDetails.reduce(
          (sum: number, item) => sum + Number(item.subtotal || 0),
          0,
        );
        const computedServiceTotal = serviceDetails.reduce(
          (sum: number, item) => sum + Number(item.subtotal || 0),
          0,
        );
        const serviceFee = Number(t.biaya_layanan ?? transactionMeta.meta.serviceFee ?? 0);
        const discount = Number(t.diskon || 0);
        const headerTotal = Number(t.total || 0);
        const normalizedTotal =
          headerTotal > 0
            ? headerTotal
            : computedDrugTotal + computedServiceTotal + serviceFee - discount;

        return {
          id: t.nomor,
          date: getTransactionEventTimestamp(t),
          type: t.tipe,
          source: t.tipe_sumber,
          status: t.status === 'diajukan' ? 'Menunggu' : 'Selesai',
          patient: t.nama_pasien,
          birthDate: t.tanggal_lahir_pasien,
          nakes: t.nama_nakes || (t.created_by && profileMap[t.created_by]) || '-',
          items:
            t.transaksi_detail
              ?.map((d) => `${getDisplayNameFromMasterObat(d.master_obat)} (${d.qty})`)
              .join(', ') || '',
          services:
            t.transaksi_jasa
              ?.map((j) => j.master_jasa?.nama)
              .filter(Boolean)
              .join(', ') || '-',
          serviceFee,
          discount,
          total: normalizedTotal,
          drugDetails,
          serviceDetails,
        };
      })
      .sort((a, b) => toDate(b.date).getTime() - toDate(a.date).getTime());

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
      totalPages: Math.ceil(totalFiltered / perPage),
    };
  },

  getOpnameById: async (opnameId: string) => {
    const { data, error } = await supabase
      .from('opname')
      .select(
        `
        *,
        opname_schedule(nama, obat_ids),
        opname_detail(*, master_obat(nama, satuan, jenis, merek, kandungan))
      `,
      )
      .eq('id', parseInt(opnameId))
      .is('deleted_at', null)
      .single();

    if (error) throw error;

    const auditorNames = await getProfileNames([data.created_by]);

    return {
      id: data.id.toString(),
      opnameNumber: `OPN-${data.id}`,
      scheduleDate: data.tanggal_jadwal,
      status: data.status as OpnameStatus,
      auditor: (data.created_by && auditorNames[data.created_by]) || '-',
      currentStep: data.current_step || 1,
      selectedObatIds: data.selected_obat_ids as OpnameObatIds | null,
      completedAt: data.completed_at,
      scheduleObatIds: (data.opname_schedule?.obat_ids as OpnameObatIds | null) || [],
      scheduleName: data.opname_schedule?.nama || 'Jadwal Opname',
      items: (data.opname_detail || []).map((d) => ({
        id: d.id.toString(),
        productId: d.obat_id!.toString(),
        productName: getDisplayNameFromMasterObat(d.master_obat),
        category: d.master_obat?.jenis || 'Obat',
        unit: d.master_obat?.satuan || 'Pcs',
        systemStock: d.stok_sistem,
        physicalStock: d.stok_fisik,
        difference: d.selisih,
        stokFinal: d.stok_final,
        reason: d.alasan,
        detailStatus: d.status as OpnameItem['detailStatus'],
      })),
    };
  },

  saveDraft: async (
    opnameId: string,
    step: number,
    detailUpdates?: {
      detailId: string;
      physicalStock?: number;
      stokFinal?: number;
      reason?: string;
    }[],
  ) => {
    // Step dan semua detail disimpan dalam satu request/transaksi;
    // selisih dihitung di database dari stok_sistem
    const { error } = await supabase.rpc('save_opname_details', {
      p_opname_id: parseInt(opnameId),
      p_step: step,
      p_updates: toOpnameDetailUpdates(detailUpdates),
    });

    if (error) throw new Error(error.message);

    return { success: true };
  },

  // Simpan detail opname TANPA mengubah current_step.
  // Digunakan oleh tombol "Simpan Draft" agar step di DB tidak berubah secara tidak sengaja.
  saveDetailOnly: async (
    opnameId: string,
    detailUpdates: {
      detailId: string;
      physicalStock?: number;
      stokFinal?: number;
      reason?: string;
    }[],
  ) => {
    if (!detailUpdates || detailUpdates.length === 0) return { success: true };

    const { error } = await supabase.rpc('save_opname_details', {
      p_opname_id: parseInt(opnameId),
      p_step: NO_STEP_CHANGE,
      p_updates: toOpnameDetailUpdates(detailUpdates),
    });

    if (error) throw new Error(error.message);

    return { success: true };
  },

  // Update selected products for an opname: update selected_obat_ids, delete existing details, re-create with fresh snapshots
  updateOpnameSelection: async (opnameId: string, selectedProductIds: string[]) => {
    const { error } = await supabase.rpc('update_opname_selection', {
      p_opname_id: parseInt(opnameId),
      p_selected_obat_ids: selectedProductIds,
    });

    if (error) throw new Error(error.message);

    return { success: true };
  },

  deleteOpname: async (opnameId: string) => {
    // Soft delete: mark as deleted instead of removing data
    const { error } = await supabase
      .from('opname')
      .update({ deleted_at: new Date().toISOString(), status: 'dihapus' })
      .eq('id', parseInt(opnameId));

    if (error) throw error;
    return { success: true };
  },

  updateOpnameDetail: async (detailId: string, physicalStock: number) => {
    const { data: detail, error: fetchError } = await supabase
      .from('opname_detail')
      .select('opname_id')
      .eq('id', parseInt(detailId))
      .single();
    if (fetchError) throw fetchError;

    const { error } = await supabase.rpc('save_opname_details', {
      p_opname_id: detail.opname_id!,
      p_step: NO_STEP_CHANGE,
      p_updates: toOpnameDetailUpdates([{ detailId, physicalStock }]),
    });

    if (error) throw new Error(error.message);
  },

  finishOpname: async (opnameId: string) => {
    // Satu transaksi di database: status detail, master_obat.qty, dan
    // status opname berubah bersamaan atau tidak sama sekali.
    const { error } = await supabase.rpc('finish_opname', {
      p_opname_id: parseInt(opnameId),
    });

    if (error) throw new Error(error.message);
  },

  resolveOpnameDifference: async (detailId: string, reason: string) => {
    const { error } = await supabase.rpc('resolve_opname_difference', {
      p_detail_id: parseInt(detailId),
      p_reason: reason,
    });

    if (error) throw new Error(error.message);
  },

  getOpnameHistory: async () => {
    const { data, error } = await supabase
      .from('opname')
      .select(
        `
        *,
        opname_schedule(nama),
        opname_detail (selisih)
      `,
      )
      .eq('status', 'selesai')
      .is('deleted_at', null)
      .order('completed_at', { ascending: false });

    if (error) throw error;

    const auditorNames = await getProfileNames((data || []).map((item) => item.created_by));

    return (data || []).map((item) => ({
      id: item.id.toString(),
      opnameNumber: `OPN-${item.id}`,
      date: item.completed_at || item.created_at,
      scheduleDate: item.tanggal_jadwal,
      scheduleName: item.opname_schedule?.nama || 'Jadwal Opname',
      auditor: (item.created_by && auditorNames[item.created_by]) || '-',
      itemsCount: item.opname_detail?.length || 0,
      discrepancyCount: (item.opname_detail || []).filter((d) => d.selisih !== 0).length,
      status: 'selesai',
    }));
  },

  getOpnameDetailView: async (opnameId: string) => {
    const { data, error } = await supabase
      .from('opname_detail')
      .select(`*, master_obat(nama, satuan, jenis, merek, kandungan)`)
      .eq('opname_id', parseInt(opnameId));

    if (error) throw error;

    return (data || []).map((d) => ({
      id: d.id.toString(),
      productName: getDisplayNameFromMasterObat(d.master_obat),
      stokSistem: d.stok_sistem,
      stokFisik: d.stok_fisik,
      selisih: d.selisih,
      stokFinal: d.stok_final,
      alasan: d.alasan || '-',
    }));
  },

  getDashboardStats: async () => {
    // 1. Total Barang Count
    const { count: totalProducts, error: countError } = await supabase
      .from('master_obat')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .is('deleted_at', null);

    if (countError) console.error('Error fetching product count', countError);

    // 2. Total Inventory Value (requires calculation)
    // Supabase doesn't have effortless sum() without RPC, so let's fetch minimal payload for now or use RPC if available.
    // For prototype: fetch all id, qty, harga. 2458 items is manageable but not scalable.
    // Ideally create a VIEW or RPC. Let's try JS side for now (safe for < 10k items).
    const { data: products, error: prodError } = await supabase
      .from('master_obat')
      .select('nama, qty, harga, jenis, buffer_stok, merek, kandungan')
      .eq('is_active', true)
      .is('deleted_at', null);

    if (prodError) console.error('Error fetching products for stats', prodError);

    let totalValue = 0;
    const categoryStats: Record<string, number> = {};

    products?.forEach((p) => {
      totalValue += (p.qty || 0) * (p.harga || 0);
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

    // 6. Low Stock Items: dihitung dari data produk di atas, karena PostgREST
    // tidak bisa membandingkan dua kolom (qty vs buffer_stok) dalam filter.
    const allLowStock = getLowStockItems(products ?? []);

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
      lowStockCount: allLowStock.length,
      lowStockItems: allLowStock.slice(0, 3).map((item) => ({
        ...item,
        nama: getProductDisplayNameFromDb(item),
      })),
      categoryDistribution: categoryStats,
      weeklyStockOut: weeklyData,
    };
  },

  getRecentStockOuts: async (limit: number = 10) => {
    const { data, error } = await supabase
      .from('transaksi')
      .select(
        `
        *,
        transaksi_detail:transaksi_detail!transaksi_detail_transaksi_id_fkey (
          qty,
          master_obat (nama, jenis, merek, kandungan)
        )
      `,
      )
      .eq('tipe', 'keluar')
      .eq('status', 'selesai')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data.map((t) => {
      const itemCount = t.transaksi_detail?.length || 0;
      const firstItemName =
        getDisplayNameFromMasterObat(t.transaksi_detail?.[0]?.master_obat) || 'Item';
      const totalQty = t.transaksi_detail?.reduce((acc: number, d) => acc + (d.qty || 0), 0) || 0;

      let title = 'Pengeluaran Stok';
      if (t.tipe_sumber === 'KASIR_LANGSUNG') {
        title = 'Stok Manual';
      } else if (t.tipe_sumber === 'PENGAJUAN_NAKES') {
        title = 'Permintaan Nakes';
      }

      // Use created_at for accurate timestamps
      const createdAt = toDate(t.created_at);
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
        timeStr = createdAt.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }

      const itemDesc = itemCount > 1 ? `${firstItemName} +${itemCount - 1} lainnya` : firstItemName;

      return {
        id: t.id,
        title,
        desc: `${itemDesc} (${totalQty} pcs) — ${t.nama_pasien || 'Umum'}`,
        time: timeStr,
        dotColor: t.tipe_sumber === 'KASIR_LANGSUNG' ? 'bg-primary' : 'bg-emerald-500',
      };
    });
  },

  getStockMutationReport: async (
    startDate: string,
    endDate: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<StockMutationRow>> => {
    const { page = 1, perPage = 10 } = params || {};

    // 1. Get transaction data (stok masuk/keluar)
    const { data, error } = await supabase
      .from('transaksi')
      .select(
        `
        created_at,
        processed_at,
        nomor,
        tipe,
        tipe_sumber,
        status,
        transaksi_detail:transaksi_detail!transaksi_detail_transaksi_id_fkey (qty, master_obat(nama, jenis, merek, kandungan))
      `,
      )
      .gte('created_at', `${startDate}T00:00:00Z`)
      .lte('created_at', `${endDate}T23:59:59Z`)
      .eq('status', 'selesai')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 2. Get completed opname data (penyesuaian stok)
    const { data: opnameData, error: opnameError } = await supabase
      .from('opname')
      .select(
        `
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
      `,
      )
      .eq('status', 'selesai')
      .is('deleted_at', null)
      .gte('completed_at', `${startDate}T00:00:00Z`)
      .lte('completed_at', `${endDate}T23:59:59Z`)
      .order('completed_at', { ascending: false });

    if (opnameError) throw opnameError;

    // Flatten transaction rows: one row per item
    const allRows: StockMutationRow[] = [];
    data.forEach((t) => {
      if (t.transaksi_detail && Array.isArray(t.transaksi_detail)) {
        t.transaksi_detail.forEach((d) => {
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
    (opnameData || []).forEach((o) => {
      if (o.opname_detail && Array.isArray(o.opname_detail)) {
        o.opname_detail.forEach((d) => {
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
    allRows.sort((a, b) => toDate(b.date).getTime() - toDate(a.date).getTime());

    // Apply pagination to flattened data
    const from = (page - 1) * perPage;
    const to = from + perPage;
    const paginatedRows = allRows.slice(from, to);

    return {
      data: paginatedRows,
      total: allRows.length,
      page,
      perPage,
      totalPages: Math.ceil(allRows.length / perPage),
    };
  },

  // Fetch all staff profiles for dropdowns
  getNakesProfiles: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, user_roles!inner(role)')
      .eq('user_roles.role', 'nakes')
      .order('full_name');
    if (error) throw error;
    return (data || []).map((p) => ({ id: p.id, full_name: p.full_name }));
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

  getRecentTransactions: async (page: number = 1, perPage: number = 5) => {
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data, count, error } = await supabase
      .from('transaksi')
      .select(
        `
            nomor,
            tanggal,
            created_at,
            tipe,
            status,
            transaksi_detail:transaksi_detail!transaksi_detail_transaksi_id_fkey (
                qty,
                master_obat (nama, jenis, merek, kandungan)
            )
        `,
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const formattedData = (data || []).map((t) => {
      const isIn = t.tipe === 'masuk';
      const details = t.transaksi_detail || [];
      const itemName =
        details.length > 0
          ? getDisplayNameFromMasterObat(details[0]?.master_obat) || 'Unknown'
          : 'Item Dihapus';
      const itemCategory = details.length > 0 ? details[0]?.master_obat?.jenis || '-' : '-';
      const itemCount = details.length;
      const totalQty = details.reduce((acc: number, curr) => acc + (curr.qty || 0), 0);

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
        date: toDate(t.tanggal).toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        icon: isIn ? 'arrow_downward' : 'arrow_upward',
        iconBg: isIn ? 'bg-green-100 dark:bg-green-500/20' : 'bg-red-100 dark:bg-red-500/20',
        iconColor: isIn ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
        isWarning: !isIn && t.status === 'diajukan',
      };
    });

    return {
      data: formattedData,
      total: count || 0,
      page,
      perPage,
      totalPages: Math.ceil((count || 0) / perPage),
    };
  },
};

type ApiResult<K extends keyof typeof api> = Awaited<ReturnType<(typeof api)[K]>>;
export type TransactionReportRow = ApiResult<'getTransactionReport'>['data'][number];
export type RecentTransaction = ApiResult<'getRecentTransactions'>['data'][number];
export type DashboardStats = ApiResult<'getDashboardStats'>;
export type OpnameDetail = ApiResult<'getOpnameById'>;
export type RecentStockOut = ApiResult<'getRecentStockOuts'>[number];
export type CreateTransactionPayload = Parameters<(typeof api)['createTransaction']>[0];
