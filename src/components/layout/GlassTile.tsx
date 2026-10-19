import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Baris kaca di dalam PageHeader: ikon, judul + keterangan, progres opsional,
// dan aksi di kanan (Button variant "light"). Dipakai untuk opname yang sedang
// berjalan dan pintasan dashboard.

interface GlassTileProps {
  icon: LucideIcon;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  progress?: { label: string; value: number; max: number };
  action?: React.ReactNode;
  className?: string;
}

export const GlassTile: React.FC<GlassTileProps> = ({
  icon: Icon,
  title,
  subtitle,
  progress,
  action,
  className,
}) => (
  <div
    className={cn(
      'grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 rounded-xl border border-glass-line bg-glass px-3 py-2.5 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto]',
      className,
    )}
  >
    <span className="grid size-8 place-items-center rounded-lg bg-glass-2 text-on-grad [&_svg]:size-4">
      <Icon aria-hidden />
    </span>
    <span className="flex min-w-0 flex-col">
      <b className="truncate text-label font-semibold text-on-grad">{title}</b>
      {subtitle && <small className="truncate text-xs text-on-grad-2">{subtitle}</small>}
    </span>
    {progress && (
      <span className="col-span-2 flex min-w-0 flex-col gap-1 sm:col-span-1 sm:w-40">
        <span className="flex justify-between text-xs text-on-grad-2">
          <span>{progress.label}</span>
          <b className="tabular-nums text-on-grad">
            {progress.value} / {progress.max}
          </b>
        </span>
        <span
          role="progressbar"
          aria-label={progress.label}
          aria-valuenow={progress.value}
          aria-valuemin={0}
          aria-valuemax={progress.max}
          className="h-1.5 overflow-hidden rounded-full bg-glass-shade"
        >
          <span
            className="block h-full rounded-full bg-on-grad"
            style={{ width: `${progress.max ? (progress.value / progress.max) * 100 : 0}%` }}
          />
        </span>
      </span>
    )}
    {action && <span className="col-span-2 flex sm:col-span-1 [&>*]:flex-1">{action}</span>}
  </div>
);
