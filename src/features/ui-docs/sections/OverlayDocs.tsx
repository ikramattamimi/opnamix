import React, { useState } from 'react';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { DocExample, DocSection } from '../components/DocSection';

export const DialogDocs: React.FC = () => {
  const [confirmType, setConfirmType] = useState<'danger' | 'warn' | 'primary'>();
  const { showToast } = useToast();

  return (
    <DocSection
      id="dialog"
      title="Dialog dan ConfirmDialog"
      description="Dialog untuk form atau detail di atas halaman. ConfirmDialog untuk konfirmasi kecil di tengah layar (dibangun di atas AlertDialog), nada danger, warn, atau primary. Konfirmasi di dalam panel kanan memakai InlineConfirm."
      importPath="import { Dialog, DialogContent, ... } from '@/components/ui/dialog'; import { ConfirmDialog } from '@/components/common/ConfirmDialog';"
    >
      <DocExample
        title="Dialog"
        code={`
<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild><Button>Lihat Detail</Button></DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Detail Transaksi</DialogTitle>
      <DialogDescription>OUT-20261017-000123</DialogDescription>
    </DialogHeader>
    ...isi...
    <DialogFooter><Button onClick={() => setOpen(false)}>Tutup</Button></DialogFooter>
  </DialogContent>
</Dialog>`}
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Lihat Detail</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detail Transaksi</DialogTitle>
              <DialogDescription>OUT-20261017-000123</DialogDescription>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Isi dialog: ringkasan item, jasa, dan total.
            </p>
            <DialogFooter>
              <DialogTrigger asChild>
                <Button>Tutup</Button>
              </DialogTrigger>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DocExample>

      <DocExample
        title="ConfirmDialog"
        note="Pakai tone danger untuk aksi yang tidak bisa dibatalkan (hapus). Selama busy, dialog tidak bisa ditutup."
        code={`
<ConfirmDialog
  open={!!toDelete}
  tone="danger"
  title="Hapus produk?"
  message="Produk yang dihapus tidak bisa dipakai di transaksi baru."
  confirmLabel="Ya, hapus"
  busy={deleteProduct.isPending}
  onConfirm={handleDelete}
  onCancel={() => setToDelete(null)}
/>`}
      >
        {(['danger', 'warn', 'primary'] as const).map((type) => (
          <Button key={type} variant="outline" size="sm" onClick={() => setConfirmType(type)}>
            {type}
          </Button>
        ))}
        <ConfirmDialog
          open={confirmType !== undefined}
          tone={confirmType}
          title="Contoh konfirmasi"
          message={`Ini ConfirmDialog dengan tone "${confirmType}".`}
          confirmLabel="Lanjutkan"
          onConfirm={() => {
            showToast('Dikonfirmasi', 'success');
            setConfirmType(undefined);
          }}
          onCancel={() => setConfirmType(undefined)}
        />
      </DocExample>
    </DocSection>
  );
};
