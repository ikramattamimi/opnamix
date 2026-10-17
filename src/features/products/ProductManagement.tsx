import React, { useState, useEffect } from 'react';
import { Product, Category } from './types';
import StatCard from '@/components/common/StatCard';
import {
  Archive,
  CircleDollarSign,
  Download,
  FunnelX,
  Plus,
  Search,
  SearchX,
  TriangleAlert,
} from 'lucide-react';
import ProductForm from './ProductForm';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from './useProducts';
import PaginationControls from '@/components/common/PaginationControls';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/QueryState';
import { DataTable } from '@/components/ui/data-table';
import { createProductColumns } from './ProductColumns';
import { useToast } from '@/components/ui/toast';
import { exportProductsToExcel } from '@/features/reports/exportUtils';
import { useDashboardStats } from '@/features/dashboard/useDashboard';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';

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
  const {
    data: paginatedData,
    isPlaceholderData,
    isPending,
    isError,
    refetch,
  } = useProducts({
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

  // Stat nyata, berbagi cache dengan Dashboard
  const { data: dashboardStats, error: statsError } = useDashboardStats();

  useEffect(() => {
    if (statsError) console.error(statsError);
  }, [statsError]);

  const stats = {
    total: totalProducts,
    lowStock: dashboardStats?.lowStockCount ?? 0,
    totalValue: dashboardStats?.totalValue ?? 0,
  };

  return (
    <>
      <PageLayout>
        <PageHeader
          title="Daftar Produk"
          description="Kelola data obat dan alkes beserta stok dan harganya."
          actions={
            <>
              <Button
                variant="outline"
                className="shadow-md flex items-center gap-2 [&_svg]:size-6"
                onClick={() => void exportProductsToExcel(products)}
                disabled={products.length === 0}
              >
                <Download aria-hidden />
                Ekspor Excel
              </Button>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="shadow-md flex items-center gap-2 [&_svg]:size-6"
              >
                <Plus aria-hidden />
                Tambah Produk Baru
              </Button>
            </>
          }
        />

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            label="Total Produk"
            value={stats.total.toLocaleString()}
            icon={Archive}
            color="primary"
          />
          <StatCard
            label="Total Nilai"
            value={`Rp ${stats.totalValue.toLocaleString('id-ID')}`}
            icon={CircleDollarSign}
            color="green-500"
          />
          <StatCard
            label="Stok Menipis (Top 3)"
            value={stats.lowStock}
            icon={TriangleAlert}
            color="red-500"
          />
        </div>

        {/* Filter Bar */}
        <Card className="p-4 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground pointer-events-none"
              aria-hidden
            />
            <Input
              type="text"
              placeholder="Cari produk atau SKU..."
              aria-label="Cari produk"
              className="w-full pl-12 pr-4 bg-background border-none text-sm font-medium focus:ring-2 focus:ring-primary/20 focus-visible:ring-2 focus-visible:ring-primary/20"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase ml-2">
              Kategori:
            </span>
            <Select
              value={filterCategory}
              onValueChange={(value) => {
                setFilterCategory(value);
                setPage(1);
              }}
            >
              <SelectTrigger
                aria-label="Filter kategori"
                className="w-auto gap-2 bg-background border-none px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Semua">Semua</SelectItem>
                {Object.values(Category).map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSearchTerm('');
              setFilterCategory('Semua');
              setPage(1);
            }}
            className="text-muted-foreground hover:text-red-500 transition-colors [&_svg]:size-6"
            title="Reset Filter"
            aria-label="Reset Filter"
          >
            <FunnelX aria-hidden />
          </Button>
        </Card>

        {/* Table */}
        <div className="w-full">
          <Card className="p-6">
            {isPending ? (
              <LoadingState label="Memuat produk..." />
            ) : isError ? (
              <ErrorState onRetry={() => void refetch()} />
            ) : products.length === 0 ? (
              <EmptyState
                icon={searchTerm || filterCategory !== 'Semua' ? SearchX : Archive}
                title={
                  searchTerm || filterCategory !== 'Semua'
                    ? 'Tidak ada produk ditemukan.'
                    : 'Belum ada produk.'
                }
              />
            ) : (
              <DataTable
                columns={createProductColumns({ onEdit: handleEdit, onDelete: handleDelete })}
                data={products}
                searchable={false}
              />
            )}
          </Card>
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            isPlaceholderData={isPlaceholderData}
          />
        </div>
      </PageLayout>

      {/* Product Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <Card className="w-full max-w-2xl p-8 overflow-y-auto max-h-[90vh] relative">
            <ProductForm
              onSave={handleSave}
              editingProduct={editingProduct}
              onCancel={handleCloseModal}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </Card>
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
