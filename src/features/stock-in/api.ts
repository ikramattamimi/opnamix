import { supabase } from '@/lib/supabaseClient';
import { StockInReceipt, PaginationParams, PaginatedResponse } from '@/types';
import { getProfileNames } from '@/lib/profiles';
import { getDisplayNameFromMasterObat } from '@/features/products/productDisplay';

export const stockInApi = {
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
};
