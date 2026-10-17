import * as React from 'react';
import { ColumnDef, FilterFn } from '@tanstack/react-table';
import { CircleCheck, Eye } from 'lucide-react';
import { StockOutRequest } from './types';
import { Button } from '@/components/ui/button';
import { DataTableColumnFilter } from '@/components/ui/data-table-column-filter';
import { Badge, type BadgeProps } from '@/components/ui/badge';

// Source type options for filter
const sourceTypeOptions = [
  { label: 'Pengajuan Nakes', value: 'PENGAJUAN_NAKES' },
  { label: 'Kasir Langsung', value: 'KASIR_LANGSUNG' },
];

// Static class maps to avoid dynamic Tailwind class purging
const sourceTypeVariants: Record<string, BadgeProps['variant']> = {
  PENGAJUAN_NAKES: 'info',
  KASIR_LANGSUNG: 'success',
};

// Status options for filter
const statusOptions = [
  { label: 'Menunggu', value: 'Menunggu' },
  { label: 'Selesai', value: 'Selesai' },
];

// Custom filterFn for requestId that also searches patient name
const requestIdFilterFn: FilterFn<StockOutRequest> = (row, _columnId, filterValue: string) => {
  if (!filterValue) return true;
  const lower = filterValue.toLowerCase();
  const requestId = (row.getValue('requestId') as string)?.toLowerCase() ?? '';
  const patientName = row.original.patient?.fullName?.toLowerCase() ?? '';
  return requestId.includes(lower) || patientName.includes(lower);
};

interface StockOutColumnsProps {
  onView: (request: StockOutRequest) => void;
  onProcess: (request: StockOutRequest) => void;
  isFarmasi: boolean;
}

export const createStockOutColumns = ({
  onView,
  onProcess,
  isFarmasi,
}: StockOutColumnsProps): ColumnDef<StockOutRequest>[] => [
  {
    accessorKey: 'requestId',
    filterFn: requestIdFilterFn,
    header: ({ column }) => {
      return (
        <div className="space-y-2">
          <div className="font-bold text-foreground">Permintaan</div>
          <DataTableColumnFilter column={column} title="ID / Nama" />
        </div>
      );
    },
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="w-1 h-10 bg-primary rounded-full"></div>
        <div>
          <div className="font-medium text-foreground">{row.getValue('requestId')}</div>
          <div className="text-xs text-muted-foreground">{row.original.patient.fullName}</div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'tipeSumber',
    header: ({ column }) => {
      return (
        <div className="space-y-2">
          <div className="font-bold text-foreground">Tipe Sumber</div>
          <DataTableColumnFilter column={column} title="Tipe" options={sourceTypeOptions} />
        </div>
      );
    },
    cell: ({ row }) => {
      const tipeSumber = row.getValue('tipeSumber') as string;
      const sourceType = sourceTypeOptions.find((option) => option.value === tipeSumber);
      return (
        <Badge variant={sourceTypeVariants[tipeSumber] ?? 'neutral'}>
          {sourceType?.label ?? tipeSumber}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return row.getValue(id) === value;
    },
  },
  {
    accessorKey: 'requestedBy',
    header: ({ column }) => (
      <div className="space-y-2">
        <div className="font-bold text-foreground">Diminta Oleh</div>
        <DataTableColumnFilter column={column} title="Nama" />
      </div>
    ),
    filterFn: (row, id, value: string) => {
      if (!value) return true;
      return (row.getValue(id) as string)?.toLowerCase().includes(value.toLowerCase()) ?? false;
    },
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-bold text-primary text-[10px] uppercase">
          {(row.getValue('requestedBy') as string)?.[0] || '?'}
        </div>
        <span className="text-sm font-medium text-foreground">{row.getValue('requestedBy')}</span>
      </div>
    ),
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
      return row.getValue(id) === value;
    },
  },
  {
    accessorKey: 'serviceFee',
    header: () => <div className="font-bold text-foreground text-right">Biaya Layanan</div>,
    cell: ({ row }) => {
      const serviceFee = (row.original.serviceFee ?? 0) as number;
      return (
        <div className="text-right text-sm">
          {serviceFee > 0 ? (
            <span className="font-semibold text-foreground">
              Rp {serviceFee.toLocaleString('id-ID')}
            </span>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'discount',
    header: () => <div className="font-bold text-foreground text-right">Diskon</div>,
    cell: ({ row }) => {
      const discount = (row.original.discount ?? 0) as number;
      return (
        <div className="text-right text-sm">
          {discount > 0 ? (
            <span className="font-semibold text-red-500">
              - Rp {discount.toLocaleString('id-ID')}
            </span>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'totalAmount',
    header: () => <div className="font-bold text-foreground text-right">Total</div>,
    cell: ({ row }) => (
      <div className="text-right font-bold text-foreground text-sm">
        Rp {(row.original.totalAmount ?? 0).toLocaleString('id-ID')}
      </div>
    ),
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
    id: 'actions',
    header: () => <div className="font-bold text-foreground text-center">Aksi</div>,
    cell: ({ row }) => {
      const request = row.original;
      const isPending = request.status === 'Menunggu';

      return (
        <div className="flex items-center justify-start gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:bg-primary/10 [&_svg]:size-5"
            onClick={() => onView(request)}
          >
            <Eye className="mr-1" aria-hidden />
            Detail
          </Button>
          {isPending && isFarmasi && (
            <Button
              variant="default"
              size="sm"
              className="[&_svg]:size-5"
              onClick={() => onProcess(request)}
            >
              <CircleCheck className="mr-1" aria-hidden />
              Proses
            </Button>
          )}
        </div>
      );
    },
  },
];
