import React, { useState } from 'react';
import { Ban, Pill, Plus, Search, SearchX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState, LoadingState } from '@/components/common/QueryState';
import { Product } from './types';
import ProductForm from './ProductForm';
import { useCreateProduct } from './useProducts';
import { useToast } from '@/components/ui/toast';

interface ProductLookupModalProps {
  products: Product[];
  onSelect: (product: Product) => void;
  onClose: () => void;
  allowAddProduct?: boolean;
  // Daftar produk masih dimuat oleh pemanggil
  isLoading?: boolean;
}

const ProductLookupModal: React.FC<ProductLookupModalProps> = ({
  products,
  onSelect,
  onClose,
  allowAddProduct = false,
  isLoading = false,
}) => {
  const [search, setSearch] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const createProductMutation = useCreateProduct();
  const { showToast } = useToast();

  const handleCreateProduct = async (product: Product) => {
    try {
      await createProductMutation.mutateAsync(product);
      onSelect(product); // Auto-select the new product
    } catch (error) {
      console.error('Failed to create product', error);
      showToast('Gagal membuat produk baru.', 'error');
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-card w-full max-w-2xl max-h-[80vh] flex flex-col rounded-3xl shadow-2xl animate-scaleUp">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-foreground">Pilih Obat / Alkes</h3>
            <p className="text-sm text-muted-foreground">Cari dan pilih item dari daftar master.</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Tutup"
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors [&_svg]:size-6"
          >
            <X aria-hidden />
          </Button>
        </div>

        {isAddingNew ? (
          <div className="flex-1 overflow-y-auto p-6">
            <ProductForm onSave={handleCreateProduct} onCancel={() => setIsAddingNew(false)} />
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 flex gap-3">
              <div className="relative flex-1">
                <Search
                  className="absolute left-4 top-3 size-6 text-muted-foreground pointer-events-none"
                  aria-hidden
                />
                <Input
                  type="text"
                  placeholder="Cari nama obat atau kode..."
                  aria-label="Cari produk"
                  className="h-auto w-full pl-12 pr-4 py-3 rounded-xl border-none bg-white dark:bg-black/20 focus:ring-2 focus:ring-primary focus-visible:ring-2 focus-visible:ring-primary text-base text-foreground"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
              </div>
              {allowAddProduct && (
                <Button
                  variant="ghost"
                  onClick={() => setIsAddingNew(true)}
                  className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-bold text-sm transition-colors whitespace-nowrap flex items-center gap-2 h-auto [&_svg]:size-6"
                >
                  <Plus aria-hidden />
                  Baru
                </Button>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2">
              {isLoading ? (
                <LoadingState label="Memuat produk..." />
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {filteredProducts.map((product) => (
                    <button
                      type="button"
                      key={product.id}
                      onClick={() => onSelect(product)}
                      className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all group text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${product.stock > 0 ? 'bg-blue-50 text-primary dark:bg-blue-500/20 dark:text-blue-300' : 'bg-red-50 text-red-500 dark:bg-red-500/20'}`}
                        >
                          {product.stock > 0 ? (
                            <Pill className="size-6" aria-hidden />
                          ) : (
                            <Ban className="size-6" aria-hidden />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.code} • {product.category}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold ${product.stock > 0 ? 'text-foreground' : 'text-red-500'}`}
                        >
                          Stok: {product.stock} {product.unit}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Rp {product.sellingPrice.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={SearchX}
                  title="Tidak ada produk ditemukan."
                  className="py-10"
                  action={
                    allowAddProduct && (
                      <Button type="button" onClick={() => setIsAddingNew(true)}>
                        Tambah Produk Baru
                      </Button>
                    )
                  }
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductLookupModal;
