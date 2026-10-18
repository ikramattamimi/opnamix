import React from 'react';
import { CircleAlert, Info, TriangleAlert, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Kotak info/peringatan kecil di dalam panel atau form
type InfoTone = 'info' | 'warn' | 'bad';

const TONES: Record<InfoTone, { className: string; icon: LucideIcon }> = {
  info: { className: 'bg-info-soft text-info', icon: Info },
  warn: { className: 'bg-warn-soft text-warn', icon: TriangleAlert },
  bad: { className: 'bg-bad-soft text-bad', icon: CircleAlert },
};

export const InfoBox: React.FC<{
  tone?: InfoTone;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}> = ({ tone = 'info', icon, children, className }) => {
  const Icon = icon ?? TONES[tone].icon;
  return (
    <div
      role={tone === 'info' ? 'note' : 'alert'}
      className={cn(
        'flex gap-2 rounded-xl px-2.5 py-2 text-note leading-relaxed',
        TONES[tone].className,
        className,
      )}
    >
      <Icon className="mt-px size-4 shrink-0" aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
};
