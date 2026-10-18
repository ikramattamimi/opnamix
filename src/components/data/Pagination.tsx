import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { pageItems, pageRange } from './pageMath';

// "Menampilkan a–b dari n", nomor halaman dengan elipsis, dan catatan opsional
// (mis. ukuran halaman mengikuti lebar layar).

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  note?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

const BTN =
  'grid h-7 min-w-7 place-items-center rounded-lg px-1.5 text-note tabular-nums text-muted-foreground transition-colors hover:enabled:bg-surface-2 hover:enabled:text-foreground disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4';

export const Pagination: React.FC<PaginationProps> = ({
  page,
  pageSize,
  total,
  onPageChange,
  note,
  disabled,
  className,
}) => {
  const { pages, current, from, to } = pageRange(page, pageSize, total);
  return (
    <nav
      aria-label="Halaman"
      className={cn(
        'flex flex-wrap items-center justify-between gap-2.5 border-t pt-2.5 text-note text-muted-foreground',
        className,
      )}
    >
      <div>
        Menampilkan{' '}
        <b className="tabular-nums text-foreground">
          {from}–{to}
        </b>{' '}
        dari <b className="tabular-nums text-foreground">{total.toLocaleString('id-ID')}</b>
        {note && <span className="text-xs text-muted-foreground"> · {note}</span>}
      </div>
      {pages > 1 && (
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className={BTN}
            disabled={disabled || current <= 1}
            onClick={() => onPageChange(current - 1)}
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft aria-hidden />
          </button>
          {pageItems(current, pages).map((item, index) =>
            item === 'gap' ? (
              <span key={`gap-${index}`} className="w-5 text-center text-faint" aria-hidden>
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                disabled={disabled}
                aria-current={item === current ? 'page' : undefined}
                onClick={() => onPageChange(item)}
                className={cn(
                  BTN,
                  item === current &&
                    'bg-primary font-semibold text-primary-foreground hover:enabled:bg-primary hover:enabled:text-primary-foreground',
                )}
              >
                {item}
              </button>
            ),
          )}
          <button
            type="button"
            className={BTN}
            disabled={disabled || current >= pages}
            onClick={() => onPageChange(current + 1)}
            aria-label="Halaman berikutnya"
          >
            <ChevronRight aria-hidden />
          </button>
        </div>
      )}
    </nav>
  );
};
