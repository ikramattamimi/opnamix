import React from 'react';
import { Button } from '@/components/ui/button';
import type { Product } from '@/features/products/types';
import type { DrugField } from '../requestItems';
import { RequestedDrug } from '../types';

interface RequestDrugTableProps {
  drugs: RequestedDrug[];
  // Diisi saat mode edit: produk dan jumlah bisa diubah, baris bisa ditambah/dihapus
  edit?: {
    products: Product[];
    onChange: (drugId: string, field: DrugField, value: string) => void;
    onAdd: () => void;
    onRemove: (drugId: string) => void;
  };
}

// Daftar item obat & alkes di detail permintaan
const RequestDrugTable: React.FC<RequestDrugTableProps> = ({ drugs, edit }) => (
  <div>
    <div className="flex items-center justify-between gap-3 mb-3">
      <h4 className="font-bold text-lg flex items-center gap-2">
        <span className="material-icons-round text-primary">medication</span>
        Item Obat & Alkes
      </h4>
      {edit && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={edit.onAdd}
          className="flex items-center gap-1.5"
        >
          <span className="material-icons-round text-sm">add</span>
          Tambah Item
        </Button>
      )}
    </div>
    <div className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 dark:bg-white/5 text-text-secondary-light font-bold border-b border-gray-100 dark:border-gray-800 uppercase text-xs">
          <tr>
            <th className="px-4 py-3">Nama Produk</th>
            <th className="px-4 py-3 text-center">Jumlah</th>
            <th className="px-4 py-3 text-right">Harga Satuan</th>
            <th className="px-4 py-3 text-right">Total</th>
            {edit && <th className="px-4 py-3 text-center">Aksi</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {drugs.length > 0 ? (
            drugs.map((drug, i) => (
              <tr key={i}>
                <td className="px-4 py-3 font-medium text-text-primary-light dark:text-white">
                  {edit ? (
                    <select
                      value={drug.productId}
                      onChange={(e) => edit.onChange(drug.id, 'productId', e.target.value)}
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-card-dark px-3 py-2 text-sm text-text-primary-light dark:text-white"
                    >
                      {edit.products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    drug.productName
                  )}
                </td>
                <td className="px-4 py-3 text-center font-bold">
                  {edit ? (
                    <input
                      type="number"
                      min="1"
                      value={drug.quantity}
                      onChange={(e) => edit.onChange(drug.id, 'quantity', e.target.value)}
                      className="w-20 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-card-dark px-3 py-2 text-center text-sm text-text-primary-light dark:text-white"
                    />
                  ) : (
                    drug.quantity
                  )}
                </td>
                <td className="px-4 py-3 text-right text-text-secondary-light">
                  Rp {(drug.price || 0).toLocaleString('id-ID')}
                </td>
                <td className="px-4 py-3 text-right font-bold text-text-primary-light dark:text-white">
                  Rp {((drug.price || 0) * drug.quantity).toLocaleString('id-ID')}
                </td>
                {edit && (
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => edit.onRemove(drug.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <span className="material-icons-round text-sm">delete</span>
                    </button>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={edit ? 5 : 4}
                className="px-4 py-6 text-center text-text-secondary-light dark:text-text-secondary-dark"
              >
                Tidak ada item obat. Permintaan ini hanya berisi jasa.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default RequestDrugTable;
