import { supabase } from '@/lib/supabaseClient';
import type { Tables } from '@/lib/database.types';
import { toDate } from '@/lib/utils';
import { getProfileNames } from '@/lib/profiles';
import { mapProductFromDB, type ProductRow } from '@/features/products/mappers';
import { extractTransactionNoteAndMeta } from '@/features/stock-out/mappers';
import { isExpiringSoon } from '@/features/stock-in/expiry';
import type { ExpiringBatch, MutationRow, TransactionRow } from './types';

// Data Laporan Stok dan Dashboard. Semua baris dalam rentang dikembalikan
// sekaligus: grafik butuh seluruh baris, tabel memaginasi di client.

const PRODUCT_JOIN = 'master_obat(*, product_ingredients(nama_zat, kekuatan, urutan))';

type DetailRow = Pick<
  Tables<'transaksi_detail'>,
  'qty' | 'batch' | 'expire_date' | 'harga' | 'subtotal' | 'obat_id' | 'id'
> & {
  master_obat: ProductRow | null;
};

type TrxRow = Pick<
  Tables<'transaksi'>,
  | 'id'
  | 'nomor'
  | 'tipe'
  | 'tipe_sumber'
  | 'status'
  | 'nama_pasien'
  | 'nama_nakes'
  | 'keterangan'
  | 'created_at'
  | 'processed_at'
  | 'tanggal'
  | 'created_by'
  | 'processed_by'
  | 'total'
  | 'diskon'
  | 'biaya_layanan'
> & {
  transaksi_detail: DetailRow[] | null;
  transaksi_jasa?: (Pick<Tables<'transaksi_jasa'>, 'id' | 'qty' | 'harga_jasa' | 'subtotal'> & {
    master_jasa: { nama: string } | null;
  })[];
};

const eventTime = (t: Pick<TrxRow, 'processed_at' | 'created_at' | 'tanggal'>) =>
  t.processed_at || t.created_at || t.tanggal || new Date().toISOString();

const invoiceOf = (keterangan: string | null) =>
  keterangan?.startsWith('Invoice: ') ? keterangan.replace('Invoice: ', '').trim() : null;

