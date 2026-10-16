import React from 'react';
import { ClipboardClock, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/QueryState';
import { exportStockOutToExcel } from '@/features/reports/exportUtils';
import { getErrorMessage } from '@/lib/utils';
import { createStockOutColumns } from '../StockOutColumns';
import { StockOutRequest } from '../types';

const STATUS_FILTERS = ['Semua', 'Menunggu', 'Selesai'] as const;

const PER_PAGE = 10;

interface StockOutTableProps {
  requests: StockOutRequest[];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
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
  error,
  onRetry,
  isNakes,
  canProcess,
  filterStatus,
  onFilterChange,
  onView,
  onProcess,
}) => {
  const renderContent = () => {
    if (isLoading) return <LoadingState label="Memuat data transaksi..." />;
    if (error) return <ErrorState message={getErrorMessage(error)} onRetry={onRetry} />;
    if (requests.length === 0) {
      return (
        <EmptyState
          title="Belum ada permintaan"
          description={
            filterStatus === 'Semua' ? undefined : `Tidak ada permintaan berstatus ${filterStatus}.`
          }
        />
      );
    }
    return (
      <DataTable
        columns={createStockOutColumns({ onView, onProcess, isFarmasi: canProcess })}
        data={requests}
        searchable={false}
        pageSize={PER_PAGE}
      />
    );
  };

  return (
    <div className="bg-card-light dark:bg-card-dark rounded-[20px] shadow-soft overflow-hidden p-6">
      <div className="ps-0 pt-0 p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-background-light dark:bg-background-dark rounded-xl">
            <ClipboardClock className="size-6 text-primary" aria-hidden />
          </div>
          <h3 className="font-bold text-xl text-text-primary-light dark:text-white tracking-tight">
            {isNakes ? 'Riwayat Permintaan Saya' : 'Antrean Permintaan Obat'}
          </h3>
        </div>
        <Tabs value={filterStatus} onValueChange={onFilterChange}>
          <TabsList className="h-auto p-1 bg-background-light dark:bg-background-dark rounded-xl">
            {STATUS_FILTERS.map((status) => (
              <TabsTrigger
                key={status}
                value={status}
                className="px-5 py-2 text-sm font-bold rounded-lg text-text-secondary-light hover:text-text-primary-light dark:hover:text-white data-[state=active]:bg-white dark:data-[state=active]:bg-card-light data-[state=active]:shadow-sm data-[state=active]:text-text-primary-light dark:data-[state=active]:text-text-primary-dark"
              >
                {status}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5"
            onClick={() => void exportStockOutToExcel(requests)}
          >
            <Download aria-hidden /> Ekspor
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">{renderContent()}</div>
    </div>
  );
};

export default StockOutTable;
