import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { SlidersHorizontal } from 'lucide-react';
import { DataTableColumnFilter } from '@/components/ui/data-table-column-filter';
import type { StockMutationRow } from './types';

// Type options for filter
const typeOptions = [
  { label: 'Masuk', value: 'masuk' },
  { label: 'Keluar', value: 'keluar' },
  { label: 'Penyesuaian', value: 'penyesuaian' },
];

// Status options for filter
const statusOptions = [
  { label: 'Menunggu', value: 'diajukan' },
  { label: 'Selesai', value: 'selesai' },
];

export const stockMutationColumns: ColumnDef<StockMutationRow>[] = [
  {
    accessorKey: 'date',
    header: ({ column }) => {
      return (
        <div className="space-y-2">
          <div className="font-bold text-foreground">Tanggal</div>
          <DataTableColumnFilter column={column} title="Tanggal" />
        </div>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue('date'));
      return (
        <div className="text-foreground">
          {date.toLocaleString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </div>
      );
    },
  },
  {
    accessorKey: 'trxNumber',
    header: ({ column }) => {
      return (
        <div className="space-y-2">
          <div className="font-bold text-foreground">No. Transaksi</div>
          <DataTableColumnFilter column={column} title="Nomor" />
        </div>
      );
    },
    cell: ({ row }) => (
      <div className="font-medium text-foreground">{row.getValue('trxNumber')}</div>
    ),
  },
  {
    accessorKey: 'type',
    header: ({ column }) => {
      return (
        <div className="space-y-2">
          <div className="font-bold text-foreground">Tipe</div>
          <DataTableColumnFilter column={column} title="Tipe" options={typeOptions} />
        </div>
      );
    },
    cell: ({ row }) => {
      const type = row.getValue('type') as string;
      const getTypeStyle = () => {
        switch (type) {
          case 'masuk':
            return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300';
          case 'keluar':
            return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300';
          case 'penyesuaian':
            return 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300';
          default:
            return 'bg-gray-100 text-gray-600';
        }
      };
      const getTypeLabel = () => {
        switch (type) {
          case 'masuk':
            return 'Masuk';
          case 'keluar':
            return 'Keluar';
          case 'penyesuaian':
            return 'Penyesuaian';
          default:
            return type;
        }
      };
      return (
        <div className="text-center">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${getTypeStyle()}`}
          >
            {type === 'penyesuaian' && <SlidersHorizontal className="size-3" aria-hidden />}
            {getTypeLabel()}
          </span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value === undefined || value === 'all' || row.getValue(id) === value;
    },
  },
  {
    accessorKey: 'itemName',
    header: ({ column }) => {
      return (
        <div className="space-y-2">
          <div className="font-bold text-foreground">Item Obat</div>
          <DataTableColumnFilter column={column} title="Item" />
        </div>
      );
    },
    cell: ({ row }) => <div className="text-foreground">{row.getValue('itemName') || '-'}</div>,
  },
  {
    accessorKey: 'qty',
    header: () => <div className="font-bold text-foreground text-center">Qty / Selisih</div>,
    cell: ({ row }) => {
      const type = row.original.type;
      const qty = row.getValue('qty') as number;
      if (type === 'penyesuaian') {
        return (
          <div
            className={`text-center font-bold ${qty > 0 ? 'text-green-600 dark:text-green-400' : qty < 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}
          >
            {qty > 0 ? `+${qty}` : qty}
          </div>
        );
      }
      return <div className="text-center font-medium text-foreground">{qty}</div>;
    },
  },
  {
    accessorKey: 'systemStock',
    header: () => <div className="font-bold text-foreground text-center">Stok Sistem</div>,
    cell: ({ row }) => {
      const val = row.original.systemStock;
      return (
        <div className="text-center text-foreground">
          {val !== null && val !== undefined ? val : '-'}
        </div>
      );
    },
  },
  {
    accessorKey: 'physicalStock',
    header: () => <div className="font-bold text-foreground text-center">Stok Fisik</div>,
    cell: ({ row }) => {
      const val = row.original.physicalStock;
      return (
        <div className="text-center text-foreground">
          {val !== null && val !== undefined ? val : '-'}
        </div>
      );
    },
  },
  {
    accessorKey: 'finalStock',
    header: () => <div className="font-bold text-foreground text-center">Stok Final</div>,
    cell: ({ row }) => {
      const val = row.original.finalStock;
      return (
        <div className="text-center font-bold text-foreground">
          {val !== null && val !== undefined ? val : '-'}
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => {
      return (
        <div className="space-y-2">
          <div className="font-bold text-foreground">Status</div>
          <DataTableColumnFilter column={column} title="Status" options={statusOptions} />
        </div>
      );
    },
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <div className="text-center">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
              status === 'selesai'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300'
            }`}
          >
            {status === 'selesai' ? 'Selesai' : 'Menunggu'}
          </span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value === undefined || value === 'all' || row.getValue(id) === value;
    },
  },
];
