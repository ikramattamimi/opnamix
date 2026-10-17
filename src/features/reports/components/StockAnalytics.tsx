import React, { useId, useMemo, useState } from 'react';
import { Archive, Banknote, FunnelX, OctagonAlert, Search, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import StatCard from '@/components/common/StatCard';
import { Category } from '@/features/products/types';
import { useProducts } from '@/features/products/useProducts';
import {
  filterProducts,
  getCategoryStats,
  getStockSummary,
  getTopStockProducts,
} from '../stockAnalytics';
import { FilterSelect } from './FilterSelect';
import StockCharts from './StockCharts';
import StockStatusTable from './StockStatusTable';
import { Card } from '@/components/ui/card';

const CATEGORY_OPTIONS = [
  { value: 'Semua', label: 'Semua' },
  ...Object.values(Category).map((cat) => ({ value: cat, label: cat })),
];

const STATUS_OPTIONS = [
  { value: 'Semua', label: 'Semua Status' },
  { value: 'Aman', label: 'Aman' },
  { value: 'Menipis', label: 'Menipis' },
  { value: 'Kritikal', label: 'Kritikal' },
];

const analyticsSelectClass =
  'w-auto min-w-0 bg-background rounded-xl px-4 py-2 text-sm font-bold text-inherit dark:text-inherit';

// Tab analisis: ringkasan nilai inventaris, grafik, dan status stok per produk.
const StockAnalytics: React.FC = () => {
  const id = useId();
  const productsQuery = useProducts({ page: 1, perPage: 1000 });
  const productData = productsQuery.data;
  const products = useMemo(() => productData?.data ?? [], [productData]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('Semua');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');

  const filteredProducts = useMemo(
    () =>
      filterProducts(products, {
        search: searchTerm,
        category: filterCategory,
        status: filterStatus,
      }),
    [products, searchTerm, filterCategory, filterStatus],
  );
  const summary = useMemo(() => getStockSummary(products), [products]);
  const categoryStats = useMemo(() => getCategoryStats(products), [products]);
  const topProducts = useMemo(() => getTopStockProducts(products), [products]);

  return (
    <>
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Nilai Inventaris"
          value={`Rp ${(summary.totalValue / 1000000).toFixed(1)}jt`}
          icon={Banknote}
          color="primary"
        />
        <StatCard label="Total SKU" value={summary.totalSku} icon={Archive} color="blue-500" />
        <StatCard
          label="Stok Menipis"
          value={summary.lowStockCount}
          icon={TriangleAlert}
          color="amber-500"
        />
        <StatCard
          label="Stok Kritikal"
          value={summary.criticalStockCount}
          icon={OctagonAlert}
          color="red-500"
        />
      </div>

      <StockCharts
        topProducts={topProducts}
        categoryStats={categoryStats}
        totalSku={summary.totalSku}
      />

      {/* Filters Bar */}
      <Card className="p-4 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="text"
            placeholder="Cari produk atau SKU..."
            aria-label="Cari produk atau SKU"
            className="w-full pl-12 pr-4 bg-background border-none text-sm md:text-sm font-medium shadow-none focus-visible:ring-2 focus-visible:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Label
            htmlFor={`${id}-category`}
            className="text-xs font-bold text-muted-foreground uppercase ml-2"
          >
            Kategori:
          </Label>
          <FilterSelect
            id={`${id}-category`}
            value={filterCategory}
            onValueChange={setFilterCategory}
            options={CATEGORY_OPTIONS}
            className={analyticsSelectClass}
          />
        </div>

        <div className="flex items-center gap-2">
          <Label
            htmlFor={`${id}-status`}
            className="text-xs font-bold text-muted-foreground uppercase ml-2"
          >
            Status:
          </Label>
          <FilterSelect
            id={`${id}-status`}
            value={filterStatus}
            onValueChange={setFilterStatus}
            options={STATUS_OPTIONS}
            className={analyticsSelectClass}
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setSearchTerm('');
            setFilterCategory('Semua');
            setFilterStatus('Semua');
          }}
          className="text-muted-foreground hover:text-red-500 transition-colors [&_svg]:size-6"
          title="Reset Filter"
          aria-label="Reset Filter"
        >
          <FunnelX className="size-6" aria-hidden />
        </Button>
      </Card>

      <StockStatusTable
        products={filteredProducts}
        isPending={productsQuery.isPending}
        isError={productsQuery.isError}
        onRetry={() => void productsQuery.refetch()}
      />
    </>
  );
};

export default StockAnalytics;
