import React, { useMemo, useState } from 'react';
import { Archive, Download, Plus, SearchX } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ListWithPanel } from '@/components/layout/ListWithPanel';
import { Toolbar, ToolbarSpacer } from '@/components/data/Toolbar';
import { SearchInput } from '@/components/data/SearchInput';
import { SegmentedControl } from '@/components/data/SegmentedControl';
import { FilterChips } from '@/components/data/FilterChips';
import { ResponsiveGrid } from '@/components/data/ResponsiveGrid';
import { ItemCard } from '@/components/data/ItemCard';
import { Pagination } from '@/components/data/Pagination';
import { StatusChip } from '@/components/data/StatusChip';
import { Meter } from '@/components/data/Meter';
import { OptionSelect } from '@/components/form/OptionSelect';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/QueryState';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { useGridPageSize } from '@/hooks/useGridPageSize';
import { useListSelection } from '@/hooks/useListSelection';
import { rp, rpShort } from '@/lib/format';
import { exportProductsToExcel } from '@/features/reports/exportUtils';
import {
  useAllProducts,
  useCreateProduct,
  useDeleteProduct,
  useUpdateProduct,
} from './useProducts';
import {
  CATEGORIES,
  CATEGORY_META,
  PRODUCT_SORTS,
  STOCK_STATUS_META,
  collectIngredientNames,
  productMatches,
  sortProducts,
  stockStatus,
  type ProductSort,
} from './catalog';
import { ProductBrandTag, ProductMeta, ProductTitle } from './components/ProductTitle';
import { ProductFormPanel } from './components/ProductFormPanel';
import { Category, type Product } from './types';

type CategoryFilter = 'Semua' | Category;
type StatusFilter = 'menipis' | 'habis' | null;

const GRID_ROWS = 4;

