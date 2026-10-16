import React, { useEffect, useState } from 'react';
import { ErrorState, LoadingState } from '@/components/common/QueryState';
import type { DashboardStats } from './api';
import { useDashboardStats, useRecentTransactions } from './useDashboard';
import DashboardMetrics from './components/DashboardMetrics';
import RecentTransactionsCard from './components/RecentTransactionsCard';

const Dashboard: React.FC = () => {
  const {
    data: stats,
    isPending: loading,
    error: statsError,
    refetch: refetchStats,
  } = useDashboardStats();

  // Pagination state for recent transactions
  const [trxPage, setTrxPage] = useState(1);
  const trxQuery = useRecentTransactions(trxPage, 5);
  const trxError = trxQuery.error;

  useEffect(() => {
    if (statsError) console.error('Failed to fetch dashboard stats', statsError);
  }, [statsError]);

  useEffect(() => {
    if (trxError) console.error('Failed to fetch recent transactions', trxError);
  }, [trxError]);

  if (loading) {
    return <LoadingState label="Memuat dashboard..." className="h-64" />;
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

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      {statsError && !stats ? (
        <div className="bg-card-light dark:bg-card-dark rounded-DEFAULT shadow-soft">
          <ErrorState title="Gagal memuat ringkasan stok" onRetry={() => void refetchStats()} />
        </div>
      ) : (
        <DashboardMetrics stats={safeStats} />
      )}

      {/* Charts Row: belum ditampilkan, lihat components/DashboardCharts.tsx */}
      {/* <DashboardCharts stats={safeStats} /> */}

      <RecentTransactionsCard page={trxPage} onPageChange={setTrxPage} query={trxQuery} />
    </div>
  );
};

export default Dashboard;
