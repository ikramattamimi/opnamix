import { supabase } from '@/lib/supabaseClient';

export const transactionsApi = {
  // HELPER: Generate unique transaction number from a database sequence
  // (format IN-YYYYMMDD-000123 / OUT-YYYYMMDD-000123)
  generateTransactionNumber: async (type: 'masuk' | 'keluar'): Promise<string> => {
    const { data, error } = await supabase.rpc('next_transaction_number', { p_tipe: type });
    if (error) throw new Error(error.message);
    return data as string;
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
};

export type CreateTransactionPayload = Parameters<(typeof transactionsApi)['createTransaction']>[0];
