import React from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { exportStockOutToExcel } from '@/features/reports/exportUtils';
import { createStockOutColumns } from '../StockOutColumns';
import { StockOutRequest } from '../types';

const STATUS_FILTERS = ['Semua', 'Menunggu', 'Selesai'] as const;

const PER_PAGE = 10;

interface StockOutTableProps {
  requests: StockOutRequest[];
  isLoading: boolean;
  isNakes: boolean;
  canProcess: boolean;
  filterStatus: string;
  onFilterChange: (status: string) => void;
  onView: (request: StockOutRequest) => void;
  onProcess: (request: StockOutRequest) => void;
}

// Antrean permintaan: filter status, ekspor, dan tabel dengan pagination
const StockOutTable: React.FC<StockOutTableProps> = ({
  requests,
  isLoading,
  isNakes,
  canProcess,
  filterStatus,
  onFilterChange,
  onView,
  onProcess,
}) => (
  <div className="bg-card-light dark:bg-card-dark rounded-[20px] shadow-soft overflow-hidden p-6">
    <div className="ps-0 pt-0 p-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-background-light dark:bg-background-dark rounded-xl">
          <span className="material-icons-round text-primary">pending_actions</span>
        </div>
        <h3 className="font-bold text-xl text-text-primary-light dark:text-white tracking-tight">
          {isNakes ? 'Riwayat Permintaan Saya' : 'Antrean Permintaan Obat'}
        </h3>
      </div>
      <div className="flex p-1 bg-background-light dark:bg-background-dark rounded-xl">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            onClick={() => onFilterChange(status)}
            className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${
              filterStatus === status
                ? 'bg-white dark:bg-card-light shadow-sm text-text-primary-light dark:text-text-primary-dark'
                : 'text-text-secondary-light hover:text-text-primary-light dark:hover:text-white'
            }`}
          >
            {status}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5"
          onClick={() => void exportStockOutToExcel(requests)}
        >
          <span className="material-icons-round text-sm">file_download</span> Ekspor
        </Button>
      </div>
    </div>

    <div className="overflow-x-auto">
      {isLoading ? (
        <div className="space-y-2 p-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-14 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse"
              style={{ opacity: 1 - i * 0.15 }}
            />
          ))}
          <p className="text-center text-xs text-text-secondary-light mt-3 pb-2">
            Memuat data transaksi...
          </p>
        </div>
      ) : (
        <DataTable
          columns={createStockOutColumns({ onView, onProcess, isFarmasi: canProcess })}
          data={requests}
          searchable={false}
          pageSize={PER_PAGE}
        />
      )}
    </div>
  </div>
);

export default StockOutTable;
