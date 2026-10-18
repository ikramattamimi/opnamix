import React from 'react';
import { CircleAlert, Inbox, Loader2, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToneIcon } from '@/components/data/ToneIcon';
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
      fullScreen && 'min-h-screen bg-background',
      className,
    )}
  >
    <Loader2
      className={cn('animate-spin text-primary', fullScreen ? 'size-12' : 'size-8')}
      aria-hidden
    />
    <p className="text-sm text-muted-foreground">{label}</p>
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
    className={cn(
      'flex flex-col items-center justify-center gap-1.5 px-3 py-7 text-center text-meta text-muted-foreground',
      className,
    )}
  >
    <ToneIcon icon={Icon} tone="primary" size="xl" className="mb-0.5" />
    <p className="font-semibold text-foreground">{title}</p>
    {description && <p className="max-w-sm">{description}</p>}
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
    className={cn(
      'flex flex-col items-center justify-center gap-1.5 px-3 py-7 text-center text-meta text-muted-foreground',
      className,
    )}
  >
    <ToneIcon icon={CircleAlert} tone="bad" size="xl" className="mb-0.5" />
    <p className="font-semibold text-foreground">{title}</p>
    <p className="max-w-sm">{message}</p>
    {onRetry && (
      <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
        Coba lagi
      </Button>
    )}
  </div>
);
