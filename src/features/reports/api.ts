import { supabase } from '@/lib/supabaseClient';
import { PaginationParams, PaginatedResponse } from '@/types/pagination';
import type { ApiResult } from '@/types/api';
import { toDate } from '@/lib/utils';
import { getProfileNames } from '@/lib/profiles';
import { getDisplayNameFromMasterObat } from '@/features/products/productDisplay';
import { extractTransactionNoteAndMeta } from '@/features/stock-out/mappers';
import type { StockMutationRow } from './types';

const getTransactionEventTimestamp = (transaction: {
  processed_at?: string | null;
  created_at?: string | null;
  tanggal?: string | null;
}) => transaction?.processed_at || transaction?.created_at || transaction?.tanggal;

export const reportsApi = {
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
};

export type TransactionReportRow = ApiResult<
  typeof reportsApi.getTransactionReport
>['data'][number];
