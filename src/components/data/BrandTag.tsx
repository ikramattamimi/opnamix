import React from 'react';
import { cn } from '@/lib/utils';
import { CATEGORY_TONE_CLASS, type CategoryTone } from './categoryTone';

// Label merek berwarna kategori. Tanpa merek (generik) tampil netral bergaris.
export const BrandTag: React.FC<{
  children: React.ReactNode;
  tone?: CategoryTone;
  generic?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}> = ({ children, tone = 'obat', generic, size = 'md', className }) => (
  <span
    className={cn(
      'inline-flex max-w-full items-center truncate whitespace-nowrap rounded-md font-bold tracking-wide',
      size === 'md' ? 'h-5.5 px-2 text-note' : 'h-5 px-1.5 text-2xs',
      generic
        ? 'bg-surface-2 font-semibold text-muted-foreground ring-1 ring-inset ring-border'
        : CATEGORY_TONE_CLASS[tone],
      className,
    )}
  >
    {children}
  </span>
);
