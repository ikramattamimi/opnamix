import React from 'react';
import { Pill, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

const EDIT_FIELD =
  'h-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-card px-3 py-2 text-sm md:text-sm text-foreground';

// Daftar item obat & alkes di detail permintaan
const RequestDrugTable: React.FC<RequestDrugTableProps> = ({ drugs, edit }) => (
  <div>
    <div className="flex items-center justify-between gap-3 mb-3">
      <h4 className="font-bold text-lg flex items-center gap-2">
        <Pill className="size-6 text-primary" aria-hidden />
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
          <Plus aria-hidden />
          Tambah Item
        </Button>
      )}
    </div>
    <div className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 dark:bg-white/5 text-muted-foreground font-bold border-b border-gray-100 dark:border-gray-800 uppercase text-xs">
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
                <td className="px-4 py-3 font-medium text-foreground">
                  {edit ? (
                    <Select
                      value={drug.productId}
                      onValueChange={(value) => edit.onChange(drug.id, 'productId', value)}
                    >
                      <SelectTrigger aria-label="Nama produk" className={`w-full ${EDIT_FIELD}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {edit.products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    drug.productName
                  )}
                </td>
                <td className="px-4 py-3 text-center font-bold">
                  {edit ? (
                    <Input
                      type="number"
                      min="1"
                      aria-label="Jumlah"
                      value={drug.quantity}
                      onChange={(e) => edit.onChange(drug.id, 'quantity', e.target.value)}
                      className={`w-20 mx-auto text-center ${EDIT_FIELD}`}
                    />
                  ) : (
                    drug.quantity
                  )}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  Rp {(drug.price || 0).toLocaleString('id-ID')}
                </td>
                <td className="px-4 py-3 text-right font-bold text-foreground">
                  Rp {((drug.price || 0) * drug.quantity).toLocaleString('id-ID')}
                </td>
                {edit && (
                  <td className="px-4 py-3 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => edit.onRemove(drug.id)}
                      aria-label="Hapus item"
                      className="h-auto w-auto p-2 text-red-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={edit ? 5 : 4} className="px-4 py-6 text-center text-muted-foreground">
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
