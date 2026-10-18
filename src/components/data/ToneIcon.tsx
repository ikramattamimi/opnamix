import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Ikon di dalam kotak berwarna lembut. Dipakai di baris daftar, notifikasi,
// kepala panel, dan keadaan kosong. Warna hanya dari token.

const toneIconVariants = cva('grid shrink-0 place-items-center', {
  variants: {
    tone: {
      primary: 'bg-primary-soft text-primary',
      ok: 'bg-ok-soft text-ok',
      warn: 'bg-warn-soft text-warn',
      bad: 'bg-bad-soft text-bad',
      info: 'bg-info-soft text-info',
      neutral: 'bg-surface-2 text-muted-foreground',
      obat: 'bg-cat-obat/15 text-cat-obat',
      bhp: 'bg-cat-bhp/15 text-cat-bhp',
      imun: 'bg-cat-imun/15 text-cat-imun',
      alkes: 'bg-cat-alkes/15 text-cat-alkes',
    },
    size: {
      sm: 'size-6.5 rounded-md [&_svg]:size-3.5',
      md: 'size-8 rounded-lg [&_svg]:size-4',
      lg: 'size-9 rounded-xl [&_svg]:size-4.5',
      xl: 'size-10 rounded-xl [&_svg]:size-5',
    },
  },
  defaultVariants: { tone: 'primary', size: 'md' },
});

export type Tone = NonNullable<VariantProps<typeof toneIconVariants>['tone']>;

export interface ToneIconProps extends VariantProps<typeof toneIconVariants> {
  icon: LucideIcon;
  className?: string;
}

export const ToneIcon: React.FC<ToneIconProps> = ({ icon: Icon, tone, size, className }) => (
  <span className={cn(toneIconVariants({ tone, size }), className)} aria-hidden>
    <Icon />
  </span>
);
