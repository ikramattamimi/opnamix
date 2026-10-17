import React from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DocExample, DocSection } from '../components/DocSection';

export const ButtonDocs: React.FC = () => (
  <DocSection
    id="button"
    title="Button"
    description="Tombol untuk semua aksi. Pakai variant untuk tingkat penekanan dan size untuk ukuran. Ikon lucide di dalam tombol otomatis berukuran 16px."
    importPath="import { Button } from '@/components/ui/button';"
  >
    <DocExample
      title="Variant"
      note="default untuk aksi utama (satu per area), outline/secondary untuk aksi pendamping, destructive untuk hapus."
      code={`
<Button>Simpan</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Batal</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Hapus</Button>
<Button variant="link">Lihat detail</Button>`}
    >
      <Button>Simpan</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Batal</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Hapus</Button>
      <Button variant="link">Lihat detail</Button>
    </DocExample>

    <DocExample
      title="Ukuran"
      note="Tinggi tetap: sm 32px, default 40px (sama dengan Input dan Select), lg 44px; icon 40x40, icon-sm 32x32, icon-lg 44x44. Jangan menimpa tinggi dengan h-auto/py-* atau radius dengan rounded-*."
      code={`
<Button size="sm">Kecil</Button>
<Button>Default</Button>
<Button size="lg">Besar</Button>
<Button size="icon-sm" aria-label="Tambah"><Plus /></Button>
<Button size="icon" aria-label="Tambah"><Plus /></Button>
<Button size="icon-lg" aria-label="Tambah"><Plus /></Button>`}
    >
      <Button size="sm">Kecil</Button>
      <Button>Default</Button>
      <Button size="lg">Besar</Button>
      <Button size="icon-sm" aria-label="Tambah">
        <Plus aria-hidden />
      </Button>
      <Button size="icon" aria-label="Tambah">
        <Plus aria-hidden />
      </Button>
      <Button size="icon-lg" aria-label="Tambah">
        <Plus aria-hidden />
      </Button>
    </DocExample>

    <DocExample
      title="Dengan ikon dan status memuat"
      note="Tombol yang hanya berisi ikon wajib punya aria-label. Saat menyimpan, nonaktifkan tombol dan ganti ikonnya dengan Loader2."
      code={`
<Button><Plus /> Tambah Produk</Button>
<Button variant="destructive"><Trash2 /> Hapus</Button>
<Button disabled={isPending}>
  {isPending && <Loader2 className="animate-spin" />}
  {isPending ? 'Menyimpan...' : 'Simpan'}
</Button>`}
    >
      <Button>
        <Plus aria-hidden /> Tambah Produk
      </Button>
      <Button variant="destructive">
        <Trash2 aria-hidden /> Hapus
      </Button>
      <Button disabled>
        <Loader2 className="animate-spin" aria-hidden /> Menyimpan...
      </Button>
    </DocExample>
  </DocSection>
);

export const BadgeDocs: React.FC = () => (
  <DocSection
    id="badge"
    title="Badge"
    description="Label kecil untuk status atau kategori, misalnya status transaksi atau role user."
    importPath="import { Badge } from '@/components/ui/badge';"
  >
    <DocExample
      title="Variant"
      code={`
<Badge>Selesai</Badge>
<Badge variant="secondary">Draft</Badge>
<Badge variant="destructive">Stok Habis</Badge>
<Badge variant="outline">Obat</Badge>`}
    >
      <Badge>Selesai</Badge>
      <Badge variant="secondary">Draft</Badge>
      <Badge variant="destructive">Stok Habis</Badge>
      <Badge variant="outline">Obat</Badge>
    </DocExample>
  </DocSection>
);
