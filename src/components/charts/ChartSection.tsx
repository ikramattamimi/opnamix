import React, { useId } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { usePersistentState } from '@/hooks/usePersistentState';
import { cn } from '@/lib/utils';

// Panel grafik yang bisa diciutkan. Status buka/ciut disimpan per perangkat
// dengan `storageKey`. Saat ciut, `summary` tampil di samping judul.

interface ChartSectionProps {
  title: string;
  storageKey: string;
  /** Ringkasan satu baris saat panel diciutkan */
  summary?: React.ReactNode;
  /** Kontrol di kanan judul (mis. DateRangeControl), hanya saat terbuka */
  controls?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const ChartSection: React.FC<ChartSectionProps> = ({
  title,
  storageKey,
  summary,
  controls,
  children,
  className,
}) => {
  const [open, setOpen] = usePersistentState(`opnamix.chart.${storageKey}`, true);
  const bodyId = useId();
  return (
    <Card className={cn('flex flex-col gap-3 p-3.5', className)}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="text-panel font-bold">{title}</h2>
        {!open && summary && (
          <span className="min-w-0 text-meta text-muted-foreground">{summary}</span>
        )}
        <span className="flex-1" />
        {open && controls}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls={bodyId}
          aria-label={open ? `Ciutkan ${title.toLowerCase()}` : `Buka ${title.toLowerCase()}`}
          className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4"
        >
          {open ? <ChevronUp aria-hidden /> : <ChevronDown aria-hidden />}
        </button>
      </div>
      {open && (
        <div id={bodyId} className="flex flex-col gap-3">
          {children}
        </div>
      )}
    </Card>
  );
};

// Kotak kecil berjudul di dalam ChartSection (grafik, daftar teratas, komposisi)
export const ChartPanel: React.FC<{
  title: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ title, aside, children, className }) => (
  <div className={cn('flex min-w-0 flex-col gap-2 rounded-xl border p-3', className)}>
    <h3 className="flex flex-wrap items-center justify-between gap-2 text-meta font-semibold">
      <span>{title}</span>
      {aside && <span className="font-normal">{aside}</span>}
    </h3>
    {children}
  </div>
);
