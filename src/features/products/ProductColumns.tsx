import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Product } from './types';
import { Pencil, Trash2, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
    header: () => <div className="font-bold text-foreground">Nama Produk</div>,
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
            <div className="font-bold text-foreground">{product.name}</div>
            {product.description && (
              <div className="text-xs text-muted-foreground">{product.description}</div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'category',
    header: () => <div className="font-bold text-foreground">Kategori</div>,
    cell: ({ row }) => <div className="text-foreground">{row.getValue('category')}</div>,
  },
  {
    accessorKey: 'unit',
    header: () => <div className="font-bold text-foreground">Satuan</div>,
    cell: ({ row }) => <div className="text-foreground">{row.getValue('unit')}</div>,
  },
  {
    accessorKey: 'sellingPrice',
    header: () => <div className="font-bold text-foreground">Harga Jual</div>,
    cell: ({ row }) => {
      const price = parseFloat(row.getValue('sellingPrice'));
      const formatted = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(price);
      return <div className="font-bold text-foreground">{formatted}</div>;
    },
  },
  {
    accessorKey: 'stock',
    header: () => <div className="font-bold text-foreground text-center">Stok</div>,
    cell: ({ row }) => {
      const stock = parseInt(row.getValue('stock'));
      const minStock = row.original.minStock || 0;
      const isLowStock = stock <= minStock;

      return (
        <div className="text-center">
          <Badge variant={isLowStock ? 'danger' : 'success'}>
            {isLowStock && <TriangleAlert className="size-3" aria-hidden />}
            {stock}
          </Badge>
        </div>
      );
    },
  },
  {
    id: 'actions',
    header: () => <div className="font-bold text-foreground text-center">Aksi</div>,
    cell: ({ row }) => {
      const product = row.original;

      return (
        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon-sm"
            className="[&_svg]:size-5"
            onClick={() => onEdit(product)}
            title="Edit produk"
            aria-label="Edit produk"
          >
            <Pencil aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/20 dark:hover:text-red-400 [&_svg]:size-5"
            onClick={() => onDelete(product.id)}
            title="Hapus produk"
            aria-label="Hapus produk"
          >
            <Trash2 aria-hidden />
          </Button>
        </div>
      );
    },
  },
];