const ProductManagement: React.FC = () => {
  const { showToast } = useToast();
  const { data: products = [], isPending, isError, refetch } = useAllProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('Semua');
  const [status, setStatus] = useState<StatusFilter>(null);
  const [sort, setSort] = useState<ProductSort>('nama');
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<Product | null>(null);
  // Naik setiap Batal, supaya form produk baru kembali kosong
  const [formKey, setFormKey] = useState(0);

  // selectedId kosong = panel "Tambah produk"
  const { selectedId, select, panelOpen, openPanel, closePanel, setSelectedId } =
    useListSelection<string>();
  const selected = products.find((p) => p.id === selectedId);

  const grid = useGridPageSize(208, GRID_ROWS);

  const counts = useMemo(() => {
    const byCategory = new Map<Category, number>();
    let low = 0;
    let out = 0;
    let value = 0;
    for (const p of products) {
      byCategory.set(p.category, (byCategory.get(p.category) ?? 0) + 1);
      const s = stockStatus(p);
      if (s === 'menipis') low += 1;
      if (s === 'habis') out += 1;
      value += p.stock * p.sellingPrice;
    }
    return { byCategory, low, out, value };
  }, [products]);

  const ingredientNames = useMemo(() => collectIngredientNames(products), [products]);

  const existingCodes = useMemo(() => products.map((p) => p.code), [products]);

  const filtered = useMemo(
    () =>
      sortProducts(
        products.filter(
          (p) =>
            (category === 'Semua' || p.category === category) &&
            (!status || stockStatus(p) === status) &&
            productMatches(p, query),
        ),
        sort,
      ),
    [products, category, status, query, sort],
  );

  const pages = Math.max(1, Math.ceil(filtered.length / grid.pageSize));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * grid.pageSize, current * grid.pageSize);

  const resetPage =
    <T,>(setter: (v: T) => void) =>
    (v: T) => {
      setter(v);
      setPage(1);
    };
  const toggleStatus = (next: Exclude<StatusFilter, null>) =>
    resetPage(setStatus)(status === next ? null : next);

  const startNew = () => {
    setSelectedId(null);
    openPanel();
  };

  const handleSave = async (data: Partial<Product>) => {
    try {
      if (selected) {
        await updateProduct.mutateAsync({ id: selected.id, updates: data });
        showToast('Perubahan produk disimpan.', 'success');
      } else {
        await createProduct.mutateAsync(data);
        showToast(`${data.name} ditambahkan.`, 'success');
      }
      return true;
    } catch (error) {
      console.error('Error saving product:', error);
      showToast('Gagal menyimpan produk', 'error');
      return false;
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteProduct.mutateAsync(toDelete.id);
      showToast(`${toDelete.name} dihapus.`, 'success');
      setToDelete(null);
      select(null);
      closePanel();
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast('Gagal menghapus produk', 'error');
    }
  };

  const categoryOptions = [
    { value: 'Semua' as const, label: 'Semua', count: products.length },
    ...CATEGORIES.map((c) => ({
      value: c,
      label: CATEGORY_META[c].short,
      count: counts.byCategory.get(c) ?? 0,
    })),
  ];

  const isFiltered = !!query.trim() || category !== 'Semua' || !!status;

  const list = (
    <Card className="flex flex-col gap-3 p-3">
      <Toolbar>
        <SearchInput
          value={query}
          onChange={resetPage(setQuery)}
          placeholder="Cari nama, merek, kode, atau zat"
          label="Cari produk"
        />
        <SegmentedControl
          label="Kategori"
          options={categoryOptions}
          value={category}
          onChange={resetPage(setCategory)}
        />
        <ToolbarSpacer />
        <OptionSelect
          aria-label="Urutkan"
          className="w-auto"
          value={sort}
          onValueChange={setSort}
          options={PRODUCT_SORTS}
        />
      </Toolbar>
      <FilterChips
        filters={
          status ? [{ key: 'status', label: `Status: ${STOCK_STATUS_META[status].label}` }] : []
        }
        onRemove={() => resetPage(setStatus)(null)}
      />

      {isPending ? (
        <LoadingState label="Memuat produk..." />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <>
          <ResponsiveGrid ref={grid.ref} cols={grid.cols}>
            {visible.map((p) => {
              const s = stockStatus(p);
              const tone = STOCK_STATUS_META[s].tone;
              return (
                <ItemCard
                  key={p.id}
                  topStart={<ProductBrandTag product={p} />}
                  topEnd={
                    s !== 'aman' && (
                      <StatusChip tone={tone}>{STOCK_STATUS_META[s].label}</StatusChip>
                    )
                  }
                  title={<ProductTitle product={p} showBrand={false} />}
                  subtitle={<ProductMeta product={p} />}
                  meter={
                    <Meter
                      value={p.stock / Math.max(p.minStock * 3, 1)}
                      tone={tone === 'warn' || tone === 'bad' ? tone : 'ok'}
                      label="Sisa stok"
                    />
                  }
                  footer={
                    <>
                      <span>
                        <b>{p.stock.toLocaleString('id-ID')}</b> {p.unit.toLowerCase()} · min{' '}
                        {p.minStock}
                      </span>
                      <b>{rp(p.sellingPrice)}</b>
                    </>
                  }
                  selected={p.id === selectedId}
                  onClick={() => select(p.id)}
                />
              );
            })}
          </ResponsiveGrid>
          {filtered.length === 0 && (
            <EmptyState
              icon={isFiltered ? SearchX : Archive}
              title={isFiltered ? 'Tidak ada produk yang cocok' : 'Belum ada produk'}
              description={isFiltered ? 'Ubah kata kunci atau hapus filter.' : undefined}
            />
          )}
          <Pagination
            page={current}
            pageSize={grid.pageSize}
            total={filtered.length}
            onPageChange={setPage}
            note={`${grid.pageSize} per halaman (${grid.cols} × ${GRID_ROWS}, mengikuti lebar layar)`}
          />
        </>
      )}
    </Card>
  );

  return (
    <>
      <PageHeader
        stats={[
          { id: 'total', label: 'Produk', value: products.length.toLocaleString('id-ID') },
          { id: 'value', label: 'Nilai stok', value: rpShort(counts.value) },
          {
            id: 'low',
            label: 'Menipis',
            value: counts.low,
            tone: 'warn',
            onClick: () => toggleStatus('menipis'),
            pressed: status === 'menipis',
          },
          {
            id: 'out',
            label: 'Habis',
            value: counts.out,
            tone: 'bad',
            onClick: () => toggleStatus('habis'),
            pressed: status === 'habis',
          },
        ]}
        actions={
          <>
            <Button
              variant="glass"
              onClick={() => void exportProductsToExcel(filtered)}
              disabled={filtered.length === 0}
            >
              <Download aria-hidden />
              Ekspor Excel
            </Button>
            <Button variant="light" onClick={startNew}>
              <Plus aria-hidden />
              Tambah produk
            </Button>
          </>
        }
      />

      <ListWithPanel
        list={list}
        panelOpen={panelOpen}
        onPanelClose={closePanel}
        panel={
          <ProductFormPanel
            key={`${selected?.id ?? 'new'}-${formKey}`}
            product={selected}
            existingCodes={existingCodes}
            ingredientNames={ingredientNames}
            saving={createProduct.isPending || updateProduct.isPending}
            onSave={handleSave}
            onDelete={setToDelete}
            onCancel={() => {
              setFormKey((k) => k + 1);
              select(null);
              closePanel();
            }}
          />
        }
      />

      <ConfirmationModal
        isOpen={!!toDelete}
        title="Hapus produk?"
        message={`${toDelete?.name ?? 'Produk ini'} akan dihapus dari daftar. Riwayat transaksi tetap tersimpan.`}
        confirmText="Ya, hapus"
        cancelText="Batal"
        type="danger"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
};

export default ProductManagement;