export const reportsApi = {
  /** Mutasi stok: item stok masuk, stok keluar selesai, dan penyesuaian opname */
  getStockMutations: async (from: Date, to: Date): Promise<MutationRow[]> => {
    const [trxRes, opnameRes] = await Promise.all([
      supabase
        .from('transaksi')
        .select(
          `id, nomor, tipe, tipe_sumber, status, nama_pasien, keterangan, created_at, processed_at, tanggal, created_by, processed_by,
           transaksi_detail:transaksi_detail!transaksi_detail_transaksi_id_fkey (id, qty, batch, expire_date, harga, subtotal, obat_id, ${PRODUCT_JOIN})`,
        )
        .eq('status', 'selesai')
        .is('deleted_at', null)
        .gte('created_at', from.toISOString())
        .lte('created_at', to.toISOString()),
      supabase
        .from('opname')
        .select(
          `id, completed_at, created_by,
           opname_detail (id, stok_sistem, stok_fisik, stok_final, alasan, ${PRODUCT_JOIN})`,
        )
        .eq('status', 'selesai')
        .is('deleted_at', null)
        .gte('completed_at', from.toISOString())
        .lte('completed_at', to.toISOString()),
    ]);
    if (trxRes.error) throw trxRes.error;
    if (opnameRes.error) throw opnameRes.error;

    const trx = (trxRes.data ?? []) as unknown as TrxRow[];
    const opnames = opnameRes.data ?? [];
    const names = await getProfileNames([
      ...trx.flatMap((t) => [t.created_by, t.processed_by]),
      ...opnames.map((o) => o.created_by),
    ]);
    const nameOf = (id: string | null) => (id && names[id]) || '-';

    const rows: MutationRow[] = [];
    for (const t of trx) {
      const isIn = t.tipe === 'masuk';
      for (const d of t.transaksi_detail ?? []) {
        if (!d.master_obat) continue;
        const product = mapProductFromDB(d.master_obat);
        const qty = isIn ? d.qty : -d.qty;
        rows.push({
          key: `t${d.id}`,
          date: eventTime(t),
          code: t.nomor ?? `TRX-${t.id}`,
          type: isIn ? 'Masuk' : 'Keluar',
          product,
          qty,
          value: Math.abs(qty) * product.purchasePrice,
          by: nameOf(isIn ? t.created_by : t.processed_by || t.created_by),
          note: isIn
            ? [t.nama_pasien || 'Pemasok', d.batch && `batch ${d.batch}`, invoiceOf(t.keterangan)]
                .filter(Boolean)
                .join(' · ')
            : `${t.tipe_sumber === 'KASIR_LANGSUNG' ? 'Manual' : 'Permintaan'} · ${t.nama_pasien || '-'}`,
          link: isIn ? { kind: 'stock-in' } : { kind: 'stock-out', id: t.nomor ?? '' },
        });
      }
    }
    for (const o of opnames) {
      for (const d of o.opname_detail ?? []) {
        const final = d.stok_final ?? d.stok_fisik;
        const master = (d as unknown as { master_obat: ProductRow | null }).master_obat;
        if (final === null || d.stok_sistem === null || final === d.stok_sistem || !master)
          continue;
        const product = mapProductFromDB(master);
        const qty = final - d.stok_sistem;
        rows.push({
          key: `o${d.id}`,
          date: o.completed_at ?? new Date().toISOString(),
          code: `OPN-${o.id}`,
          type: 'Penyesuaian',
          product,
          qty,
          value: Math.abs(qty) * product.purchasePrice,
          by: nameOf(o.created_by),
          note: `Opname${d.alasan ? ` · ${d.alasan}` : ''}`,
          link: { kind: 'opname', id: o.id.toString() },
        });
      }
    }
    return rows.sort((a, b) => toDate(b.date).getTime() - toDate(a.date).getTime());
  },

  /** Transaksi stok keluar (permintaan dan manual) dalam rentang */
  getTransactions: async (from: Date, to: Date): Promise<TransactionRow[]> => {
    const { data, error } = await supabase
      .from('transaksi')
      .select(
        `id, nomor, tipe, tipe_sumber, status, nama_pasien, nama_nakes, keterangan, created_at, processed_at, tanggal, created_by, processed_by, total, diskon, biaya_layanan,
         transaksi_detail:transaksi_detail!transaksi_detail_transaksi_id_fkey (id, qty, batch, expire_date, harga, subtotal, obat_id, ${PRODUCT_JOIN}),
         transaksi_jasa:transaksi_jasa!transaksi_jasa_transaksi_id_fkey (id, qty, harga_jasa, subtotal, master_jasa(nama))`,
      )
      .eq('tipe', 'keluar')
      .is('deleted_at', null)
      .gte('created_at', from.toISOString())
      .lte('created_at', to.toISOString());
    if (error) throw error;

    const rows = (data ?? []) as unknown as TrxRow[];
    const names = await getProfileNames(rows.flatMap((t) => [t.created_by, t.processed_by]));

    return rows
      .map((t): TransactionRow => {
        const meta = extractTransactionNoteAndMeta(t.keterangan);
        const drugs = (t.transaksi_detail ?? []).map((d) => {
          const product = d.master_obat ? mapProductFromDB(d.master_obat) : null;
          const price = Number(d.harga || 0) > 0 ? Number(d.harga) : (product?.sellingPrice ?? 0);
          return {
            id: d.id.toString(),
            productId: product?.id ?? String(d.obat_id ?? ''),
            name: product?.name ?? 'Produk dihapus',
            brand: product?.brand ?? '',
            unit: product?.unit ?? '',
            quantity: d.qty,
            price,
            subtotal: Number(d.subtotal || 0) > 0 ? Number(d.subtotal) : d.qty * price,
          };
        });
        const services = (t.transaksi_jasa ?? []).map((j) => ({
          id: j.id.toString(),
          name: j.master_jasa?.nama ?? 'Jasa',
          quantity: j.qty || 1,
          price: j.harga_jasa || 0,
          subtotal: j.subtotal || (j.qty || 1) * (j.harga_jasa || 0),
        }));
        const drugTotal = drugs.reduce((s, d) => s + d.subtotal, 0);
        const serviceTotal = services.reduce((s, d) => s + d.subtotal, 0);
        const serviceFee = Number(t.biaya_layanan ?? meta.meta.serviceFee ?? 0);
        const discount = Number(t.diskon || 0);
        const total =
          Number(t.total || 0) > 0
            ? Number(t.total)
            : drugTotal + serviceTotal + serviceFee - discount;
        return {
          id: t.id.toString(),
          code: t.nomor ?? `TRX-${t.id}`,
          date: t.created_at || t.tanggal || new Date().toISOString(),
          processedAt: t.processed_at,
          kind: t.tipe_sumber === 'KASIR_LANGSUNG' ? 'Manual' : 'Permintaan',
          status: t.status === 'diajukan' ? 'Menunggu' : 'Selesai',
          patient: t.nama_pasien || '-',
          requestedBy: t.nama_nakes || (t.created_by && names[t.created_by]) || '-',
          processedBy: (t.processed_by && names[t.processed_by]) || null,
          note: meta.note,
          drugs,
          services,
          drugTotal,
          serviceTotal,
          serviceFee,
          discount,
          total,
        };
      })
      .sort((a, b) => toDate(b.date).getTime() - toDate(a.date).getTime());
  },

  /** Batch dari stok masuk yang kedaluwarsa dalam `months` bulan (termasuk yang sudah lewat) */
  getExpiringBatches: async (months: number): Promise<ExpiringBatch[]> => {
    const limit = new Date();
    limit.setMonth(limit.getMonth() + months);
    const { data, error } = await supabase
      .from('transaksi_detail')
      .select(
        `id, qty, batch, expire_date, obat_id, ${PRODUCT_JOIN},
         transaksi!transaksi_detail_transaksi_id_fkey!inner(id, tipe, status, nama_pasien, deleted_at)`,
      )
      .not('expire_date', 'is', null)
      .lte('expire_date', limit.toISOString().slice(0, 10))
      .eq('transaksi.tipe', 'masuk')
      .eq('transaksi.status', 'selesai')
      .is('transaksi.deleted_at', null)
      .order('expire_date', { ascending: true });
    if (error) throw error;

    const seen = new Set<string>();
    const out: ExpiringBatch[] = [];
    for (const row of (data ?? []) as unknown as (DetailRow & {
      transaksi: { nama_pasien: string | null };
    })[]) {
      if (!row.master_obat || !isExpiringSoon(row.expire_date, new Date(), months)) continue;
      const product = mapProductFromDB(row.master_obat);
      // Produk yang sudah habis tidak perlu diingatkan
      if (product.stock <= 0) continue;
      const key = `${product.id}|${row.batch ?? ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        key,
        product,
        batch: row.batch,
        expireDate: row.expire_date!,
        quantity: row.qty,
        supplier: row.transaksi?.nama_pasien ?? null,
      });
    }
    return out;
  },
};
