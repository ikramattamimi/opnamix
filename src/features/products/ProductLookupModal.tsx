import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';
import ProductForm from './ProductForm';
import { useCreateProduct } from './useProducts';
import { useToast } from '@/components/ui/toast';

interface ProductLookupModalProps {
  products: Product[];
  onSelect: (product: Product) => void;
  onClose: () => void;
  allowAddProduct?: boolean;
}

const ProductLookupModal: React.FC<ProductLookupModalProps> = ({
  products,
  onSelect,
  onClose,
  allowAddProduct = false,
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
      <div className="bg-white dark:bg-card-dark w-full max-w-2xl max-h-[80vh] flex flex-col rounded-3xl shadow-2xl animate-scaleUp">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-text-primary-light dark:text-white">
              Pilih Obat / Alkes
            </h3>
            <p className="text-sm text-text-secondary-light">
              Cari dan pilih item dari daftar master.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
          >
            <span className="material-icons-round">close</span>
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
                <span className="material-icons-round absolute left-4 top-3 text-text-secondary-light">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Cari nama obat atau kode..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-none bg-white dark:bg-black/20 focus:ring-2 focus:ring-primary text-text-primary-light dark:text-white"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
              </div>
              {allowAddProduct && (
                <Button
                  variant="ghost"
                  onClick={() => setIsAddingNew(true)}
                  className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-bold text-sm transition-colors whitespace-nowrap flex items-center gap-2 h-auto"
                >
                  <span className="material-icons-round">add</span>
                  Baru
                </Button>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2">
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => onSelect(product)}
                      className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all group text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${product.stock > 0 ? 'bg-blue-50 text-primary dark:bg-blue-500/20 dark:text-blue-300' : 'bg-red-50 text-red-500 dark:bg-red-500/20'}`}
                        >
                          <span className="material-icons-round">
                            {product.stock > 0 ? 'medication' : 'block'}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-text-primary-light dark:text-white">
                            {product.name}
                          </p>
                          <p className="text-xs text-text-secondary-light">
                            {product.code} • {product.category}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold ${product.stock > 0 ? 'text-text-primary-light dark:text-white' : 'text-red-500'}`}
                        >
                          Stok: {product.stock} {product.unit}
                        </p>
                        <p className="text-xs text-text-secondary-light">
                          Rp {product.sellingPrice.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-text-secondary-light">
                  <span className="material-icons-round text-4xl mb-2">search_off</span>
                  <p className="mb-4">Tidak ada produk ditemukan.</p>
                  {allowAddProduct && (
                    <button
                      onClick={() => setIsAddingNew(true)}
                      className="px-6 py-2 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/30 hover:bg-blue-700 transition-colors"
                    >
                      Tambah Produk Baru
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductLookupModal;
