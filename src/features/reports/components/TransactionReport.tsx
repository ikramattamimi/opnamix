import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import type { TransactionReportRow } from '../api';
import { createTransactionReportColumns } from '../TransactionReportColumns';
import { exportTransactionReportToExcel } from '../exportUtils';
import { createInitialDateRange, type ReportDateRange } from '../reportPeriod';
import { useTransactionReport } from '../useReports';
import DateRangeFilter from './DateRangeFilter';
import TransactionDetailDialog from './TransactionDetailDialog';

const EMPTY_TX_ROWS: TransactionReportRow[] = [];

type TransactionStatusFilter = 'Semua' | 'Menunggu' | 'Selesai';

interface TransactionReportProps {
  // Query hanya jalan saat tab-nya aktif
  active: boolean;
}

const TransactionReport: React.FC<TransactionReportProps> = ({ active }) => {
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
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-text-secondary-light">Status</label>
          <select
            value={txStatus}
            onChange={(e) => {
              setTxStatus(e.target.value as TransactionStatusFilter);
            }}
            className="block w-full rounded-xl border-gray-200 bg-white px-4 py-2 text-text-primary-light dark:border-gray-700 dark:bg-card-dark dark:text-white"
          >
            <option value="Semua">Semua Status</option>
            <option value="Menunggu">Menunggu</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>
        <Button
          onClick={() => void txQuery.refetch()}
          className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-colors h-auto flex items-center gap-2"
        >
          <span className="material-icons-round text-base">search</span>
          Tampilkan Laporan
        </Button>
        <Button
          onClick={handleExportTransactions}
          variant="outline"
          disabled={allTxData.length === 0}
          className="px-6 py-2.5 rounded-xl font-bold h-auto flex items-center gap-2"
        >
          <span className="material-icons-round text-base">download</span>
          Export Excel
        </Button>
      </DateRangeFilter>

      <DataTable columns={columns} data={allTxData} searchable={false} pageSize={10} />

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
