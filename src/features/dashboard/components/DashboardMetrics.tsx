import React from 'react';
import { ClipboardClock, Download, Pill, TrendingUp, Upload, Wallet } from 'lucide-react';
import StatCard from '@/components/common/StatCard';
import type { DashboardStats } from '../api';

const DashboardMetrics: React.FC<{ stats: DashboardStats }> = ({ stats }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
    <StatCard
      label="Total Barang"
      value={stats.totalProducts.toLocaleString()}
      icon={Pill}
      color="primary"
    />
    <StatCard
      label="Stok Masuk"
      value={stats.stokMasuk.toLocaleString()}
      icon={Download}
      color="primary"
    />
    <StatCard
      label="Stok Keluar"
      value={stats.stokKeluar.toLocaleString()}
      icon={Upload}
      color="primary"
    />
    <StatCard
      label="Tertunda"
      value={stats.tertunda.toLocaleString()}
      icon={ClipboardClock}
      color="primary"
    />

    <div className="bg-card p-4 rounded-DEFAULT shadow-soft flex items-center col-span-1 md:col-span-2 xl:col-span-2">
      <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mr-4">
        <Wallet className="text-primary size-6" aria-hidden />
      </div>
      <div>
        <p className="text-sm text-muted-foreground font-medium">Total Nilai Inventaris</p>
        <h3 className="text-2xl font-bold text-foreground">
          Rp {stats.totalValue.toLocaleString('id-ID')}
        </h3>
      </div>
      {/* Pertumbuhan dihitung dari data real (placeholder untuk implementasi lengkap) */}
      <div className="ml-auto flex items-center text-green-700 dark:text-green-300 text-sm font-bold bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-lg">
        <TrendingUp className="size-5 mr-1" aria-hidden />
        Real-time
      </div>
    </div>
  </div>
);

export default DashboardMetrics;
