import React from 'react';
import { CircleAlert, Info, Loader2, TriangleAlert } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ToneIcon } from '@/components/data/ToneIcon';

// Konfirmasi kecil di tengah layar (hapus, batalkan). Untuk konfirmasi di
// dalam panel kanan pakai InlineConfirm. Tombol konfirmasi tidak menutup
// dialog sendiri: pemanggil menutupnya setelah proses selesai.

type ConfirmTone = 'danger' | 'warn' | 'primary';

const TONES = {
  danger: { icon: TriangleAlert, tone: 'bad', variant: 'destructive' },
  warn: { icon: CircleAlert, tone: 'warn', variant: 'default' },
  primary: { icon: Info, tone: 'primary', variant: 'default' },
} as const;

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Ya',
  cancelLabel = 'Batal',
  tone = 'primary',
  busy,
  onConfirm,
  onCancel,
}) => {
  const t = TONES[tone];
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && !busy && onCancel()}>
      <AlertDialogContent className="max-w-sm gap-3">
        <div className="flex items-start gap-3">
          <ToneIcon icon={t.icon} tone={t.tone} size="xl" />
          <div className="flex min-w-0 flex-col gap-1">
            <AlertDialogTitle className="text-panel font-bold">{title}</AlertDialogTitle>
            <AlertDialogDescription className="text-meta text-muted-foreground">
              {message}
            </AlertDialogDescription>
          </div>
        </div>
        <div className="flex justify-end gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={t.variant} onClick={onConfirm} disabled={busy} autoFocus>
            {busy && <Loader2 className="animate-spin" aria-hidden />}
            {confirmLabel}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
