import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CATEGORY_TONE_CLASS, type CategoryTone } from './categoryTone';

// Ikon kategori kecil (20px) berwarna token kategori
export const CategoryIcon: React.FC<{
  icon: LucideIcon;
  tone: CategoryTone;
  label?: string;
  className?: string;
}> = ({ icon: Icon, tone, label, className }) => (
  <span
    className={cn(
      'inline-grid size-5 shrink-0 place-items-center rounded-md',
      CATEGORY_TONE_CLASS[tone],
      className,
    )}
    role={label ? 'img' : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : true}
  >
    <Icon className="size-3" aria-hidden />
  </span>
);
