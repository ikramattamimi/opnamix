import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StockAnalytics from './components/StockAnalytics';
import StockMutationReport from './components/StockMutationReport';
import TransactionReport from './components/TransactionReport';
import { PageHeader } from '@/components/layout/PageHeader';

type ReportTab = 'analysis' | 'transactions' | 'mutation';

const isReportTab = (value: string): value is ReportTab =>
  value === 'analysis' || value === 'transactions' || value === 'mutation';

const reportTabClass = (active: boolean) =>
  `px-6 text-sm font-bold transition-all shadow-none ${
    active
      ? 'bg-primary text-white shadow-md hover:bg-primary/90'
      : 'text-muted-foreground hover:bg-white dark:hover:bg-white/5 bg-transparent'
  }`;

// Halaman laporan dengan tiga tab. Isi tab tetap ter-mount (forceMount) supaya
// filter tiap tab tidak hilang saat berpindah tab; query laporan hanya jalan
// saat tab-nya aktif.
const StockReport: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('analysis');

  return (
    <>
      <PageHeader />
      <Tabs
        value={activeTab}
        onValueChange={(value) => isReportTab(value) && setActiveTab(value)}
        className="space-y-6"
      >
        {/* Top Action Bar */}
        <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-4">
          <div className="flex min-w-0 max-w-full gap-3">
            <TabsList className="flex h-auto max-w-full items-stretch justify-start overflow-x-auto bg-gray-100 dark:bg-card-dark rounded-xl p-1 text-inherit">
              <TabsTrigger value="analysis" asChild>
                <Button
                  variant={activeTab === 'analysis' ? 'default' : 'ghost'}
                  className={reportTabClass(activeTab === 'analysis')}
                >
                  Analisis
                </Button>
              </TabsTrigger>
              <TabsTrigger value="transactions" asChild>
                <Button
                  variant={activeTab === 'transactions' ? 'default' : 'ghost'}
                  className={reportTabClass(activeTab === 'transactions')}
                >
                  Laporan Transaksi
                </Button>
              </TabsTrigger>
              <TabsTrigger value="mutation" asChild>
                <Button
                  variant={activeTab === 'mutation' ? 'default' : 'ghost'}
                  className={reportTabClass(activeTab === 'mutation')}
                >
                  Mutasi Stok
                </Button>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="analysis" forceMount className="mt-0 space-y-6">
          <StockAnalytics />
        </TabsContent>
        <TabsContent value="transactions" forceMount className="mt-0 space-y-4">
          <TransactionReport active={activeTab === 'transactions'} />
        </TabsContent>
        <TabsContent value="mutation" forceMount className="mt-0 space-y-4">
          <StockMutationReport active={activeTab === 'mutation'} />
        </TabsContent>
      </Tabs>
    </>
  );
};

export default StockReport;
