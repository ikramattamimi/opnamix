import React from 'react';
import { ChartColumn, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DashboardStats } from '../api';
import { Card } from '@/components/ui/card';

// Baris grafik dashboard. Belum dirender di Dashboard (dulu berupa blok yang
// dikomentari); dipindah ke sini supaya Dashboard tetap ringkas.
// TODO: Ambil data konsumsi mingguan dari API (jumlah transaksi keluar per hari
// dalam 7 hari terakhir).

// Kelas legenda dan variabel CSS irisan memakai token kategori yang sama
const CATEGORY_COLORS: Record<string, { dot: string; slice: string }> = {
  Obat: { dot: 'bg-cat-obat', slice: 'rgb(var(--cat-obat))' },
  'BHP (Habis Pakai)': { dot: 'bg-cat-bhp', slice: 'rgb(var(--cat-bhp))' },
  'Alat Kesehatan': { dot: 'bg-cat-alkes', slice: 'rgb(var(--cat-alkes))' },
  Imunisasi: { dot: 'bg-cat-imun', slice: 'rgb(var(--cat-imun))' },
};
const FALLBACK_COLOR = { dot: 'bg-faint', slice: 'rgb(var(--faint))' };

const DashboardCharts: React.FC<{ stats: DashboardStats }> = ({ stats }) => {
  const totalItems = Object.values(stats.categoryDistribution).reduce((a, b) => a + b, 0);
  const safeTotalItems = totalItems || 1; // Prevent divide by zero
  const categories = Object.keys(stats.categoryDistribution);

  const weekly = stats.weeklyStockOut || [];
  const maxVal = Math.max(...weekly.map((w) => w.count), 1);

  let currentDeg = 0;
  const gradients = categories.slice(0, 4).map((cat) => {
    const percentage = stats.categoryDistribution[cat] / safeTotalItems;
    const startDeg = currentDeg;
    currentDeg += percentage * 360;
    const color = (CATEGORY_COLORS[cat] ?? FALLBACK_COLOR).slice;
    return `${color} ${startDeg}deg ${currentDeg}deg`;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <Card className="p-6 h-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-foreground">Pengeluaran 7 Hari Terakhir</h3>
            <p className="text-sm text-muted-foreground">Jumlah transaksi keluar per hari</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="bg-background text-primary hover:bg-gray-200 dark:hover:bg-gray-700 [&_svg]:size-5"
            aria-label="Grafik pengeluaran"
          >
            <ChartColumn aria-hidden />
          </Button>
        </div>
        <div className="h-64 flex items-end justify-between gap-2 px-2">
          {weekly.map((item, idx) => {
            const pct = Math.max((item.count / maxVal) * 100, 4); // min 4% for visibility
            return (
              <div key={idx} className="flex flex-col items-center w-full group">
                <span className="text-xs font-bold text-primary mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.count}
                </span>
                <div className="relative w-3 rounded-full bg-background h-48 overflow-hidden">
                  <div
                    className="absolute bottom-0 w-full bg-primary group-hover:bg-blue-600 transition-all duration-300 rounded-full"
                    style={{ height: `${pct}%` }}
                  ></div>
                </div>
                <span className="text-xs text-muted-foreground mt-2">{item.day}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-rows-2 gap-5">
        <Card className="p-6 flex flex-col justify-center">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-foreground">Peringatan Stok Rendah</h3>
              <p className="text-sm text-muted-foreground">Item di bawah ambang batas</p>
            </div>
            <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-2 rounded-lg">
              <TriangleAlert className="size-6" aria-hidden />
            </div>
          </div>
          <div className="space-y-3">
            {stats.lowStockItems.length > 0 ? (
              stats.lowStockItems.map((item, idx) => (
                <LowStockItem key={idx} name={item.nama} count={item.qty ?? 0} color="bg-red-500" />
              ))
            ) : (
              <p className="text-sm text-green-500 font-medium">
                Stok Aman, tidak ada item kritis.
              </p>
            )}
          </div>
        </Card>

        <Card className="p-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-foreground mb-1">Pembagian Inventaris</h3>
            <p className="text-sm text-muted-foreground mb-4">Berdasarkan Kategori</p>
            <div className="space-y-2">
              {categories.slice(0, 3).map((cat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${(CATEGORY_COLORS[cat] ?? FALLBACK_COLOR).dot}`}
                  ></div>
                  <span className="text-xs text-muted-foreground">
                    {cat} ({Math.round((stats.categoryDistribution[cat] / safeTotalItems) * 100)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative w-32 h-32 flex items-center justify-center">
            <div
              className="w-full h-full rounded-full"
              style={{ background: `conic-gradient(${gradients.join(', ')})` }}
            ></div>
            <div className="absolute inset-0 m-auto w-16 h-16 bg-card rounded-full"></div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const LowStockItem: React.FC<{ name: string; count: number; color: string }> = ({
  name,
  count,
  color,
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full ${color}`}></div>
      <span className="text-sm font-medium text-foreground">{name}</span>
    </div>
    <span
      className={`text-xs font-bold ${color === 'bg-red-500' ? 'text-red-700 bg-red-50' : 'text-orange-700 bg-orange-50'} dark:bg-opacity-10 px-2 py-1 rounded`}
    >
      Sisa {count}
    </span>
  </div>
);

export default DashboardCharts;
