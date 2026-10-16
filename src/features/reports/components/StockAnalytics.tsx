import React, { useMemo, useState } from 'react';
import { Archive, Banknote, FunnelX, OctagonAlert, Search, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/common/StatCard';
import { Category } from '@/features/products/types';
import { useProducts } from '@/features/products/useProducts';
import {
  filterProducts,
  getCategoryStats,
  getStockSummary,
  getTopStockProducts,
} from '../stockAnalytics';
import StockCharts from './StockCharts';
import StockStatusTable from './StockStatusTable';

// Tab analisis: ringkasan nilai inventaris, grafik, dan status stok per produk.
const StockAnalytics: React.FC = () => {
  const { data: productData } = useProducts({ page: 1, perPage: 1000 });
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
      <div className="bg-card-light dark:bg-card-dark rounded-3xl p-4 shadow-soft flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-text-secondary-light"
            aria-hidden
          />
          <input
            type="text"
            placeholder="Cari produk atau SKU..."
            className="w-full pl-12 pr-4 py-3 bg-background-light dark:bg-background-dark border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-text-secondary-light uppercase ml-2">
            Kategori:
          </span>
          <select
            className="bg-background-light dark:bg-background-dark border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-primary/20"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="Semua">Semua</option>
            {Object.values(Category).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-text-secondary-light uppercase ml-2">
            Status:
          </span>
          <select
            className="bg-background-light dark:bg-background-dark border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-primary/20"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="Semua">Semua Status</option>
            <option value="Aman">Aman</option>
            <option value="Menipis">Menipis</option>
            <option value="Kritikal">Kritikal</option>
          </select>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setSearchTerm('');
            setFilterCategory('Semua');
            setFilterStatus('Semua');
          }}
          className="p-3 text-text-secondary-light hover:text-red-500 transition-colors h-auto w-auto [&_svg]:size-6"
          title="Reset Filter"
          aria-label="Reset Filter"
        >
          <FunnelX className="size-6" aria-hidden />
        </Button>
      </div>

      <StockStatusTable products={filteredProducts} />
    </>
  );
};

export default StockAnalytics;
