import { isExpiringSoon } from './expiry';
import type { StockInReceipt } from './types';

// Logika tampilan daftar Stok Masuk: filter, ringkasan header, dan batch yang
// kedaluwarsa kurang dari 6 bulan lagi.

// Jam dicatat (created_at)
export const receiptTime = (r: Pick<StockInReceipt, 'createdAt' | 'date'>) =>
  new Date(r.createdAt || r.date);

// Tanggal terima yang diisi pengguna (bisa mundur dari waktu dicatat), sebagai
// tanggal lokal supaya tidak bergeser zona waktu
export const receiptDate = (r: Pick<StockInReceipt, 'date'>) => {
  const [y, m, d] = r.date.split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : new Date(r.date);
};

export const expiringItems = (r: Pick<StockInReceipt, 'items'>, now: Date = new Date()) =>
  r.items.filter((item) => isExpiringSoon(item.expiryDate, now));

export const totalUnits = (r: Pick<StockInReceipt, 'items'>) =>
  r.items.reduce((sum, item) => sum + item.quantity, 0);

export const ALL_SUPPLIERS = 'Semua';

export function filterReceipts(
  list: readonly StockInReceipt[],
  {
    query,
    supplier,
    expiring,
    now = new Date(),
  }: { query: string; supplier: string; expiring: boolean; now?: Date },
): StockInReceipt[] {
  const q = query.trim().toLocaleLowerCase('id-ID');
  return (
    list
      .filter(
        (r) =>
          (supplier === ALL_SUPPLIERS || r.supplierName === supplier) &&
          (!expiring || expiringItems(r, now).length > 0) &&
          (!q || `${r.supplierName} ${r.invoiceNumber}`.toLocaleLowerCase('id-ID').includes(q)),
      )
      // Urut tanggal terima terbaru supaya grup per hari tidak terpecah; urutan
      // dicatat dipertahankan di dalam hari yang sama (sort stabil)
      .sort((a, b) => b.date.localeCompare(a.date))
  );
}

// Penerimaan dan nilai pembelian bulan ini, serta jumlah batch kedaluwarsa dekat
export function stockInStats(list: readonly StockInReceipt[], now: Date = new Date()) {
  let monthCount = 0;
  let monthValue = 0;
  let expiringBatches = 0;
  for (const r of list) {
    const time = receiptDate(r);
    if (time.getFullYear() === now.getFullYear() && time.getMonth() === now.getMonth()) {
      monthCount += 1;
      monthValue += r.total;
    }
    expiringBatches += expiringItems(r, now).length;
  }
  return { monthCount, monthValue, expiringBatches };
}

export const supplierNames = (list: readonly StockInReceipt[]) =>
  [...new Set(list.map((r) => r.supplierName).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'id-ID'),
  );
