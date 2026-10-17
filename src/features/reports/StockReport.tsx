import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StockAnalytics from './components/StockAnalytics';
import StockMutationReport from './components/StockMutationReport';
import TransactionReport from './components/TransactionReport';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/layout/PageHeader';

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
    <PageLayout>
      <Tabs
        value={activeTab}
        onValueChange={(value) => isReportTab(value) && setActiveTab(value)}
        className="space-y-6"
      >
        <PageHeader
          title="Laporan Stok"
          description="Analisis stok, laporan transaksi, dan mutasi stok."
          actions={
            <TabsList className="flex h-auto items-stretch justify-start bg-gray-100 dark:bg-card rounded-xl p-1 text-inherit">
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
          }
        />

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
    </PageLayout>
  );
};

export default StockReport;
