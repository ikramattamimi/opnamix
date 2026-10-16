import React from 'react';
import { CircleAlert, Inbox, Loader2, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Tampilan bersama untuk status data: memuat, kosong, dan gagal.
// Dipakai di halaman dan tabel supaya semua status terlihat sama.

interface LoadingStateProps {
  label?: string;
  // fullScreen untuk layar awal aplikasi; default mengisi area konten
  fullScreen?: boolean;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  label = 'Memuat...',
  fullScreen = false,
  className,
}) => (
  <div
    role="status"
    className={cn(
      'flex flex-col items-center justify-center gap-3 py-12 text-center',
      fullScreen && 'min-h-screen bg-background-light dark:bg-background-dark',
      className,
    )}
  >
    <Loader2
      className={cn('animate-spin text-primary', fullScreen ? 'size-12' : 'size-8')}
      aria-hidden
    />
    <p className="text-sm text-text-secondary-light">{label}</p>
  </div>
);

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}) => (
  <div
    className={cn('flex flex-col items-center justify-center gap-2 py-12 text-center', className)}
  >
    <Icon className="size-10 text-gray-300 dark:text-gray-600" aria-hidden />
    <p className="font-medium text-text-primary-light dark:text-text-primary-dark">{title}</p>
    {description && <p className="max-w-sm text-sm text-text-secondary-light">{description}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

interface ErrorStateProps {
  title?: string;
  // Pesan dari error query; kalau kosong pakai pesan umum
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Gagal memuat data',
  message = 'Periksa koneksi internet lalu coba lagi.',
  onRetry,
  className,
}) => (
  <div
    role="alert"
    className={cn('flex flex-col items-center justify-center gap-2 py-12 text-center', className)}
  >
    <CircleAlert className="size-10 text-red-500" aria-hidden />
    <p className="font-medium text-text-primary-light dark:text-text-primary-dark">{title}</p>
    <p className="max-w-sm text-sm text-text-secondary-light">{message}</p>
    {onRetry && (
      <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
        Coba lagi
      </Button>
    )}
  </div>
);
