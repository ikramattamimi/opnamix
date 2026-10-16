import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/common/StatCard';
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ClipboardClock,
  Download,
  Pill,
  TrendingUp,
  Upload,
  Wallet,
} from 'lucide-react';
import type { DashboardStats, RecentTransaction } from './api';
import { useDashboardStats, useRecentTransactions } from './useDashboard';
import { exportRecentTransactionsToExcel } from '@/features/reports/exportUtils';

const EMPTY_TRANSACTIONS: RecentTransaction[] = [];

const Dashboard: React.FC = () => {
  const { data: stats, isPending: loading, error: statsError } = useDashboardStats();

  // Pagination state for recent transactions
  const [trxPage, setTrxPage] = useState(1);
  const {
    data: trxData,
    isPending: trxPending,
    isPlaceholderData: trxPlaceholder,
    error: trxError,
  } = useRecentTransactions(trxPage, 5);
  const recentTrx = trxData?.data ?? EMPTY_TRANSACTIONS;
  // Halaman lama tetap ditampilkan (keepPreviousData) sampai halaman baru siap
  const trxTotalPages = trxData?.totalPages ?? 1;
  const trxLoading = trxPending || trxPlaceholder;

  useEffect(() => {
    if (statsError) console.error('Failed to fetch dashboard stats', statsError);
  }, [statsError]);

  useEffect(() => {
    if (trxError) console.error('Failed to fetch recent transactions', trxError);
  }, [trxError]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Fallback if stats fail
  const safeStats: DashboardStats = stats || {
    totalProducts: 0,
    totalValue: 0,
    stokMasuk: 0,
    stokKeluar: 0,
    tertunda: 0,
    recentTransactions: [],
    lowStockCount: 0,
    lowStockItems: [],
    categoryDistribution: {},
    weeklyStockOut: [],
  };

  // Process Category Distribution for Pie Chart
  const totalItems = Object.values(safeStats.categoryDistribution).reduce((a, b) => a + b, 0);
  /* eslint-disable @typescript-eslint/no-unused-vars -- dipakai blok "Charts Row" yang sedang dikomentari */
  const safeTotalItems = totalItems || 1; // Prevent divide by zero
  const categories = Object.keys(safeStats.categoryDistribution);
  // Simple color mapping
  const categoryColors: Record<string, string> = {
    Obat: 'bg-primary',
    'BHP (Habis Pakai)': 'bg-secondary',
    'Alat Kesehatan': 'bg-orange-400',
    Imunisasi: 'bg-green-400',
  };
  /* eslint-enable @typescript-eslint/no-unused-vars */

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        <StatCard
          label="Total Barang"
          value={safeStats.totalProducts.toLocaleString()}
          icon={Pill}
          color="primary"
        />
        <StatCard
          label="Stok Masuk"
          value={safeStats.stokMasuk.toLocaleString()}
          icon={Download}
          color="primary"
        />
        <StatCard
          label="Stok Keluar"
          value={safeStats.stokKeluar.toLocaleString()}
          icon={Upload}
          color="primary"
        />
        <StatCard
          label="Tertunda"
          value={safeStats.tertunda.toLocaleString()}
          icon={ClipboardClock}
          color="primary"
        />

        <div className="bg-card-light dark:bg-card-dark p-4 rounded-DEFAULT shadow-soft flex items-center col-span-1 md:col-span-2 xl:col-span-2">
          <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-4">
            <Wallet className="text-primary size-6" aria-hidden />
          </div>
          <div>
            <p className="text-sm text-text-secondary-light font-medium">Total Nilai Inventaris</p>
            <h3 className="text-2xl font-bold text-text-primary-light dark:text-white">
              Rp {safeStats.totalValue.toLocaleString('id-ID')}
            </h3>
          </div>
          {/* Pertumbuhan dihitung dari data real (placeholder untuk implementasi lengkap) */}
          <div className="ml-auto flex items-center text-green-500 text-sm font-bold bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-lg">
            <TrendingUp className="size-5 mr-1" aria-hidden />
            Real-time
          </div>
        </div>
      </div>

      {/* Charts Row */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card-light dark:bg-card-dark p-6 rounded-DEFAULT shadow-soft h-full">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-text-primary-light dark:text-white">Pengeluaran 7 Hari Terakhir</h3>
              <p className="text-sm text-text-secondary-light">Jumlah transaksi keluar per hari</p>
            </div>
            <Button variant="ghost" size="icon" className="bg-background-light dark:bg-background-dark text-primary hover:bg-gray-200 dark:hover:bg-gray-700">
              <ChartColumn className="size-5" aria-hidden />
            </Button>
          </div>
           TODO: Ambil data konsumsi mingguan dari API (jumlah transaksi keluar per hari dalam 7 hari terakhir)
          <div className="h-64 flex items-end justify-between gap-2 px-2">
            {(() => {
              const weekly = safeStats.weeklyStockOut || [];
              const maxVal = Math.max(...weekly.map((w) => w.count), 1);
              return weekly.map((item, idx) => {
                const pct = Math.max((item.count / maxVal) * 100, 4); // min 4% for visibility
                return (
                  <div key={idx} className="flex flex-col items-center w-full group">
                    <span className="text-xs font-bold text-primary mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{item.count}</span>
                    <div className="relative w-3 rounded-full bg-background-light dark:bg-background-dark h-48 overflow-hidden">
                      <div 
                        className="absolute bottom-0 w-full bg-primary group-hover:bg-blue-600 transition-all duration-300 rounded-full" 
                        style={{ height: `${pct}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-text-secondary-light mt-2">{item.day}</span>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        <div className="grid grid-rows-2 gap-5">
          <div className="bg-card-light dark:bg-card-dark p-6 rounded-DEFAULT shadow-soft flex flex-col justify-center">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-text-primary-light dark:text-white">Peringatan Stok Rendah</h3>
                <p className="text-sm text-text-secondary-light">Item di bawah ambang batas</p>
              </div>
              <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-2 rounded-lg">
                <TriangleAlert className="size-6" aria-hidden />
              </div>
            </div>
            <div className="space-y-3">
              {safeStats.lowStockItems.length > 0 ? (
                safeStats.lowStockItems.map((item, idx) => (
                  <LowStockItem key={idx} name={item.nama} count={item.qty} color="bg-red-500" />
                ))
              ) : (
                <p className="text-sm text-green-500 font-medium">Stok Aman, tidak ada item kritis.</p>
              )}
            </div>
          </div>

          <div className="bg-card-light dark:bg-card-dark p-6 rounded-DEFAULT shadow-soft flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-text-primary-light dark:text-white mb-1">Pembagian Inventaris</h3>
              <p className="text-sm text-text-secondary-light mb-4">Berdasarkan Kategori</p>
              <div className="space-y-2">
                {categories.slice(0, 3).map((cat, idx) => (
                   <div key={idx} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${categoryColors[cat] || 'bg-gray-400'}`}></div>
                    <span className="text-xs text-text-secondary-light">
                       {cat} ({Math.round(((safeStats.categoryDistribution[cat] as number) / safeTotalItems) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative w-32 h-32 flex items-center justify-center">
              <div 
                className="w-full h-full rounded-full" 
                style={{ 
                  background: (() => {
                    const colors = ['#4318FF', '#6AD2FF', '#F59E0B', '#10B981'];
                    let currentDeg = 0;
                    const gradients = categories.slice(0, 4).map((cat, idx) => {
                       const percentage = ((safeStats.categoryDistribution[cat] as number) / safeTotalItems);
                      const degrees = percentage * 360;
                      const startDeg = currentDeg;
                      currentDeg += degrees;
                      return `${colors[idx % colors.length]} ${startDeg}deg ${currentDeg}deg`;
                    });
                    return `conic-gradient(${gradients.join(', ')})`;
                  })()
                }}
              ></div>
              <div className="absolute inset-0 m-auto w-16 h-16 bg-card-light dark:bg-card-dark rounded-full"></div>
            </div>
          </div>
        </div>
      </div> */}

      {/* Recent Transactions Table */}
      <div className="bg-card-light dark:bg-card-dark p-6 rounded-DEFAULT shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h3 className="text-xl font-bold text-text-primary-light dark:text-white">
            Transaksi Terbaru
          </h3>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="bg-background-light dark:bg-background-dark text-primary font-bold hover:shadow-md"
              onClick={() => void exportRecentTransactionsToExcel(recentTrx)}
              disabled={recentTrx.length === 0}
            >
              Ekspor Excel
            </Button>
            <div className="flex items-center bg-background-light dark:bg-background-dark rounded-xl p-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTrxPage((p) => Math.max(1, p - 1))}
                disabled={trxPage === 1 || trxLoading}
                className="h-8 w-8 [&_svg]:size-5"
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft aria-hidden />
              </Button>
              <span className="text-xs font-bold px-2 min-w-[3rem] text-center">
                {trxPage} / {trxTotalPages}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTrxPage((p) => Math.min(trxTotalPages, p + 1))}
                disabled={trxPage === trxTotalPages || trxLoading}
                className="h-8 w-8 [&_svg]:size-5"
                aria-label="Halaman berikutnya"
              >
                <ChevronRight aria-hidden />
              </Button>
            </div>
          </div>
        </div>

        {trxLoading ? (
          <div className="py-10 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-text-secondary-light">Memuat transaksi...</p>
          </div>
        ) : recentTrx.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-gray-100 dark:border-gray-800">
                  <th className="pb-4 text-xs uppercase tracking-wider text-text-secondary-light font-medium pl-2">
                    Nama Obat
                  </th>
                  <th className="pb-4 text-xs uppercase tracking-wider text-text-secondary-light font-medium">
                    Status
                  </th>
                  <th className="pb-4 text-xs uppercase tracking-wider text-text-secondary-light font-medium">
                    Kategori
                  </th>
                  <th className="pb-4 text-xs uppercase tracking-wider text-text-secondary-light font-medium">
                    Jumlah
                  </th>
                  <th className="pb-4 text-xs uppercase tracking-wider text-text-secondary-light font-medium">
                    Tanggal
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium text-text-primary-light dark:text-white">
                {recentTrx.map((trx) => (
                  <TransactionRow
                    key={trx.id}
                    name={trx.name}
                    status={trx.status}
                    category={trx.category}
                    amount={trx.amount}
                    date={trx.date}
                    direction={trx.direction}
                    iconBg={trx.iconBg}
                    iconColor={trx.iconColor}
                    isWarning={trx.isWarning}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-text-secondary-light">
            Belum ada transaksi terbaru.
          </div>
        )}
      </div>
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- dipakai blok "Charts Row" yang sedang dikomentari
const LowStockItem: React.FC<{ name: string; count: number; color: string }> = ({
  name,
  count,
  color,
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full ${color}`}></div>
      <span className="text-sm font-medium text-text-primary-light dark:text-white">{name}</span>
    </div>
    <span
      className={`text-xs font-bold ${color === 'bg-red-500' ? 'text-red-500 bg-red-50' : 'text-orange-500 bg-orange-50'} dark:bg-opacity-10 px-2 py-1 rounded`}
    >
      Sisa {count}
    </span>
  </div>
);

const TransactionRow: React.FC<{
  name: string;
  status: string;
  category: string;
  amount: string;
  date: string;
  direction: 'in' | 'out';
  iconBg: string;
  iconColor: string;
  isWarning?: boolean;
}> = ({ name, status, category, amount, date, direction, iconBg, iconColor }) => (
  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
    <td className="py-4 pl-2 flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-full ${iconBg} dark:bg-opacity-20 flex items-center justify-center ${iconColor}`}
      >
        {direction === 'in' ? (
          <ArrowDown className="size-5" aria-hidden />
        ) : (
          <ArrowUp className="size-5" aria-hidden />
        )}
      </div>
      <span className="font-bold">{name}</span>
    </td>
    <td className="py-4">
      <span>{status}</span>
    </td>
    <td className="py-4">{category}</td>
    <td className="py-4 font-bold">{amount}</td>
    <td className="py-4 text-text-secondary-light">{date}</td>
  </tr>
);

export default Dashboard;
