import React, { useState } from 'react';
import { Clock, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/QueryState';
import { getErrorMessage } from '@/lib/utils';
import { useRecentStockOuts } from '../useStockOut';

const TIMELINE_LIMIT = 10;

// Riwayat pengeluaran terbaru di bawah tabel.
// Ter-update otomatis lewat invalidasi stockOutKeys.all (realtime dan mutasi).
const StockOutTimeline: React.FC = () => {
  const { data: timelineData = [], isLoading, error, refetch } = useRecentStockOuts(TIMELINE_LIMIT);
  const [showTimeline, setShowTimeline] = useState(true);

  const renderContent = () => {
    if (isLoading) return <LoadingState />;
    if (error)
      return <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />;
    if (timelineData.length === 0) return <EmptyState title="Belum ada riwayat pengeluaran." />;
    return (
      <div className="relative pl-2 border-l-2 border-gray-100 dark:border-gray-700 space-y-8 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {timelineData.map((item, i) => (
          <TimelineItem
            key={i}
            title={item.title}
            desc={<span className="text-foreground">{item.desc}</span>}
            time={item.time}
            dotColor={item.dotColor}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-card rounded-2xl shadow-soft p-6 mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h3 className="font-bold text-xl text-foreground">Riwayat Pengeluaran</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5"
            onClick={() => setShowTimeline((prev) => !prev)}
          >
            {showTimeline ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
            {showTimeline ? 'Sembunyikan' : 'Tampilkan'}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void refetch()}
            className="w-auto p-2 rounded-full text-primary hover:text-primary hover:bg-gray-100 dark:hover:bg-white/5"
            title="Refresh Timeline"
            aria-label="Refresh Timeline"
          >
            <RefreshCw aria-hidden />
          </Button>
        </div>
      </div>

      {showTimeline && renderContent()}
    </div>
  );
};

const TimelineItem: React.FC<{
  title: string;
  desc: React.ReactNode;
  time: string;
  dotColor: string;
}> = ({ title, desc, time, dotColor }) => (
  <div className="relative pl-6">
    <div
      className={`absolute -left-[9px] top-0.5 size-4 ${dotColor} rounded-full border-[3px] border-white dark:border-border shadow-sm`}
    ></div>
    <div className="flex flex-col gap-0.5">
      <p className="text-sm font-bold text-foreground leading-tight">{title}</p>
      <div className="text-xs text-muted-foreground leading-relaxed">{desc}</div>
      <div className="flex items-center gap-1 mt-1">
        <Clock className="size-2.5 text-muted-foreground" aria-hidden />
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
          {time}
        </p>
      </div>
    </div>
  </div>
);

export default StockOutTimeline;
