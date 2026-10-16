import { supabase } from '@/lib/supabaseClient';
import { StockOutRequest, PaginationParams, PaginatedResponse } from '@/types';
import type { ApiResult } from '@/types/api';
import { toDate } from '@/lib/utils';
import { getDisplayNameFromMasterObat } from '@/features/products/productDisplay';
import { extractTransactionNoteAndMeta } from './mappers';

export const stockOutApi = {
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
};

export type RecentStockOut = ApiResult<typeof stockOutApi.getRecentStockOuts>[number];
