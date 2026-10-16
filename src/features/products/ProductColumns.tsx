import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';

interface ProductColumnsProps {
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export const createProductColumns = ({
  onEdit,
  onDelete,
}: ProductColumnsProps): ColumnDef<Product>[] => [
  {
    accessorKey: 'name',
    header: () => (
      <div className="font-bold text-text-primary-light dark:text-white">Nama Produk</div>
    ),
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl ${product.color || 'bg-primary'} flex items-center justify-center text-white font-bold text-sm shadow-md`}
          >
            {product.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-text-primary-light dark:text-white">{product.name}</div>
            {product.description && (
              <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                {product.description}
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'category',
    header: () => <div className="font-bold text-text-primary-light dark:text-white">Kategori</div>,
    cell: ({ row }) => (
      <div className="text-text-primary-light dark:text-white">{row.getValue('category')}</div>
    ),
  },
  {
    accessorKey: 'unit',
    header: () => <div className="font-bold text-text-primary-light dark:text-white">Satuan</div>,
    cell: ({ row }) => (
      <div className="text-text-primary-light dark:text-white">{row.getValue('unit')}</div>
    ),
  },
  {
    accessorKey: 'sellingPrice',
    header: () => (
      <div className="font-bold text-text-primary-light dark:text-white">Harga Jual</div>
    ),
    cell: ({ row }) => {
      const price = parseFloat(row.getValue('sellingPrice'));
      const formatted = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(price);
      return <div className="font-bold text-text-primary-light dark:text-white">{formatted}</div>;
    },
  },
  {
    accessorKey: 'stock',
    header: () => (
      <div className="font-bold text-text-primary-light dark:text-white text-center">Stok</div>
    ),
    cell: ({ row }) => {
      const stock = parseInt(row.getValue('stock'));
      const minStock = row.original.minStock || 0;
      const isLowStock = stock <= minStock;

      return (
        <div className="text-center">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
              isLowStock
                ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                : 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400'
            }`}
          >
            {isLowStock && <span className="material-icons-round text-xs">warning</span>}
            {stock}
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
      const product = row.original;

      return (
        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(product)}
            title="Edit produk"
          >
            <span className="material-icons-round text-base">edit</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/20 dark:hover:text-red-400"
            onClick={() => onDelete(product.id)}
            title="Hapus produk"
          >
            <span className="material-icons-round text-base">delete</span>
          </Button>
        </div>
      );
    },
  },
];
