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
