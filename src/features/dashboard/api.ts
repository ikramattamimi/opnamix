import { supabase } from '@/lib/supabaseClient';
import type { ApiResult } from '@/types/api';
import { toDate } from '@/lib/utils';
import {
  getDisplayNameFromMasterObat,
  getProductDisplayNameFromDb,
} from '@/features/products/productDisplay';
import { getLowStockItems } from './lowStock';

export const dashboardApi = {
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

export type DashboardStats = ApiResult<typeof dashboardApi.getDashboardStats>;
export type RecentTransaction = ApiResult<
  typeof dashboardApi.getRecentTransactions
>['data'][number];
