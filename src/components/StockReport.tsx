import React, { useState, useMemo, useEffect } from 'react';
import { Button } from './ui/button';
import { Category } from '../types';
import { useProducts } from '../hooks/useProducts';
import StatCard from './StatCard';
import { DataTable } from './ui/data-table';
import { createTransactionReportColumns } from './TransactionReportColumns';
import { stockMutationColumns } from './StockMutationColumns';
import { exportTransactionReportToExcel, exportStockMutationToExcel } from '../lib/exportUtils';
import { toDate } from '../lib/utils';

import { api, StockMutationRow, TransactionReportRow } from '../lib/api';

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

const StockReport: React.FC = () => {
  const { data: productData } = useProducts({ page: 1, perPage: 1000 });
  const products = productData?.data || [];

  const [activeTab, setActiveTab] = useState<'analysis' | 'transactions' | 'mutation'>('analysis');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('Semua');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');

  // Transaction Report State
  const [txReport, setTxReport] = useState<TransactionReportRow[]>([]);
  const [mutations, setMutations] = useState<StockMutationRow[]>([]);

  // Separate date ranges for each report
  const [txStartDate, setTxStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [txEndDate, setTxEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [mutationStartDate, setMutationStartDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [mutationEndDate, setMutationEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [txStatus, setTxStatus] = useState<'Semua' | 'Menunggu' | 'Selesai'>('Semua');

  // Period filters
  const [txPeriod, setTxPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'>(
    'daily',
  );
  const [mutationPeriod, setMutationPeriod] = useState<
    'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
  >('daily');

  // Store all data (used for both display and Excel export)
  const [allTxData, setAllTxData] = useState<TransactionReportRow[]>([]);
  const [allMutationData, setAllMutationData] = useState<StockMutationRow[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionReportRow | null>(null);

  // Filtering Logic (Analysis)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'Semua' || p.category === filterCategory;

      const isCritical = p.stock <= p.minStock / 2;
      const isLow = p.stock <= p.minStock && !isCritical;
      const currentStatus = isCritical ? 'Kritikal' : isLow ? 'Menipis' : 'Aman';
      const matchesStatus = filterStatus === 'Semua' || currentStatus === filterStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchTerm, filterCategory, filterStatus]);

  // Analytics Calculations
  const totalValue = products.reduce((acc, p) => acc + p.stock * p.sellingPrice, 0);
  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;
  const criticalStockCount = products.filter((p) => p.stock <= p.minStock / 2).length;

  // Data for Category Donut Chart
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    products.forEach((p) => {
      stats[p.category] = (stats[p.category] || 0) + 1;
    });
    return Object.entries(stats).map(([name, count]) => ({
      name,
      count,
      percent: Math.round((count / products.length) * 100),
    }));
  }, [products]);

  // Data for Stock Level Bar Chart (Top 5 items)
  const topProducts = useMemo(() => {
    return [...products].sort((a, b) => b.stock - a.stock).slice(0, 5);
  }, [products]);

  // Helper function to calculate date range based on period
  const calculateDateRange = (period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom') => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (period) {
      case 'daily':
        start = today;
        end = today;
        break;
      case 'weekly':
        start = new Date(today);
        start.setDate(today.getDate() - 7);
        end = today;
        break;
      case 'monthly':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'yearly':
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
        break;
      case 'custom':
        // Don't change dates for custom
        return null;
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  };

  // Handle period change for transaction report
  const handleTxPeriodChange = (period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom') => {
    setTxPeriod(period);
    const range = calculateDateRange(period);
    if (range) {
      setTxStartDate(range.start);
      setTxEndDate(range.end);
    }
  };

  // Handle period change for mutation report
  const handleMutationPeriodChange = (
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom',
  ) => {
    setMutationPeriod(period);
    const range = calculateDateRange(period);
    if (range) {
      setMutationStartDate(range.start);
      setMutationEndDate(range.end);
    }
  };

  // Generalized data fetching — always fetch ALL data for the period.
  // Pagination and column-filtering are handled inside <DataTable pageSize={10}>,
  // so the page count will always reflect the currently-filtered row count.
  const fetchData = async () => {
    try {
      if (activeTab === 'analysis') {
        // Analysis data is derived from props and useMemo, no direct fetch here
      } else if (activeTab === 'transactions') {
        const allData = await api.getTransactionReport(txStartDate, txEndDate, {
          page: 1,
          perPage: 100000,
          status: txStatus === 'Semua' ? undefined : txStatus,
        });
        setTxReport(allData.data);
        setAllTxData(allData.data);
      } else if (activeTab === 'mutation') {
        const allData = await api.getStockMutationReport(mutationStartDate, mutationEndDate, {
          page: 1,
          perPage: 100000,
        });
        setMutations(allData.data);
        setAllMutationData(allData.data);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, txStartDate, txEndDate, txStatus, mutationStartDate, mutationEndDate]);

  // Export handlers
  const handleExportTransactions = () => {
    void exportTransactionReportToExcel(allTxData, txStartDate, txEndDate);
  };

  const handleExportMutations = () => {
    void exportStockMutationToExcel(allMutationData, mutationStartDate, mutationEndDate);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-4">
        <div className="flex gap-3">
          <div className="flex bg-gray-100 dark:bg-card-dark rounded-xl p-1">
            <Button
              variant={activeTab === 'analysis' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('analysis')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-none ${activeTab === 'analysis' ? 'bg-white shadow text-primary hover:bg-white hover:text-primary' : 'text-text-secondary-light hover:text-primary bg-transparent'}`}
            >
              Analisis
            </Button>

            <Button
              variant={activeTab === 'transactions' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('transactions')}
              className={`px-6 py-3 text-sm font-bold rounded-xl transition-all shadow-none h-auto ${
                activeTab === 'transactions'
                  ? 'bg-primary text-white shadow-md hover:bg-primary/90'
                  : 'text-text-secondary-light hover:bg-white dark:hover:bg-white/5 bg-transparent'
              }`}
            >
              Laporan Transaksi
            </Button>
            <Button
              variant={activeTab === 'mutation' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('mutation')}
              className={`px-6 py-3 text-sm font-bold rounded-xl transition-all shadow-none h-auto ${
                activeTab === 'mutation'
                  ? 'bg-primary text-white shadow-md hover:bg-primary/90'
                  : 'text-text-secondary-light hover:bg-white dark:hover:bg-white/5 bg-transparent'
              }`}
            >
              Mutasi Stok
            </Button>
          </div>
        </div>
      </div>

      {activeTab === 'analysis' && (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              label="Nilai Inventaris"
              value={`Rp ${(totalValue / 1000000).toFixed(1)}jt`}
              icon="payments"
              color="primary"
            />
            <StatCard
              label="Total SKU"
              value={products.length}
              icon="inventory_2"
              color="blue-500"
            />
            <StatCard label="Stok Menipis" value={lowStockCount} icon="warning" color="amber-500" />
            <StatCard
              label="Stok Kritikal"
              value={criticalStockCount}
              icon="dangerous"
              color="red-500"
            />
          </div>

          {/* Analytics Visualization Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart: Stock Levels */}
            <div className="bg-card-light dark:bg-card-dark rounded-3xl p-6 shadow-soft">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <span className="material-icons-round text-primary">bar_chart</span>
                Level Stok Produk Teratas
              </h3>
              <div className="h-64 flex items-end justify-around gap-4 px-2">
                {topProducts.map((p) => (
                  <div key={p.id} className="flex flex-col items-center flex-1 group relative">
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-white text-[10px] px-2 py-1 rounded font-bold whitespace-nowrap z-10">
                      Stok: {p.stock}
                    </div>
                    <div className="w-full bg-background-light dark:bg-background-dark rounded-t-xl h-48 relative overflow-hidden">
                      <div
                        className="absolute bottom-0 w-full bg-primary/80 group-hover:bg-primary transition-all duration-500"
                        style={{ height: `${Math.min(100, (p.stock / 250) * 100)}%` }}
                      ></div>
                      <div
                        className="absolute bottom-0 w-full border-t-2 border-dashed border-red-400"
                        style={{ bottom: `${(p.minStock / 250) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] font-bold text-text-secondary-light mt-2 text-center line-clamp-1">
                      {p.name}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-text-secondary-light mt-4 text-center italic">
                *Garis merah menunjukkan batas minimum stok
              </p>
            </div>

            {/* Donut Chart: Category Distribution */}
            <div className="bg-card-light dark:bg-card-dark rounded-3xl p-6 shadow-soft flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <span className="material-icons-round text-secondary">pie_chart</span>
                  Distribusi Kategori
                </h3>
                <div className="space-y-4">
                  {categoryStats.map((stat, i) => (
                    <div key={stat.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                        <span className="text-text-secondary-light">{stat.name}</span>
                        <span className="text-text-primary-light dark:text-white">
                          {stat.percent}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-background-light dark:bg-background-dark rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${i % 2 === 0 ? 'bg-primary' : 'bg-secondary'}`}
                          style={{ width: `${stat.percent}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative w-40 h-40 shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-background-light dark:text-background-dark"
                  ></circle>
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="transparent"
                    stroke="#4318FF"
                    strokeWidth="3"
                    strokeDasharray="65 35"
                    strokeDashoffset="25"
                  ></circle>
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="transparent"
                    stroke="#6AD2FF"
                    strokeWidth="3"
                    strokeDasharray="35 65"
                    strokeDashoffset="60"
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-bold">{products.length}</span>
                  <span className="text-[8px] uppercase font-bold text-text-secondary-light tracking-widest">
                    Total SKU
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
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
              className="p-3 text-text-secondary-light hover:text-red-500 transition-colors h-auto w-auto"
              title="Reset Filter"
            >
              <span className="material-icons-round">filter_alt_off</span>
            </Button>
          </div>

          {/* Results Table */}
          <div className="bg-card-light dark:bg-card-dark rounded-3xl p-6 shadow-soft">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Detail Status Stok</h3>
              <span className="text-xs font-bold text-text-secondary-light uppercase tracking-widest">
                {filteredProducts.length} Produk ditemukan
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs uppercase font-bold text-text-secondary-light border-b border-gray-100 dark:border-gray-800">
                    <th className="pb-4 pl-2">Informasi Produk</th>
                    <th className="pb-4 text-center">Stok</th>
                    <th className="pb-4 text-center">Batas Aman</th>
                    <th className="pb-4">Estimasi Nilai</th>
                    <th className="pb-4">Health Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredProducts.map((p) => {
                    const isCritical = p.stock <= p.minStock / 2;
                    const isLow = p.stock <= p.minStock && !isCritical;

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                      >
                        <td className="py-4 pl-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-1 h-10 ${p.color} rounded-full`}></div>
                            <div>
                              <p className="font-bold text-text-primary-light dark:text-white group-hover:text-primary transition-colors">
                                {p.name}
                              </p>
                              <p className="text-[10px] text-text-secondary-light uppercase tracking-tighter">
                                {p.category} • {p.unit}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-center font-bold text-lg">{p.stock}</td>
                        <td className="py-4 text-center text-text-secondary-light font-medium">
                          {p.minStock}
                        </td>
                        <td className="py-4 font-bold text-sm">
                          Rp {(p.stock * p.sellingPrice).toLocaleString('id-ID')}
                        </td>
                        <td className="py-4">
                          {isCritical ? (
                            <span className="px-3 py-1.5 bg-red-100 text-red-600 rounded-xl text-[10px] font-bold flex items-center gap-1 w-fit uppercase tracking-wider">
                              <span className="material-icons-round text-xs">report</span> Kritikal
                            </span>
                          ) : isLow ? (
                            <span className="px-3 py-1.5 bg-amber-100 text-amber-600 rounded-xl text-[10px] font-bold flex items-center gap-1 w-fit uppercase tracking-wider">
                              <span className="material-icons-round text-xs">warning</span> Menipis
                            </span>
                          ) : (
                            <span className="px-3 py-1.5 bg-green-100 text-green-600 rounded-xl text-[10px] font-bold flex items-center gap-1 w-fit uppercase tracking-wider">
                              <span className="material-icons-round text-xs">check_circle</span>{' '}
                              Aman
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <div className="flex flex-col items-center opacity-40">
                          <span className="material-icons-round text-5xl mb-2">inventory_2</span>
                          <p className="font-bold text-sm">
                            Tidak ada produk yang sesuai dengan filter.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="bg-card-light dark:bg-card-dark rounded-3xl p-6 shadow-soft">
            <div className="flex flex-wrap items-end gap-4 mb-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-text-secondary-light">
                  Periode
                </label>
                <select
                  value={txPeriod}
                  onChange={(e) => handleTxPeriodChange(e.target.value as ReportPeriod)}
                  className="block w-full rounded-xl border-gray-200 bg-white px-4 py-2 text-text-primary-light dark:border-gray-700 dark:bg-card-dark dark:text-white"
                >
                  <option value="daily">Hari Ini</option>
                  <option value="weekly">7 Hari Terakhir</option>
                  <option value="monthly">Bulan Ini</option>
                  <option value="yearly">Tahun Ini</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-text-secondary-light">
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  value={txStartDate}
                  onChange={(e) => {
                    setTxStartDate(e.target.value);
                    setTxPeriod('custom');
                  }}
                  className="block w-full rounded-xl border-gray-200 bg-white px-4 py-2 text-text-primary-light dark:border-gray-700 dark:bg-card-dark dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-text-secondary-light">
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  value={txEndDate}
                  onChange={(e) => {
                    setTxEndDate(e.target.value);
                    setTxPeriod('custom');
                  }}
                  className="block w-full rounded-xl border-gray-200 bg-white px-4 py-2 text-text-primary-light dark:border-gray-700 dark:bg-card-dark dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-text-secondary-light">
                  Status
                </label>
                <select
                  value={txStatus}
                  onChange={(e) => {
                    setTxStatus(e.target.value as 'Semua' | 'Menunggu' | 'Selesai');
                  }}
                  className="block w-full rounded-xl border-gray-200 bg-white px-4 py-2 text-text-primary-light dark:border-gray-700 dark:bg-card-dark dark:text-white"
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Menunggu">Menunggu</option>
                  <option value="Selesai">Selesai</option>
                </select>
              </div>
              <Button
                onClick={() => fetchData()}
                className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-colors h-auto flex items-center gap-2"
              >
                <span className="material-icons-round text-base">search</span>
                Tampilkan Laporan
              </Button>
              <Button
                onClick={handleExportTransactions}
                variant="outline"
                disabled={allTxData.length === 0}
                className="px-6 py-2.5 rounded-xl font-bold h-auto flex items-center gap-2"
              >
                <span className="material-icons-round text-base">download</span>
                Export Excel
              </Button>
            </div>

            <DataTable
              columns={createTransactionReportColumns({ onViewDetail: setSelectedTransaction })}
              data={txReport}
              searchable={false}
              pageSize={10}
            />
          </div>
        </div>
      )}
      {activeTab === 'mutation' && (
        <div className="space-y-4">
          <div className="bg-card-light dark:bg-card-dark rounded-[20px] shadow-soft p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-text-primary-light dark:text-white">
                Laporan Mutasi Stok
              </h3>
              <Button
                onClick={handleExportMutations}
                variant="outline"
                disabled={allMutationData.length === 0}
                className="px-6 py-2.5 rounded-xl font-bold h-auto flex items-center gap-2"
              >
                <span className="material-icons-round text-base">download</span>
                Export Excel
              </Button>
            </div>

            <div className="flex flex-wrap items-end gap-4 mb-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-text-secondary-light">
                  Periode
                </label>
                <select
                  value={mutationPeriod}
                  onChange={(e) => handleMutationPeriodChange(e.target.value as ReportPeriod)}
                  className="block w-full rounded-xl border-gray-200 bg-white px-4 py-2 text-text-primary-light dark:border-gray-700 dark:bg-card-dark dark:text-white"
                >
                  <option value="daily">Hari Ini</option>
                  <option value="weekly">7 Hari Terakhir</option>
                  <option value="monthly">Bulan Ini</option>
                  <option value="yearly">Tahun Ini</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-text-secondary-light">
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  value={mutationStartDate}
                  onChange={(e) => {
                    setMutationStartDate(e.target.value);
                    setMutationPeriod('custom');
                  }}
                  className="block w-full rounded-xl border-gray-200 bg-white px-4 py-2 text-text-primary-light dark:border-gray-700 dark:bg-card-dark dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-text-secondary-light">
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  value={mutationEndDate}
                  onChange={(e) => {
                    setMutationEndDate(e.target.value);
                    setMutationPeriod('custom');
                  }}
                  className="block w-full rounded-xl border-gray-200 bg-white px-4 py-2 text-text-primary-light dark:border-gray-700 dark:bg-card-dark dark:text-white"
                />
              </div>
              <Button
                onClick={() => fetchData()}
                className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-colors h-auto flex items-center gap-2"
              >
                <span className="material-icons-round text-base">search</span>
                Tampilkan Laporan
              </Button>
            </div>

            <DataTable
              columns={stockMutationColumns}
              data={mutations}
              searchable={false}
              pageSize={10}
            />
          </div>
        </div>
      )}
      {selectedTransaction && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-card-dark w-full max-w-4xl rounded-[32px] shadow-soft p-8 overflow-y-auto max-h-[90vh] relative">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-text-primary-light dark:text-white">
                  Detail Transaksi
                </h3>
                <p className="text-sm text-text-secondary-light">{selectedTransaction.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                className="p-2 bg-background-light dark:bg-white/5 rounded-full hover:bg-gray-200 transition-colors"
              >
                <span className="material-icons-round">close</span>
              </button>
            </div>

            <div
              className={`grid grid-cols-1 ${selectedTransaction.type === 'keluar' ? 'md:grid-cols-3 xl:grid-cols-6' : 'md:grid-cols-3 xl:grid-cols-5'} gap-4 mb-6`}
            >
              <div className="rounded-2xl bg-background-light dark:bg-background-dark p-4">
                <p className="text-xs uppercase font-bold text-text-secondary-light mb-2">
                  Tanggal
                </p>
                <p className="font-bold text-text-primary-light dark:text-white">
                  {toDate(selectedTransaction.date).toLocaleString('id-ID')}
                </p>
              </div>
              <div className="rounded-2xl bg-background-light dark:bg-background-dark p-4">
                <p className="text-xs uppercase font-bold text-text-secondary-light mb-2">Tipe</p>
                <p className="font-bold text-text-primary-light dark:text-white">
                  {selectedTransaction.type === 'masuk' ? 'Masuk' : 'Keluar'}
                </p>
              </div>
              <div className="rounded-2xl bg-background-light dark:bg-background-dark p-4">
                <p className="text-xs uppercase font-bold text-text-secondary-light mb-2">Sumber</p>
                <p className="font-bold text-text-primary-light dark:text-white">
                  {selectedTransaction.source === 'PEMBELIAN'
                    ? 'Pembelian'
                    : selectedTransaction.source === 'KASIR_LANGSUNG'
                      ? 'Kasir Langsung'
                      : selectedTransaction.source === 'PENGAJUAN_NAKES'
                        ? 'Pengajuan Nakes'
                        : selectedTransaction.source || '-'}
                </p>
              </div>
              <div className="rounded-2xl bg-background-light dark:bg-background-dark p-4">
                <p className="text-xs uppercase font-bold text-text-secondary-light mb-2">Status</p>
                <p className="font-bold text-text-primary-light dark:text-white">
                  {selectedTransaction.status || '-'}
                </p>
              </div>
              <div className="rounded-2xl bg-background-light dark:bg-background-dark p-4">
                <p className="text-xs uppercase font-bold text-text-secondary-light mb-2">
                  {selectedTransaction.type === 'masuk' ? 'Nama Supplier' : 'Nama Pasien'}
                </p>
                <p className="font-bold text-text-primary-light dark:text-white">
                  {selectedTransaction.patient || '-'}
                </p>
              </div>
              {selectedTransaction.type === 'keluar' && (
                <div className="rounded-2xl bg-background-light dark:bg-background-dark p-4">
                  <p className="text-xs uppercase font-bold text-text-secondary-light mb-2">
                    Tanggal Lahir Pasien
                  </p>
                  <p className="font-bold text-text-primary-light dark:text-white">
                    {selectedTransaction.birthDate
                      ? new Date(selectedTransaction.birthDate).toLocaleDateString('id-ID')
                      : '-'}
                  </p>
                </div>
              )}
              <div className="rounded-2xl bg-background-light dark:bg-background-dark p-4">
                <p className="text-xs uppercase font-bold text-text-secondary-light mb-2">Nakes</p>
                <p className="font-bold text-text-primary-light dark:text-white">
                  {selectedTransaction.nakes || '-'}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-lg text-text-primary-light dark:text-white mb-3">
                  Detail Obat
                </h4>
                <div className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-white/5 text-text-secondary-light font-bold border-b border-gray-100 dark:border-gray-800 uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3">Nama Obat</th>
                        <th className="px-4 py-3 text-center">Qty</th>
                        <th className="px-4 py-3 text-right">Harga</th>
                        <th className="px-4 py-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {selectedTransaction.drugDetails?.length > 0 ? (
                        selectedTransaction.drugDetails.map((drug) => (
                          <tr key={drug.id}>
                            <td className="px-4 py-3 font-medium text-text-primary-light dark:text-white">
                              {drug.name}
                            </td>
                            <td className="px-4 py-3 text-center">{drug.quantity}</td>
                            <td className="px-4 py-3 text-right">
                              Rp {Number(drug.price || 0).toLocaleString('id-ID')}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-text-primary-light dark:text-white">
                              Rp {Number(drug.subtotal || 0).toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-6 text-center text-text-secondary-light"
                          >
                            Tidak ada detail obat.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-lg text-text-primary-light dark:text-white mb-3">
                  Detail Jasa
                </h4>
                <div className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-white/5 text-text-secondary-light font-bold border-b border-gray-100 dark:border-gray-800 uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3">Nama Jasa</th>
                        <th className="px-4 py-3 text-center">Qty</th>
                        <th className="px-4 py-3 text-right">Harga</th>
                        <th className="px-4 py-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {selectedTransaction.serviceDetails?.length > 0 ? (
                        selectedTransaction.serviceDetails.map((service) => (
                          <tr key={service.id}>
                            <td className="px-4 py-3 font-medium text-text-primary-light dark:text-white">
                              {service.name}
                            </td>
                            <td className="px-4 py-3 text-center">{service.quantity}</td>
                            <td className="px-4 py-3 text-right">
                              Rp {Number(service.price || 0).toLocaleString('id-ID')}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-text-primary-light dark:text-white">
                              Rp {Number(service.subtotal || 0).toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-6 text-center text-text-secondary-light"
                          >
                            Tidak ada detail jasa.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="rounded-2xl bg-primary/10 px-5 py-4 min-w-[280px] space-y-2">
                  {Number(selectedTransaction.serviceFee || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary-light">Biaya Layanan</span>
                      <span className="font-bold text-text-primary-light dark:text-white">
                        Rp {Number(selectedTransaction.serviceFee || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                  {Number(selectedTransaction.discount || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary-light">Diskon</span>
                      <span className="font-bold text-red-500">
                        - Rp {Number(selectedTransaction.discount || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-xs uppercase font-bold text-text-secondary-light mb-1">
                      Grand Total
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      Rp {Number(selectedTransaction.total || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockReport;
