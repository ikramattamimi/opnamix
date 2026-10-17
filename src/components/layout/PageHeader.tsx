import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  // Tombol atau kontrol di sisi kanan (turun ke bawah judul di layar kecil)
  actions?: React.ReactNode;
  // Elemen di kiri judul, misalnya tombol kembali
  leading?: React.ReactNode;
  className?: string;
}

// Judul bagian di dalam halaman (h2, karena h1 ada di Header).
const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  leading,
  className,
}) => (
  <div
    className={cn('flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}
  >
    <div className="flex min-w-0 items-center gap-3">
      {leading}
      <div className="min-w-0">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export default PageHeader;
