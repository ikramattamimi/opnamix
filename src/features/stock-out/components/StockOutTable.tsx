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
import { Card } from '@/components/ui/card';

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
    <Card className="overflow-hidden p-6">
      <div className="ps-0 pt-0 p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-background rounded-xl">
            <ClipboardClock className="size-6 text-primary" aria-hidden />
          </div>
          <h3 className="font-bold text-xl text-foreground tracking-tight">
            {isNakes ? 'Riwayat Permintaan Saya' : 'Antrean Permintaan Obat'}
          </h3>
        </div>
        <Tabs value={filterStatus} onValueChange={onFilterChange}>
          <TabsList className="h-auto p-1 bg-background rounded-xl">
            {STATUS_FILTERS.map((status) => (
              <TabsTrigger
                key={status}
                value={status}
                className="px-5 py-2 text-sm font-bold rounded-lg text-muted-foreground hover:text-foreground data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground"
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
    </Card>
  );
};

export default StockOutTable;
