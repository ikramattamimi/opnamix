import React, { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import ConfirmationModal from '@/components/common/ConfirmationModal';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/toast';
import { DocExample, DocSection } from '../components/DocSection';

export const DialogDocs: React.FC = () => {
  const [confirmType, setConfirmType] = useState<'danger' | 'warning' | 'info' | 'success'>();
  const { showToast } = useToast();

  return (
    <DocSection
      id="dialog"
      title="Dialog dan ConfirmationModal"
      description="Dialog untuk form atau detail di atas halaman. ConfirmationModal untuk konfirmasi aksi (dibangun di atas AlertDialog), dengan tipe danger, warning, info, atau success."
      importPath="import { Dialog, DialogContent, ... } from '@/components/ui/dialog'; import ConfirmationModal from '@/components/common/ConfirmationModal';"
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
        title="ConfirmationModal"
        note="Pakai type danger untuk aksi yang tidak bisa dibatalkan (hapus)."
        code={`
<ConfirmationModal
  isOpen={isOpen}
  type="danger"
  title="Hapus produk?"
  message="Produk yang dihapus tidak bisa dipakai di transaksi baru."
  confirmText="Hapus"
  onConfirm={handleDelete}
  onCancel={() => setIsOpen(false)}
/>`}
      >
        {(['danger', 'warning', 'info', 'success'] as const).map((type) => (
          <Button key={type} variant="outline" size="sm" onClick={() => setConfirmType(type)}>
            {type}
          </Button>
        ))}
        <ConfirmationModal
          isOpen={confirmType !== undefined}
          type={confirmType}
          title="Contoh konfirmasi"
          message={`Ini ConfirmationModal dengan type "${confirmType}".`}
          confirmText="Lanjutkan"
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

export const DropdownDocs: React.FC = () => (
  <DocSection
    id="dropdown"
    title="Dropdown Menu"
    description="Menu aksi per baris tabel atau menu akun. Aksi berbahaya diletakkan terakhir, dipisah separator."
    importPath="import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';"
  >
    <DocExample
      title="Menu aksi baris"
      code={`
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" aria-label="Aksi"><MoreHorizontal /></Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuLabel>Aksi</DropdownMenuLabel>
    <DropdownMenuItem onSelect={onEdit}><Pencil /> Edit</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-red-600" onSelect={onDelete}><Trash2 /> Hapus</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Aksi">
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Aksi</DropdownMenuLabel>
          <DropdownMenuItem>
            <Pencil className="size-4" aria-hidden /> Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600">
            <Trash2 className="size-4" aria-hidden /> Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </DocExample>
  </DocSection>
);
