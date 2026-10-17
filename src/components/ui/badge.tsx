import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
        outline: 'text-foreground',
        // Varian status: teks -700/-800 di latar -100 (light) dan -300 di tint 15% (dark), semua >= 4.5:1
        success:
          'border-transparent bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300',
        warning:
          'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
        danger: 'border-transparent bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
        info: 'border-transparent bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
        violet:
          'border-transparent bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
        neutral: 'border-transparent bg-muted text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
