import React from 'react';
import { cn } from '@/lib/utils';

// Grid kartu dengan jumlah kolom dari useGridPageSize, supaya ukuran halaman
// (kolom × baris) selalu memenuhi baris terakhir.

interface ResponsiveGridProps {
  cols: number;
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveGrid = React.forwardRef<HTMLDivElement, ResponsiveGridProps>(
  ({ cols, children, className }, ref) => (
    <div
      ref={ref}
      className={cn('grid gap-2.5', className)}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {children}
    </div>
  ),
);
ResponsiveGrid.displayName = 'ResponsiveGrid';
