import React from 'react';
import { Archive, CircleCheck, OctagonAlert, TriangleAlert } from 'lucide-react';
import type { Product } from '@/features/products/types';
import { getStockStatus, getStockValue } from '../stockAnalytics';

interface StockStatusTableProps {
  products: Product[];
}

// Tabel detail status stok (Kritikal / Menipis / Aman) per produk.
const StockStatusTable: React.FC<StockStatusTableProps> = ({ products }) => (
  <div className="bg-card-light dark:bg-card-dark rounded-3xl p-6 shadow-soft">
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-xl font-bold">Detail Status Stok</h3>
      <span className="text-xs font-bold text-text-secondary-light uppercase tracking-widest">
        {products.length} Produk ditemukan
      </span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-xs uppercase font-bold text-text-secondary-light border-b border-gray-100 dark:border-gray-800">
            <th className="pb-4 pl-2">Informasi Produk</th>
            <th className="pb-4 text-center">Stok</th>
            <th className="pb-4 text-center">Batas Aman</th>
            <th className="pb-4">Estimasi Nilai</th>
            <th className="pb-4">Health Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {products.map((p) => {
            const status = getStockStatus(p);

            return (
              <tr
                key={p.id}
                className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
              >
                <td className="py-4 pl-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-1 h-10 ${p.color} rounded-full`}></div>
                    <div>
                      <p className="font-bold text-text-primary-light dark:text-white group-hover:text-primary transition-colors">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-text-secondary-light uppercase tracking-tighter">
                        {p.category} • {p.unit}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-4 text-center font-bold text-lg">{p.stock}</td>
                <td className="py-4 text-center text-text-secondary-light font-medium">
                  {p.minStock}
                </td>
                <td className="py-4 font-bold text-sm">
                  Rp {getStockValue(p).toLocaleString('id-ID')}
                </td>
                <td className="py-4">
                  {status === 'Kritikal' ? (
                    <span className="px-3 py-1.5 bg-red-100 text-red-600 rounded-xl text-[10px] font-bold flex items-center gap-1 w-fit uppercase tracking-wider">
                      <OctagonAlert className="size-3" aria-hidden /> Kritikal
                    </span>
                  ) : status === 'Menipis' ? (
                    <span className="px-3 py-1.5 bg-amber-100 text-amber-600 rounded-xl text-[10px] font-bold flex items-center gap-1 w-fit uppercase tracking-wider">
                      <TriangleAlert className="size-3" aria-hidden /> Menipis
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 bg-green-100 text-green-600 rounded-xl text-[10px] font-bold flex items-center gap-1 w-fit uppercase tracking-wider">
                      <CircleCheck className="size-3" aria-hidden /> Aman
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
          {products.length === 0 && (
            <tr>
              <td colSpan={5} className="py-20 text-center">
                <div className="flex flex-col items-center opacity-40">
                  <Archive className="size-12 mb-2" aria-hidden />
                  <p className="font-bold text-sm">Tidak ada produk yang sesuai dengan filter.</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default StockStatusTable;
