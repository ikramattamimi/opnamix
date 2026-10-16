import React, { useEffect, useId, useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { ErrorState, LoadingState } from '@/components/common/QueryState';
import type { TransactionReportRow } from '../api';
import { createTransactionReportColumns } from '../TransactionReportColumns';
import { exportTransactionReportToExcel } from '../exportUtils';
import { createInitialDateRange, type ReportDateRange } from '../reportPeriod';
import { useTransactionReport } from '../useReports';
import DateRangeFilter from './DateRangeFilter';
import { FilterField, FilterSelect } from './FilterSelect';
import TransactionDetailDialog from './TransactionDetailDialog';

const EMPTY_TX_ROWS: TransactionReportRow[] = [];

type TransactionStatusFilter = 'Semua' | 'Menunggu' | 'Selesai';

const STATUS_OPTIONS: { value: TransactionStatusFilter; label: string }[] = [
  { value: 'Semua', label: 'Semua Status' },
  { value: 'Menunggu', label: 'Menunggu' },
  { value: 'Selesai', label: 'Selesai' },
];

interface TransactionReportProps {
  // Query hanya jalan saat tab-nya aktif
  active: boolean;
}

const TransactionReport: React.FC<TransactionReportProps> = ({ active }) => {
  const id = useId();
  const [range, setRange] = useState<ReportDateRange>(() => createInitialDateRange());
  const [txStatus, setTxStatus] = useState<TransactionStatusFilter>('Semua');
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionReportRow | null>(null);

  // Laporan selalu mengambil SEMUA data periode. Pagination dan filter kolom
  // ditangani <DataTable pageSize={10}>, dan data yang sama dipakai untuk export.
  const txQuery = useTransactionReport(
    range.startDate,
    range.endDate,
    { page: 1, perPage: 100000, status: txStatus === 'Semua' ? undefined : txStatus },
    { enabled: active },
  );
  const allTxData = txQuery.data?.data ?? EMPTY_TX_ROWS;

  useEffect(() => {
    if (txQuery.error) console.error('Error fetching report:', txQuery.error);
  }, [txQuery.error]);

  const columns = useMemo(
    () => createTransactionReportColumns({ onViewDetail: setSelectedTransaction }),
    [],
  );

  const handleExportTransactions = () => {
    void exportTransactionReportToExcel(allTxData, range.startDate, range.endDate);
  };

  return (
    <div className="bg-card-light dark:bg-card-dark rounded-3xl p-6 shadow-soft">
      <DateRangeFilter value={range} onChange={setRange}>
        <FilterField label="Status" htmlFor={`${id}-status`}>
          <FilterSelect
            id={`${id}-status`}
            value={txStatus}
            onValueChange={(value) => setTxStatus(value as TransactionStatusFilter)}
            options={STATUS_OPTIONS}
          />
        </FilterField>
        <Button
          onClick={() => void txQuery.refetch()}
          className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-colors h-auto flex items-center gap-2 [&_svg]:size-5"
        >
          <Search className="size-5" aria-hidden />
          Tampilkan Laporan
        </Button>
        <Button
          onClick={handleExportTransactions}
          variant="outline"
          disabled={allTxData.length === 0}
          className="px-6 py-2.5 rounded-xl font-bold h-auto flex items-center gap-2 [&_svg]:size-5"
        >
          <Download className="size-5" aria-hidden />
          Export Excel
        </Button>
      </DateRangeFilter>

      {txQuery.isError ? (
        <ErrorState onRetry={() => void txQuery.refetch()} />
      ) : txQuery.isPending ? (
        <LoadingState />
      ) : (
        <DataTable columns={columns} data={allTxData} searchable={false} pageSize={10} />
      )}

      {selectedTransaction && (
        <TransactionDetailDialog
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
};

export default TransactionReport;
