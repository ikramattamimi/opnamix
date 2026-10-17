import React from 'react';
import { Archive, CircleCheck, OctagonAlert, TriangleAlert, type LucideIcon } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/QueryState';
import type { Product } from '@/features/products/types';
import { getStockStatus, getStockValue, type StockStatus } from '../stockAnalytics';
import { Card } from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

const STATUS_BADGE: Record<StockStatus, { variant: BadgeProps['variant']; icon: LucideIcon }> = {
  Kritikal: { variant: 'danger', icon: OctagonAlert },
  Menipis: { variant: 'warning', icon: TriangleAlert },
  Aman: { variant: 'success', icon: CircleCheck },
};

const StockStatusBadge: React.FC<{ status: StockStatus }> = ({ status }) => {
  const { variant, icon: Icon } = STATUS_BADGE[status];
  return (
    <Badge variant={variant}>
      <Icon className="size-3" aria-hidden /> {status}
    </Badge>
  );
};

interface StockStatusTableProps {
  products: Product[];
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
}

// Satu baris selebar tabel untuk status memuat, gagal, atau kosong.
const StateRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <TableRow>
    <TableCell colSpan={5}>{children}</TableCell>
  </TableRow>
);

// Tabel detail status stok (Kritikal / Menipis / Aman) per produk.
const StockStatusTable: React.FC<StockStatusTableProps> = ({
  products,
  isPending,
  isError,
  onRetry,
}) => (
  <Card className="p-6">
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-xl font-bold">Detail Status Stok</h3>
      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
        {products.length} Produk ditemukan
      </span>
    </div>
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="text-xs uppercase font-bold text-muted-foreground">
            <TableHead>Informasi Produk</TableHead>
            <TableHead className="text-center">Stok</TableHead>
            <TableHead className="text-center">Batas Aman</TableHead>
            <TableHead>Estimasi Nilai</TableHead>
            <TableHead>Health Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isError ? (
            <StateRow>
              <ErrorState onRetry={onRetry} />
            </StateRow>
          ) : isPending ? (
            <StateRow>
              <LoadingState />
            </StateRow>
          ) : products.length === 0 ? (
            <StateRow>
              <EmptyState icon={Archive} title="Tidak ada produk yang sesuai dengan filter." />
            </StateRow>
          ) : (
            products.map((p) => (
              <TableRow key={p.id} className="group">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className={`w-1 h-10 ${p.color} rounded-full`}></div>
                    <div>
                      <p className="font-bold text-foreground group-hover:text-primary transition-colors">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                        {p.category} • {p.unit}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center font-bold text-lg">{p.stock}</TableCell>
                <TableCell className="text-center text-muted-foreground font-medium">
                  {p.minStock}
                </TableCell>
                <TableCell className="font-bold">
                  Rp {getStockValue(p).toLocaleString('id-ID')}
                </TableCell>
                <TableCell>
                  <StockStatusBadge status={getStockStatus(p)} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  </Card>
);

export default StockStatusTable;
