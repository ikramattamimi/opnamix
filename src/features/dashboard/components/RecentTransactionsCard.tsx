import React from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/QueryState';
import { exportRecentTransactionsToExcel } from '@/features/reports/exportUtils';
import type { RecentTransaction } from '../api';
import type { useRecentTransactions } from '../useDashboard';

const EMPTY_TRANSACTIONS: RecentTransaction[] = [];

interface RecentTransactionsCardProps {
  page: number;
  onPageChange: React.Dispatch<React.SetStateAction<number>>;
  // Query tetap dibuat di Dashboard supaya berjalan bersamaan dengan query statistik
  query: ReturnType<typeof useRecentTransactions>;
}

const RecentTransactionsCard: React.FC<RecentTransactionsCardProps> = ({
  page,
  onPageChange,
  query,
}) => {
  const { data, isPending, isPlaceholderData, error, refetch } = query;
  const recentTrx = data?.data ?? EMPTY_TRANSACTIONS;
  // Halaman lama tetap ditampilkan (keepPreviousData) sampai halaman baru siap
  const totalPages = data?.totalPages ?? 1;
  const loading = isPending || isPlaceholderData;

  return (
    <div className="bg-card p-6 rounded-2xl shadow-soft">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h3 className="text-xl font-bold text-foreground">Transaksi Terbaru</h3>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="bg-background text-primary font-bold hover:shadow-md"
            onClick={() => void exportRecentTransactionsToExcel(recentTrx)}
            disabled={recentTrx.length === 0}
          >
            Ekspor Excel
          </Button>
          <div className="flex items-center bg-background rounded-xl p-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onPageChange((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="[&_svg]:size-5"
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft aria-hidden />
            </Button>
            <span className="text-xs font-bold px-2 min-w-[3rem] text-center">
              {page} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onPageChange((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="[&_svg]:size-5"
              aria-label="Halaman berikutnya"
            >
              <ChevronRight aria-hidden />
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingState label="Memuat transaksi..." className="py-10" />
      ) : error && !data ? (
        <ErrorState
          title="Gagal memuat transaksi"
          onRetry={() => void refetch()}
          className="py-10"
        />
      ) : recentTrx.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-100 dark:border-gray-800">
                <th className="pb-4 text-xs uppercase tracking-wider text-muted-foreground font-medium pl-2">
                  Nama Obat
                </th>
                <th className="pb-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Status
                </th>
                <th className="pb-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Kategori
                </th>
                <th className="pb-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Jumlah
                </th>
                <th className="pb-4 text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Tanggal
                </th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium text-foreground">
              {recentTrx.map((trx) => (
                <TransactionRow key={trx.id} trx={trx} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Belum ada transaksi terbaru." className="py-10" />
      )}
    </div>
  );
};

const TransactionRow: React.FC<{ trx: RecentTransaction }> = ({ trx }) => (
  <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
    <td className="py-4 pl-2 flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-full ${trx.iconBg} dark:bg-opacity-20 flex items-center justify-center ${trx.iconColor}`}
      >
        {trx.direction === 'in' ? (
          <ArrowDown className="size-5" aria-hidden />
        ) : (
          <ArrowUp className="size-5" aria-hidden />
        )}
      </div>
      <span className="font-bold">{trx.name}</span>
    </td>
    <td className="py-4">
      <span>{trx.status}</span>
    </td>
    <td className="py-4">{trx.category}</td>
    <td className="py-4 font-bold">{trx.amount}</td>
    <td className="py-4 text-muted-foreground">{trx.date}</td>
  </tr>
);

export default RecentTransactionsCard;
