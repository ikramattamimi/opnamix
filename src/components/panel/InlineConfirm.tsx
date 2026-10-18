import React from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Konfirmasi di dalam panel, menggantikan tombol aksi di kaki panel
// ("Proses & kurangi stok" → "Ya, proses"). Pakai sebagai isi `footer` SidePanel.

interface InlineConfirmProps {
  message: React.ReactNode;
  confirmLabel: string;
  confirmIcon?: LucideIcon;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
  /** `danger` untuk aksi hapus/batal */
  tone?: 'primary' | 'danger';
  className?: string;
}

export const InlineConfirm: React.FC<InlineConfirmProps> = ({
  message,
  confirmLabel,
  confirmIcon: Icon,
  cancelLabel = 'Batal',
  onConfirm,
  onCancel,
  busy,
  tone = 'primary',
  className,
}) => (
  <div role="alert" className={cn('flex w-full flex-col gap-2', className)}>
    <p className="text-note text-muted-foreground">{message}</p>
    <div className="flex justify-end gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">
      <Button variant="ghost" onClick={onCancel} disabled={busy}>
        {cancelLabel}
      </Button>
      <Button
        variant={tone === 'danger' ? 'destructive' : 'default'}
        onClick={onConfirm}
        disabled={busy}
        autoFocus
      >
        {busy ? <Loader2 className="animate-spin" aria-hidden /> : Icon && <Icon aria-hidden />}
        {confirmLabel}
      </Button>
    </div>
  </div>
);
