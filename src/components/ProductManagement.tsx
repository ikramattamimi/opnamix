import React, { useState, useEffect } from 'react';
import { Product, Category } from '../types';
import StatCard from './StatCard';
import ProductForm from './ProductForm';
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '../hooks/useProducts';
import PaginationControls from './PaginationControls';
import ConfirmationModal from './ConfirmationModal';
import { Button } from './ui/button';
import { DataTable } from './ui/data-table';
import { createProductColumns } from './ProductColumns';
import { useToast } from './ui/toast';
import { exportProductsToExcel } from '../lib/exportUtils';

const ProductManagement: React.FC = () => {
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; productId: string | null }>(
    {
      isOpen: false,
      productId: null,
    },
  );

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('Semua');

  // Use hooks with filters
  const { data: paginatedData, isPlaceholderData } = useProducts({
    page,
    perPage,
    search: searchTerm,
  });
  let products = paginatedData?.data || [];

  // Client-side category filtering
  if (filterCategory !== 'Semua') {
    products = products.filter((p) => p.category === filterCategory);
  }

  const totalPages = paginatedData?.totalPages || 1;
  const totalProducts = paginatedData?.total || 0;

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(undefined);
  };

  const handleSave = async (product: Product) => {
    try {
      if (editingProduct) {
        await updateMutation.mutateAsync({ id: editingProduct.id, updates: product });
      } else {
        await createMutation.mutateAsync(product);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving product:', error);
      showToast('Gagal menyimpan produk', 'error');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, productId: id });
  };

  const confirmDelete = async () => {
    if (deleteConfirm.productId) {
      try {
        await deleteMutation.mutateAsync(deleteConfirm.productId);
        setDeleteConfirm({ isOpen: false, productId: null });
      } catch (error) {
        console.error('Error deleting product:', error);
        showToast('Gagal menghapus produk', 'error');
      }
    }
  };

  // Fetch real stats
  const [realStats, setRealStats] = useState({
    totalValue: 0,
    lowStock: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await import('../lib/api').then((m) => m.api.getDashboardStats());
        setRealStats({
          totalValue: data.totalValue,
          lowStock: data.lowStockCount,
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  const stats = {
    total: totalProducts,
    lowStock: realStats.lowStock,
    totalValue: realStats.totalValue,
  };

  return (
    <>
      <div className="space-y-6">
        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            label="Total Produk"
            value={stats.total.toLocaleString()}
            icon="inventory_2"
            color="primary"
          />
          <StatCard
            label="Total Nilai"
            value={`Rp ${stats.totalValue.toLocaleString('id-ID')}`}
            icon="monetization_on"
            color="green-500"
          />
          <StatCard
            label="Stok Menipis (Top 3)"
            value={stats.lowStock}
            icon="warning"
            color="red-500"
          />
        </div>

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-text-primary-light dark:text-white">
            Daftar Produk
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="shadow-md flex items-center gap-2"
              onClick={() => void exportProductsToExcel(products)}
              disabled={products.length === 0}
            >
              <span className="material-icons-round">file_download</span>
              Ekspor Excel
            </Button>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="shadow-md flex items-center gap-2"
            >
              <span className="material-icons-round">add</span>
              Tambah Produk Baru
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-card-light dark:bg-card-dark rounded-3xl p-4 shadow-soft flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary-light text-xl">
              search
            </span>
            <input
              type="text"
              placeholder="Cari produk atau SKU..."
              className="w-full pl-12 pr-4 py-3 bg-background-light dark:bg-background-dark border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-secondary-light uppercase ml-2">
              Kategori:
            </span>
            <select
              className="bg-background-light dark:bg-background-dark border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-primary/20"
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="Semua">Semua</option>
              {Object.values(Category).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSearchTerm('');
              setFilterCategory('Semua');
              setPage(1);
            }}
            className="p-3 text-text-secondary-light hover:text-red-500 transition-colors h-auto w-auto"
            title="Reset Filter"
          >
            <span className="material-icons-round">filter_alt_off</span>
          </Button>
        </div>

        {/* Table */}
        <div className="w-full">
          <div className="bg-card-light dark:bg-card-dark rounded-[20px] p-6 shadow-soft">
            <DataTable
              columns={createProductColumns({ onEdit: handleEdit, onDelete: handleDelete })}
              data={products}
              searchable={false}
            />
          </div>
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            isPlaceholderData={isPlaceholderData}
          />
        </div>
      </div>

      {/* Product Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-card-dark w-full max-w-2xl rounded-[32px] shadow-soft p-8 overflow-y-auto max-h-[90vh] relative">
            <ProductForm
              onSave={handleSave}
              editingProduct={editingProduct}
              onCancel={handleCloseModal}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirm.isOpen}
        title="Hapus Produk?"
        message="Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, productId: null })}
      />
    </>
  );
};

export default ProductManagement;
