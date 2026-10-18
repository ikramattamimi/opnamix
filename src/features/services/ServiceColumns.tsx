import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Service } from './types';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTableColumnFilter } from '@/components/ui/data-table-column-filter';
import { Badge } from '@/components/ui/badge';

interface ServiceColumnsProps {
  onEdit: (service: Service) => void;
  onDelete: (id: string) => void;
}

export const createServiceColumns = ({
  onEdit,
  onDelete,
}: ServiceColumnsProps): ColumnDef<Service>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <div className="space-y-2">
          <div className="font-bold text-foreground">Nama Jasa</div>
          <DataTableColumnFilter column={column} title="Nama" />
        </div>
      );
    },
    cell: ({ row }) => {
      const service = row.original;
      return (
        <div>
          <div className="font-bold text-foreground">{service.name}</div>
          {service.description && (
            <div className="text-xs text-muted-foreground">{service.description}</div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'categoryName',
    header: ({ column }) => {
      return (
        <div className="space-y-2">
          <div className="font-bold text-foreground">Kategori</div>
          <DataTableColumnFilter column={column} title="Kategori" />
        </div>
      );
    },
    cell: ({ row }) => <div className="text-foreground">{row.getValue('categoryName') || '-'}</div>,
  },
  {
    accessorKey: 'price',
    header: () => <div className="font-bold text-foreground">Harga</div>,
    cell: ({ row }) => {
      const price = parseFloat(row.getValue('price'));
      const formatted = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(price);
      return <div className="font-bold text-foreground">{formatted}</div>;
    },
  },
  {
    accessorKey: 'isActive',
    header: () => <div className="font-bold text-foreground text-center">Status</div>,
    cell: ({ row }) => {
      const isActive = row.getValue('isActive') !== false;

      return (
        <div className="text-center">
          <Badge variant={isActive ? 'ok' : 'neutral'}>
            <span
              className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-500'}`}
            ></span>
            {isActive ? 'Aktif' : 'Non-Aktif'}
          </Badge>
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: () => <div className="font-bold text-foreground text-center">Aksi</div>,
    cell: ({ row }) => {
      const service = row.original;

      return (
        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon-sm"
            className="[&_svg]:size-5"
            onClick={() => onEdit(service)}
            aria-label="Edit jasa"
          >
            <Pencil aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/20 dark:hover:text-red-400 [&_svg]:size-5"
            onClick={() => onDelete(service.id)}
            aria-label="Hapus jasa"
          >
            <Trash2 aria-hidden />
          </Button>
        </div>
      );
    },
  },
];
