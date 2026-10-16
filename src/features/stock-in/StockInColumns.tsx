import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { StockInReceipt } from '@/types';
import { Button } from '@/components/ui/button';
import { DataTableColumnFilter } from '@/components/ui/data-table-column-filter';

// Status options for filter
const statusOptions = [
  { label: 'Selesai', value: 'Selesai' },
  { label: 'Pending', value: 'Pending' },
];

interface StockInColumnsProps {
  onView: (receipt: StockInReceipt) => void;
}

export const createStockInColumns = ({
  onView,
}: StockInColumnsProps): ColumnDef<StockInReceipt>[] => [
  {
    accessorKey: 'invoiceNumber',
    header: ({ column }) => {
      return (
        <div className="space-y-2">
          <div className="font-bold text-text-primary-light dark:text-white">Nomor Invoice</div>
          <DataTableColumnFilter column={column} title="Invoice" />
        </div>
      );
    },
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="w-1 h-10 bg-primary rounded-full"></div>
        <div className="font-medium text-text-primary-light dark:text-white">
          {row.getValue('invoiceNumber') || '-'}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'supplierName',
    header: ({ column }) => {
      return (
        <div className="space-y-2">
          <div className="font-bold text-text-primary-light dark:text-white">Supplier</div>
          <DataTableColumnFilter column={column} title="Supplier" />
        </div>
      );
    },
    cell: ({ row }) => (
      <div className="text-text-primary-light dark:text-white">
        {row.getValue('supplierName') || '-'}
      </div>
    ),
  },
  {
    accessorKey: 'receivedBy',
    header: ({ column }) => {
      return (
        <div className="space-y-2">
          <div className="font-bold text-text-primary-light dark:text-white">Penerima</div>
          <DataTableColumnFilter column={column} title="Penerima" />
        </div>
      );
    },
    cell: ({ row }) => (
      <div className="text-text-primary-light dark:text-white">
        {row.getValue('receivedBy') || '-'}
      </div>
    ),
  },
  {
    accessorKey: 'date',
    header: () => <div className="font-bold text-text-primary-light dark:text-white">Tanggal</div>,
    cell: ({ row }) => {
      const date = new Date(row.getValue('date'));
      return (
        <div className="text-text-primary-light dark:text-white">
          {date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => {
      return (
        <div className="space-y-2">
          <div className="font-bold text-text-primary-light dark:text-white text-center">
            Status
          </div>
          <DataTableColumnFilter column={column} title="Status" options={statusOptions} />
        </div>
      );
    },
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const isCompleted = status === 'Selesai';

      return (
        <div className="text-center">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
              isCompleted
                ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400'
                : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-yellow-500'}`}
            ></span>
            {status}
          </span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value === undefined || value === 'all' || row.getValue(id) === value;
    },
  },
  {
    id: 'actions',
    header: () => (
      <div className="font-bold text-text-primary-light dark:text-white text-center">Aksi</div>
    ),
    cell: ({ row }) => {
      const receipt = row.original;

      return (
        <div className="flex items-center justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:bg-primary/10"
            onClick={() => onView(receipt)}
          >
            <span className="material-icons-round text-base mr-1">visibility</span>
            Detail
          </Button>
        </div>
      );
    },
  },
];
