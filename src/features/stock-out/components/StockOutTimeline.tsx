import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRecentStockOuts } from '../useStockOut';

const TIMELINE_LIMIT = 10;

// Riwayat pengeluaran terbaru di bawah tabel.
// Ter-update otomatis lewat invalidasi stockOutKeys.all (realtime dan mutasi).
const StockOutTimeline: React.FC = () => {
  const { data: timelineData = [], refetch } = useRecentStockOuts(TIMELINE_LIMIT);
  const [showTimeline, setShowTimeline] = useState(true);

  return (
    <div className="bg-card-light dark:bg-card-dark rounded-[20px] shadow-soft p-6 mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h3 className="font-bold text-xl text-text-primary-light dark:text-white">
          Riwayat Pengeluaran
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5"
            onClick={() => setShowTimeline((prev) => !prev)}
          >
            <span className="material-icons-round text-sm">
              {showTimeline ? 'visibility_off' : 'visibility'}
            </span>
            {showTimeline ? 'Sembunyikan' : 'Tampilkan'}
          </Button>
          <button
            onClick={() => void refetch()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-primary"
            title="Refresh Timeline"
          >
            <span className="material-icons-round text-sm">refresh</span>
          </button>
        </div>
      </div>

      {showTimeline && (
        <div className="relative pl-2 border-l-2 border-gray-100 dark:border-gray-700 space-y-8 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {timelineData.length > 0 ? (
            timelineData.map((item, i) => (
              <TimelineItem
                key={i}
                title={item.title}
                desc={<span className="text-text-primary-light dark:text-white">{item.desc}</span>}
                time={item.time}
                dotColor={item.dotColor}
              />
            ))
          ) : (
            <div className="text-center py-10 text-text-secondary-light">
              <p>Belum ada riwayat pengeluaran.</p>
            </div>
          )}
        </div>
      )}
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
      className={`absolute -left-[9px] top-0.5 size-4 ${dotColor} rounded-full border-[3px] border-white dark:border-card-dark shadow-sm`}
    ></div>
    <div className="flex flex-col gap-0.5">
      <p className="text-sm font-bold text-text-primary-light dark:text-white leading-tight">
        {title}
      </p>
      <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
        {desc}
      </div>
      <div className="flex items-center gap-1 mt-1">
        <span className="material-icons-round text-[10px] text-text-secondary-light">schedule</span>
        <p className="text-[10px] text-text-secondary-light font-medium uppercase tracking-wider">
          {time}
        </p>
      </div>
    </div>
  </div>
);

export default StockOutTimeline;
