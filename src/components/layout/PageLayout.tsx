import React from 'react';
import { cn } from '@/lib/utils';

export type PageMaxWidth = 'full' | 'narrow';

interface PageLayoutProps {
  children: React.ReactNode;
  // full = selebar area konten, narrow = max-w-3xl di tengah (form/halaman baca)
  maxWidth?: PageMaxWidth;
  className?: string;
}

// Pembungkus isi halaman: lebar dan jarak antar-bagian yang sama di semua halaman.
// Judul h1 sudah ada di Header; judul di dalam halaman memakai PageHeader.
const PageLayout: React.FC<PageLayoutProps> = ({ children, maxWidth = 'full', className }) => (
  <div className={cn('w-full space-y-6', maxWidth === 'narrow' && 'mx-auto max-w-3xl', className)}>
    {children}
  </div>
);

export default PageLayout;
