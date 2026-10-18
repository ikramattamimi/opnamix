import React from 'react';
import { Product } from '@/features/products/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

interface StepSelectProductsProps {
  products: Product[];
  selectedIds: Set<string>;
  onToggle: (productId: string) => void;
  onToggleAll: () => void;
}

// Langkah 1: pilih obat yang akan di-opname
const StepSelectProducts: React.FC<StepSelectProductsProps> = ({
  products,
  selectedIds,
  onToggle,
  onToggleAll,
}) => (
  <Card className="p-6">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-lg font-bold">Tahap 1: Pemilihan Obat</h3>
        <p className="text-sm text-muted-foreground">
          Pilih obat yang akan di-opname. {selectedIds.size} dari {products.length} dipilih.
        </p>
      </div>
      <Button
        variant="link"
        onClick={onToggleAll}
        className="p-0 text-xs font-bold text-primary hover:text-primary/80 hover:no-underline transition-colors"
      >
        {selectedIds.size === products.length ? 'Batalkan Semua' : 'Pilih Semua'}
      </Button>
    </div>

    <div className="overflow-x-auto mb-6">
      <Table>
        <TableHeader>
          <TableRow className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
            <TableHead className="w-12"></TableHead>
            <TableHead className="w-full text-center">Nama Produk</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow
              key={product.id}
              className="cursor-pointer"
              onClick={() => onToggle(product.id)}
            >
              <TableCell>
                {/* Belum ada komponen checkbox di components/ui */}
                <input
                  type="checkbox"
                  checked={selectedIds.has(product.id)}
                  onChange={() => onToggle(product.id)}
                  aria-label={`Pilih ${product.name}`}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </TableCell>
              <TableCell>
                <p className="font-bold text-sm">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {product.category} · {product.unit}
                </p>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </Card>
);

export default StepSelectProducts;
