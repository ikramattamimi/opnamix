import React, { useEffect, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { stockMutationColumns } from '../StockMutationColumns';
import { exportStockMutationToExcel } from '../exportUtils';
import { createInitialDateRange, type ReportDateRange } from '../reportPeriod';
import type { StockMutationRow } from '../types';
import { useStockMutationReport } from '../useReports';
import DateRangeFilter from './DateRangeFilter';

const EMPTY_MUTATION_ROWS: StockMutationRow[] = [];

interface StockMutationReportProps {
  // Query hanya jalan saat tab-nya aktif
  active: boolean;
}

const StockMutationReport: React.FC<StockMutationReportProps> = ({ active }) => {
  const [range, setRange] = useState<ReportDateRange>(() => createInitialDateRange());

  // Laporan selalu mengambil SEMUA data periode. Pagination dan filter kolom
  // ditangani <DataTable pageSize={10}>, dan data yang sama dipakai untuk export.
  const mutationQuery = useStockMutationReport(
    range.startDate,
    range.endDate,
    { page: 1, perPage: 100000 },
    { enabled: active },
  );
  const allMutationData = mutationQuery.data?.data ?? EMPTY_MUTATION_ROWS;

  useEffect(() => {
    if (mutationQuery.error) console.error('Error fetching report:', mutationQuery.error);
  }, [mutationQuery.error]);

  const handleExportMutations = () => {
    void exportStockMutationToExcel(allMutationData, range.startDate, range.endDate);
  };

  return (
    <div className="bg-card-light dark:bg-card-dark rounded-[20px] shadow-soft p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-lg text-text-primary-light dark:text-white">
          Laporan Mutasi Stok
        </h3>
        <Button
          onClick={handleExportMutations}
          variant="outline"
          disabled={allMutationData.length === 0}
          className="px-6 py-2.5 rounded-xl font-bold h-auto flex items-center gap-2 [&_svg]:size-5"
        >
          <Download className="size-5" aria-hidden />
          Export Excel
        </Button>
      </div>

      <DateRangeFilter value={range} onChange={setRange}>
        <Button
          onClick={() => void mutationQuery.refetch()}
          className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-colors h-auto flex items-center gap-2 [&_svg]:size-5"
        >
          <Search className="size-5" aria-hidden />
          Tampilkan Laporan
        </Button>
      </DateRangeFilter>

      <DataTable
        columns={stockMutationColumns}
        data={allMutationData}
        searchable={false}
        pageSize={10}
      />
    </div>
  );
};

export default StockMutationReport;
