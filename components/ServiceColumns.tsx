import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Service } from '../types';
import { Button } from './ui/button';
import { DataTableColumnFilter } from './ui/data-table-column-filter';

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
          <div className="font-bold text-text-primary-light dark:text-white">Nama Jasa</div>
          <DataTableColumnFilter column={column} title="Nama" />
        </div>
      );
    },
    cell: ({ row }) => {
      const service = row.original;
      return (
        <div>
          <div className="font-bold text-text-primary-light dark:text-white">{service.name}</div>
          {service.description && (
            <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
              {service.description}
            </div>
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
          <div className="font-bold text-text-primary-light dark:text-white">Kategori</div>
          <DataTableColumnFilter column={column} title="Kategori" />
        </div>
      );
    },
    cell: ({ row }) => (
      <div className="text-text-primary-light dark:text-white">
        {row.getValue('categoryName') || '-'}
      </div>
    ),
  },
  {
    accessorKey: 'price',
    header: () => <div className="font-bold text-text-primary-light dark:text-white">Harga</div>,
    cell: ({ row }) => {
      const price = parseFloat(row.getValue('price'));
      const formatted = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(price);
      return <div className="font-bold text-text-primary-light dark:text-white">{formatted}</div>;
    },
  },
  {
    accessorKey: 'isActive',
    header: () => (
      <div className="font-bold text-text-primary-light dark:text-white text-center">Status</div>
    ),
    cell: ({ row }) => {
      const isActive = row.getValue('isActive') !== false;

      return (
        <div className="text-center">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
              isActive
                ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-500'}`}
            ></span>
            {isActive ? 'Aktif' : 'Non-Aktif'}
          </span>
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: () => (
      <div className="font-bold text-text-primary-light dark:text-white text-center">Aksi</div>
    ),
    cell: ({ row }) => {
      const service = row.original;

      return (
        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(service)}>
            <span className="material-icons-round text-base">edit</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/20 dark:hover:text-red-400"
            onClick={() => onDelete(service.id)}
          >
            <span className="material-icons-round text-base">delete</span>
          </Button>
        </div>
      );
    },
  },
];
