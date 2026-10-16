// Stok rendah: qty <= buffer_stok, sama seperti trigger notifikasi STOCK_LOW,
// tabel produk, dan laporan stok. Nilai null dihitung 0.
export interface StockLevel {
  qty: number | null;
  buffer_stok: number | null;
}

export const isLowStock = (item: StockLevel): boolean => (item.qty ?? 0) <= (item.buffer_stok ?? 0);

// Item stok rendah, mulai dari qty paling sedikit (paling mendesak).
export const getLowStockItems = <T extends StockLevel>(items: T[], limit?: number): T[] => {
  const sorted = items.filter(isLowStock).sort((a, b) => (a.qty ?? 0) - (b.qty ?? 0));
  return limit === undefined ? sorted : sorted.slice(0, limit);
};
