import React from 'react';
import { Product } from '@/features/products/types';
import { Button } from '@/components/ui/button';

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
  <div className="bg-card-light dark:bg-card-dark rounded-3xl p-6 shadow-soft">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-lg font-bold">Tahap 1: Pemilihan Obat</h3>
        <p className="text-sm text-text-secondary-light">
          Pilih obat yang akan di-opname. {selectedIds.size} dari {products.length} dipilih.
        </p>
      </div>
      <Button
        variant="link"
        onClick={onToggleAll}
        className="h-auto p-0 text-xs font-bold text-primary hover:text-primary/80 hover:no-underline transition-colors"
      >
        {selectedIds.size === products.length ? 'Batalkan Semua' : 'Pilih Semua'}
      </Button>
    </div>

    <div className="overflow-x-auto mb-6">
      <table className="w-full text-left">
        <thead className="border-b border-gray-100 dark:border-gray-800">
          <tr className="text-xs uppercase font-bold text-text-secondary-light tracking-wider">
            <th className="px-4 py-3 w-12"></th>
            <th className="px-4 py-3 w-full text-center">Nama Produk</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {products.map((product) => (
            <tr
              key={product.id}
              className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
              onClick={() => onToggle(product.id)}
            >
              <td className="px-4 py-3.5">
                {/* Belum ada komponen checkbox di components/ui */}
                <input
                  type="checkbox"
                  checked={selectedIds.has(product.id)}
                  onChange={() => onToggle(product.id)}
                  aria-label={`Pilih ${product.name}`}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </td>
              <td className="px-4 py-3.5">
                <p className="font-bold text-sm">{product.name}</p>
                <p className="text-xs text-text-secondary-light">
                  {product.category} · {product.unit}
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default StepSelectProducts;
