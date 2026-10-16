import React from 'react';
import { ChartColumn, ChartPie } from 'lucide-react';
import type { Product } from '@/features/products/types';
import type { CategoryStat } from '../stockAnalytics';

interface StockChartsProps {
  topProducts: Product[];
  categoryStats: CategoryStat[];
  totalSku: number;
}

// Grafik level stok produk teratas dan distribusi kategori.
const StockCharts: React.FC<StockChartsProps> = ({ topProducts, categoryStats, totalSku }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Bar Chart: Stock Levels */}
    <div className="bg-card-light dark:bg-card-dark rounded-3xl p-6 shadow-soft">
      <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
        <ChartColumn className="size-6 text-primary" aria-hidden />
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
          <ChartPie className="size-6 text-secondary" aria-hidden />
          Distribusi Kategori
        </h3>
        <div className="space-y-4">
          {categoryStats.map((stat, i) => (
            <div key={stat.name} className="space-y-1">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                <span className="text-text-secondary-light">{stat.name}</span>
                <span className="text-text-primary-light dark:text-white">{stat.percent}%</span>
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
          <span className="text-xl font-bold">{totalSku}</span>
          <span className="text-[8px] uppercase font-bold text-text-secondary-light tracking-widest">
            Total SKU
          </span>
        </div>
      </div>
    </div>
  </div>
);

export default StockCharts;
