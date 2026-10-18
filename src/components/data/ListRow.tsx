import React from 'react';
import { cn } from '@/lib/utils';
import type { ListGroup } from './listGroups';

// Baris daftar: lead (avatar/ikon), judul + sub, kolom tengah, nilai, status.
// Di HP kolom tengah disembunyikan dan nilai/status bertumpuk di kanan.

export interface ListRowProps {
  lead?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  middle?: React.ReactNode;
  middleSub?: React.ReactNode;
  value?: React.ReactNode;
  status?: React.ReactNode;
  selected?: boolean;
  unread?: boolean;
  onClick?: () => void;
  className?: string;
}

export const ListRow: React.FC<ListRowProps> = ({
  lead,
  title,
  subtitle,
  middle,
  middleSub,
  value,
  status,
  selected,
  unread,
  onClick,
  className,
}) => {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      aria-current={selected ? 'true' : undefined}
      className={cn(
        'grid w-full grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 rounded-xl border border-transparent px-2.5 py-2 text-left',
        'md:grid-cols-[2rem_minmax(0,1.25fr)_minmax(0,1.2fr)_7rem_6rem]',
        onClick &&
          'transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected && 'border-primary/35 bg-primary-soft hover:bg-primary-soft',
        unread && !selected && 'bg-primary/5',
        className,
      )}
    >
      <span className="row-span-2 md:row-span-1">{lead}</span>
      <span className="row-span-2 flex min-w-0 flex-col md:row-span-1">
        <b className={cn('truncate text-label', unread ? 'font-bold' : 'font-semibold')}>{title}</b>
        {subtitle && <small className="truncate text-xs text-muted-foreground">{subtitle}</small>}
      </span>
      <span className="hidden min-w-0 flex-col md:flex">
        {middle && <span className="truncate text-meta">{middle}</span>}
        {middleSub && <small className="truncate text-xs text-muted-foreground">{middleSub}</small>}
      </span>
      <span className="col-start-3 row-start-1 whitespace-nowrap text-right text-meta font-bold tabular-nums md:col-start-auto md:row-start-auto">
        {value}
      </span>
      <span className="col-start-3 row-start-2 -mt-0.5 flex justify-end md:col-start-auto md:row-start-auto md:mt-0">
        {status}
      </span>
    </Comp>
  );
};

// Judul grup (per hari/bulan) + baris-barisnya
export function GroupedList<T>({
  groups,
  renderItem,
  getKey,
}: {
  groups: ListGroup<T>[];
  renderItem: (item: T) => React.ReactNode;
  getKey: (item: T) => string | number;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {groups.map((group, index) => (
        <section
          key={group.key}
          aria-label={typeof group.label === 'string' ? group.label : undefined}
        >
          <h4
            className={cn(
              'px-2.5 pb-1 text-2xs font-semibold uppercase tracking-wider text-muted-foreground',
              index === 0 ? 'pt-0' : 'pt-2.5',
            )}
          >
            {group.label}
          </h4>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item) => (
              <React.Fragment key={getKey(item)}>{renderItem(item)}</React.Fragment>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
