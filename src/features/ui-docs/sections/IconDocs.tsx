import React from 'react';
import {
  Archive,
  Bell,
  CircleArrowDown,
  CircleArrowUp,
  ClipboardCheck,
  LayoutDashboard,
  Loader2,
  Pencil,
  Pill,
  Plus,
  Search,
  Trash2,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import { DocExample, DocSection } from '../components/DocSection';

// Ikon yang paling sering dipakai di aplikasi, sebagai contekan cepat.
const COMMON_ICONS: { name: string; icon: LucideIcon; usage: string }[] = [
  { name: 'LayoutDashboard', icon: LayoutDashboard, usage: 'Dashboard' },
  { name: 'Archive', icon: Archive, usage: 'Produk / stok' },
  { name: 'Pill', icon: Pill, usage: 'Obat' },
  { name: 'CircleArrowDown', icon: CircleArrowDown, usage: 'Stok masuk' },
  { name: 'CircleArrowUp', icon: CircleArrowUp, usage: 'Stok keluar' },
  { name: 'ClipboardCheck', icon: ClipboardCheck, usage: 'Opname' },
  { name: 'Bell', icon: Bell, usage: 'Notifikasi' },
  { name: 'Plus', icon: Plus, usage: 'Tambah' },
  { name: 'Pencil', icon: Pencil, usage: 'Edit' },
  { name: 'Trash2', icon: Trash2, usage: 'Hapus' },
  { name: 'Search', icon: Search, usage: 'Cari' },
  { name: 'TriangleAlert', icon: TriangleAlert, usage: 'Peringatan' },
];

export const IconDocs: React.FC = () => (
  <DocSection
    id="icons"
    title="Ikon (lucide-react)"
    description="Semua ikon memakai lucide-react. Import komponennya langsung; ukuran pakai size-*, warna pakai text-*. Ikon dekoratif diberi aria-hidden. Padanan ikon lama (Material) ada di .ai/conventions/icons.md."
    importPath="import { Archive } from 'lucide-react';"
  >
    <DocExample
      title="Ikon yang sering dipakai"
      code={`
<Archive className="size-5 text-primary" aria-hidden />
<Loader2 className="size-5 animate-spin" aria-hidden />  // spinner`}
    >
      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {COMMON_ICONS.map(({ name, icon: Icon, usage }) => (
          <div key={name} className="flex items-center gap-3 rounded-xl border p-3">
            <Icon className="size-5 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0">
              <p className="truncate font-mono text-xs text-foreground">{name}</p>
              <p className="text-xs text-muted-foreground">{usage}</p>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-3 rounded-xl border p-3">
          <Loader2 className="size-5 shrink-0 animate-spin text-primary" aria-hidden />
          <div>
            <p className="font-mono text-xs text-foreground">Loader2</p>
            <p className="text-xs text-muted-foreground">Spinner</p>
          </div>
        </div>
      </div>
    </DocExample>
  </DocSection>
);
