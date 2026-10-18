import React from 'react';
import { cn } from '@/lib/utils';

// Titik + garis + waktu untuk riwayat dan aktivitas
export interface TimelineItem {
  id: string | number;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  tone?: 'ok' | 'warn' | 'bad' | 'neutral';
}

const DOT: Record<NonNullable<TimelineItem['tone']>, string> = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  bad: 'bg-bad',
  neutral: 'bg-faint',
};

export const Timeline: React.FC<{ items: TimelineItem[] }> = ({ items }) => (
  <ol className="flex flex-col pl-1">
    {items.map((item, index) => (
      <li
        key={item.id}
        className="relative grid grid-cols-[0.875rem_1fr] gap-2.5 pb-3 text-note last:pb-0"
      >
        {index < items.length - 1 && (
          <span className="absolute bottom-0 left-1.5 top-3.5 w-0.5 bg-border" aria-hidden />
        )}
        <span
          className={cn(
            'mt-0.5 size-3.5 rounded-full border-[3px] border-card ring-1 ring-border-strong',
            DOT[item.tone ?? 'ok'],
          )}
          aria-hidden
        />
        <div className="min-w-0">
          <div>{item.title}</div>
          {item.subtitle && <small className="block text-muted-foreground">{item.subtitle}</small>}
        </div>
      </li>
    ))}
  </ol>
);
