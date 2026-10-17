import React from 'react';
import { Archive, CircleCheck, OctagonAlert, TriangleAlert, type LucideIcon } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/QueryState';
import type { Product } from '@/features/products/types';
import { getStockStatus, getStockValue, type StockStatus } from '../stockAnalytics';

const STATUS_BADGE: Record<StockStatus, { className: string; icon: LucideIcon }> = {
  Kritikal: { className: 'bg-red-100 text-red-700', icon: OctagonAlert },
  Menipis: { className: 'bg-amber-100 text-amber-800', icon: TriangleAlert },
  Aman: { className: 'bg-green-100 text-green-700', icon: CircleCheck },
};

const StockStatusBadge: React.FC<{ status: StockStatus }> = ({ status }) => {
  const { className, icon: Icon } = STATUS_BADGE[status];
  return (
    <span
      className={`px-3 py-1.5 ${className} rounded-xl text-[10px] font-bold flex items-center gap-1 w-fit uppercase tracking-wider`}
    >
      <Icon className="size-3" aria-hidden /> {status}
    </span>
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
  <tr>
    <td colSpan={5}>{children}</td>
  </tr>
);

// Tabel detail status stok (Kritikal / Menipis / Aman) per produk.
const StockStatusTable: React.FC<StockStatusTableProps> = ({
  products,
  isPending,
  isError,
  onRetry,
}) => (
  <div className="bg-card rounded-2xl p-6 shadow-soft">
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-xl font-bold">Detail Status Stok</h3>
      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
        {products.length} Produk ditemukan
      </span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-xs uppercase font-bold text-muted-foreground border-b border-gray-100 dark:border-gray-800">
            <th className="pb-4 pl-2">Informasi Produk</th>
            <th className="pb-4 text-center">Stok</th>
            <th className="pb-4 text-center">Batas Aman</th>
            <th className="pb-4">Estimasi Nilai</th>
            <th className="pb-4">Health Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
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
              <tr
                key={p.id}
                className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
              >
                <td className="py-4 pl-2">
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
                </td>
                <td className="py-4 text-center font-bold text-lg">{p.stock}</td>
                <td className="py-4 text-center text-muted-foreground font-medium">{p.minStock}</td>
                <td className="py-4 font-bold text-sm">
                  Rp {getStockValue(p).toLocaleString('id-ID')}
                </td>
                <td className="py-4">
                  <StockStatusBadge status={getStockStatus(p)} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default StockStatusTable;
