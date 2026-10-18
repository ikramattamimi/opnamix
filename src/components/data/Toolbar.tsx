import React from 'react';
import { cn } from '@/lib/utils';

// Wadah baris pencarian dan filter di atas daftar. Spacer mendorong isi ke kanan.
export const Toolbar: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <div className={cn('flex flex-wrap items-center gap-2', className)}>{children}</div>;

export const ToolbarSpacer: React.FC = () => <span className="flex-1" aria-hidden />;
