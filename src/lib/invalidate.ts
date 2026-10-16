import { QueryClient } from '@tanstack/react-query';
import { dashboardKeys } from '@/features/dashboard/keys';
import { opnameKeys } from '@/features/opname/keys';
import { productKeys } from '@/features/products/keys';
import { reportKeys } from '@/features/reports/keys';
import { stockInKeys } from '@/features/stock-in/keys';
import { stockOutKeys } from '@/features/stock-out/keys';

// Invalidasi lintas domain. Daftar lengkap siapa memicu apa ada di
// .ai/conventions/data-fetching.md; tambahkan di sini, jangan di tiap hook.

// Setelah stok obat berubah: transaksi stok masuk/keluar diproses.
export const invalidateStockChange = (queryClient: QueryClient) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: productKeys.all }),
    queryClient.invalidateQueries({ queryKey: stockInKeys.all }),
    queryClient.invalidateQueries({ queryKey: stockOutKeys.all }),
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
    queryClient.invalidateQueries({ queryKey: reportKeys.all }),
  ]);

// Setelah status opname berubah (mulai, pindah langkah, selesai, hapus).
// Opname selesai juga mengubah stok, jadi data stok ikut di-refresh.
export const invalidateOpnameChange = (queryClient: QueryClient) =>
  Promise.all([
    queryClient.invalidateQueries({ queryKey: opnameKeys.all }),
    invalidateStockChange(queryClient),
  ]);
