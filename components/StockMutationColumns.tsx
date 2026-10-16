import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnFilter } from './ui/data-table-column-filter';
import type { StockMutationRow } from '../lib/api';

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
          <div className="font-bold text-text-primary-light dark:text-white">Tanggal</div>
          <DataTableColumnFilter column={column} title="Tanggal" />
        </div>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue('date'));
      return (
        <div className="text-text-primary-light dark:text-white">
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
          <div className="font-bold text-text-primary-light dark:text-white">No. Transaksi</div>
          <DataTableColumnFilter column={column} title="Nomor" />
        </div>
      );
    },
    cell: ({ row }) => (
      <div className="font-medium text-text-primary-light dark:text-white">
        {row.getValue('trxNumber')}
      </div>
    ),
  },
  {
    accessorKey: 'type',
    header: ({ column }) => {
      return (
        <div className="space-y-2">
          <div className="font-bold text-text-primary-light dark:text-white">Tipe</div>
          <DataTableColumnFilter column={column} title="Tipe" options={typeOptions} />
        </div>
      );
    },
    cell: ({ row }) => {
      const type = row.getValue('type') as string;
      const getTypeStyle = () => {
        switch (type) {
          case 'masuk':
            return 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400';
          case 'keluar':
            return 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400';
          case 'penyesuaian':
            return 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400';
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
            {type === 'penyesuaian' && <span className="material-icons-round text-xs">tune</span>}
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
          <div className="font-bold text-text-primary-light dark:text-white">Item Obat</div>
          <DataTableColumnFilter column={column} title="Item" />
        </div>
      );
    },
    cell: ({ row }) => (
      <div className="text-text-primary-light dark:text-white">
        {row.getValue('itemName') || '-'}
      </div>
    ),
  },
  {
    accessorKey: 'qty',
    header: () => (
      <div className="font-bold text-text-primary-light dark:text-white text-center">
        Qty / Selisih
      </div>
    ),
    cell: ({ row }) => {
      const type = row.original.type;
      const qty = row.getValue('qty') as number;
      if (type === 'penyesuaian') {
        return (
          <div
            className={`text-center font-bold ${qty > 0 ? 'text-green-600 dark:text-green-400' : qty < 0 ? 'text-red-600 dark:text-red-400' : 'text-text-primary-light dark:text-white'}`}
          >
            {qty > 0 ? `+${qty}` : qty}
          </div>
        );
      }
      return (
        <div className="text-center font-medium text-text-primary-light dark:text-white">{qty}</div>
      );
    },
  },
  {
    accessorKey: 'systemStock',
    header: () => (
      <div className="font-bold text-text-primary-light dark:text-white text-center">
        Stok Sistem
      </div>
    ),
    cell: ({ row }) => {
      const val = row.original.systemStock;
      return (
        <div className="text-center text-text-primary-light dark:text-white">
          {val !== null && val !== undefined ? val : '-'}
        </div>
      );
    },
  },
  {
    accessorKey: 'physicalStock',
    header: () => (
      <div className="font-bold text-text-primary-light dark:text-white text-center">
        Stok Fisik
      </div>
    ),
    cell: ({ row }) => {
      const val = row.original.physicalStock;
      return (
        <div className="text-center text-text-primary-light dark:text-white">
          {val !== null && val !== undefined ? val : '-'}
        </div>
      );
    },
  },
  {
    accessorKey: 'finalStock',
    header: () => (
      <div className="font-bold text-text-primary-light dark:text-white text-center">
        Stok Final
      </div>
    ),
    cell: ({ row }) => {
      const val = row.original.finalStock;
      return (
        <div className="text-center font-bold text-text-primary-light dark:text-white">
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
          <div className="font-bold text-text-primary-light dark:text-white">Status</div>
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
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400'
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
