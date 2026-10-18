import React from 'react';
import { CircleCheck, Loader2, Plus, Trash2 } from 'lucide-react';
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
      note="default untuk aksi utama (satu per area), soft/outline/secondary untuk aksi pendamping, destructive untuk hapus."
      code={`
<Button>Simpan</Button>
<Button variant="soft">Soft</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Batal</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Hapus</Button>
<Button variant="link">Lihat detail</Button>`}
    >
      <Button>Simpan</Button>
      <Button variant="soft">Soft</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Batal</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Hapus</Button>
      <Button variant="link">Lihat detail</Button>
    </DocExample>

    <DocExample
      title="Di atas gradien"
      note="light untuk aksi utama di header, glass untuk aksi lain. glass dengan aria-pressed menjadi putih (dipakai tombol pin)."
      code={`
<Button variant="light"><Plus /> Tambah</Button>
<Button variant="glass">Ekspor</Button>`}
    >
      <div className="flex gap-2 rounded-xl bg-grad-hero p-4">
        <Button variant="light">
          <Plus aria-hidden /> Tambah
        </Button>
        <Button variant="glass">Ekspor</Button>
        <Button variant="glass" aria-pressed>
          Dipilih
        </Button>
      </div>
    </DocExample>

    <DocExample
      title="Ukuran"
      note="sm 28px (aksi di baris/panel), default 32px, lg 38px (aksi utama layar penuh, mis. POS). Semua dalam rem, jadi ikut membesar di mode Besar."
      code={`
<Button size="sm">Kecil · 28px</Button>
<Button>Default · 32px</Button>
<Button size="lg">Besar · 38px</Button>
<Button size="icon-sm" aria-label="Tambah"><Plus /></Button>
<Button size="icon" aria-label="Tambah"><Plus /></Button>`}
    >
      <Button size="sm">Kecil · 28px</Button>
      <Button>Default · 32px</Button>
      <Button size="lg">Besar · 38px</Button>
      <Button size="icon-sm" variant="outline" aria-label="Tambah">
        <Plus aria-hidden />
      </Button>
      <Button size="icon" variant="outline" aria-label="Tambah">
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
    description="Label kecil (tinggi 20px, teks 11px) untuk status atau kategori, misalnya status transaksi atau role user."
    importPath="import { Badge } from '@/components/ui/badge';"
  >
    <DocExample
      title="Status"
      note="Warna status dari token ok/warn/bad/info. Selalu tulis teksnya; warna saja tidak cukup untuk pengguna buta warna."
      code={`
<Badge variant="ok"><CircleCheck /> Selesai</Badge>
<Badge variant="warn">Menunggu</Badge>
<Badge variant="bad">Stok Habis</Badge>
<Badge variant="info">Dijadwalkan</Badge>
<Badge variant="neutral">Draft</Badge>`}
    >
      <Badge variant="ok">
        <CircleCheck aria-hidden /> Selesai
      </Badge>
      <Badge variant="warn">Menunggu</Badge>
      <Badge variant="bad">Stok Habis</Badge>
      <Badge variant="info">Dijadwalkan</Badge>
      <Badge variant="neutral">Draft</Badge>
    </DocExample>

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
