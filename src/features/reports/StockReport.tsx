import React, { useCallback, useState } from 'react';
import { Clock, Download } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { SegmentedControl } from '@/components/data/SegmentedControl';
import { DateRangeControl } from '@/components/form/DateRangeControl';
import { Button } from '@/components/ui/button';
import { useDateRange } from '@/hooks/useDateRange';
import { usePersistentState } from '@/hooks/usePersistentState';
import { formatDateTimeForDisplay } from '@/lib/format';
import { PositionReport } from './components/PositionReport';
import { MutationReport } from './components/MutationReport';
import { TransactionReport } from './components/TransactionReport';

type ReportTab = 'posisi' | 'mutasi' | 'transaksi';

const TABS: { value: ReportTab; label: string }[] = [
  { value: 'posisi', label: 'Posisi stok' },
  { value: 'mutasi', label: 'Mutasi stok' },
  { value: 'transaksi', label: 'Transaksi keluar' },
];

const isTab = (v: unknown): v is ReportTab => v === 'posisi' || v === 'mutasi' || v === 'transaksi';

// Laporan Stok: pilihan laporan dan periode di header; tiap laporan punya
// grafik yang bisa diciutkan, angka ringkas, dan tabel. Ekspor mengikuti
// filter laporan yang sedang tampil.
const StockReport: React.FC = () => {
  const [tab, setTab] = usePersistentState<ReportTab>('opnamix.report.tab', 'posisi', isTab);
  const range = useDateRange('30');
  const [exporter, setExporter] = useState<(() => void) | null>(null);
  // Fungsi disimpan sebagai nilai state, jadi dibungkus supaya tidak dipanggil oleh setState
  const registerExport = useCallback((fn: (() => void) | null) => setExporter(() => fn), []);

  return (
    <>
      <PageHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SegmentedControl<ReportTab>
            label="Jenis laporan"
            variant="glass"
            value={tab}
            onChange={setTab}
            options={TABS}
          />
          <div className="flex flex-wrap items-center gap-2">
            {tab === 'posisi' ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-on-grad-2">
                <Clock className="size-3.5" aria-hidden />
                Posisi per {formatDateTimeForDisplay(new Date().toISOString())}
              </span>
            ) : (
              <DateRangeControl
                state={range}
                variant="glass"
                presets={['today', '7', '30', 'month', 'custom']}
              />
            )}
            <Button variant="light" onClick={() => exporter?.()} disabled={!exporter}>
              <Download aria-hidden />
              Ekspor Excel
            </Button>
          </div>
        </div>
      </PageHeader>

      {tab === 'posisi' && <PositionReport registerExport={registerExport} />}
      {tab === 'mutasi' && <MutationReport range={range} registerExport={registerExport} />}
      {tab === 'transaksi' && <TransactionReport range={range} registerExport={registerExport} />}
    </>
  );
};

export default StockReport;
