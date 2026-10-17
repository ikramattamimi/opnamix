import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { StockInReceipt } from './types';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTableColumnFilter } from '@/components/ui/data-table-column-filter';
import { Badge } from '@/components/ui/badge';

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
          <div className="font-bold text-foreground">Nomor Invoice</div>
          <DataTableColumnFilter column={column} title="Invoice" />
        </div>
      );
    },
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="w-1 h-10 bg-primary rounded-full"></div>
        <div className="font-medium text-foreground">{row.getValue('invoiceNumber') || '-'}</div>
      </div>
    ),
  },
  {
    accessorKey: 'supplierName',
    header: ({ column }) => {
      return (
        <div className="space-y-2">
          <div className="font-bold text-foreground">Supplier</div>
          <DataTableColumnFilter column={column} title="Supplier" />
        </div>
      );
    },
    cell: ({ row }) => <div className="text-foreground">{row.getValue('supplierName') || '-'}</div>,
  },
  {
    accessorKey: 'receivedBy',
    header: ({ column }) => {
      return (
        <div className="space-y-2">
          <div className="font-bold text-foreground">Penerima</div>
          <DataTableColumnFilter column={column} title="Penerima" />
        </div>
      );
    },
    cell: ({ row }) => <div className="text-foreground">{row.getValue('receivedBy') || '-'}</div>,
  },
  {
    accessorKey: 'date',
    header: () => <div className="font-bold text-foreground">Tanggal</div>,
    cell: ({ row }) => {
      const date = new Date(row.getValue('date'));
      return (
        <div className="text-foreground">
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
          <div className="font-bold text-foreground text-center">Status</div>
          <DataTableColumnFilter column={column} title="Status" options={statusOptions} />
        </div>
      );
    },
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const isCompleted = status === 'Selesai';

      return (
        <div className="text-center">
          <Badge variant={isCompleted ? 'success' : 'warning'}>
            <span
              className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-yellow-500'}`}
            ></span>
            {status}
          </Badge>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value === undefined || value === 'all' || row.getValue(id) === value;
    },
  },
  {
    id: 'actions',
    header: () => <div className="font-bold text-foreground text-center">Aksi</div>,
    cell: ({ row }) => {
      const receipt = row.original;

      return (
        <div className="flex items-center justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:bg-primary/10 [&_svg]:size-5"
            onClick={() => onView(receipt)}
          >
            <Eye className="mr-1" aria-hidden />
            Detail
          </Button>
        </div>
      );
    },
  },
];
