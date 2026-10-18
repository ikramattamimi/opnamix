import React, { useState } from 'react';
import { Bell, CircleCheck, Download, Plus, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatChip } from '@/components/layout/StatChip';
import { HeaderIconButton } from '@/components/layout/HeaderIconButton';
import { SegmentedControl } from '@/components/data/SegmentedControl';
import { ToneIcon } from '@/components/data/ToneIcon';
import { DocExample, DocSection } from '../components/DocSection';

export const PageHeaderDocs: React.FC = () => {
  const [filter, setFilter] = useState<'semua' | 'menipis'>('semua');
  return (
    <DocSection
      id="page-header"
      title="PageHeader dan StatChip"
      description="Pita gradien di atas setiap halaman. Menempel saat digulir, meringkas jadi baris judul saat gulir turun, terbuka lagi saat pointer di atasnya (intip), dan bisa di-pin. Judul bawaan diambil dari APP_ROUTES."
      importPath="import { PageHeader } from '@/components/layout/PageHeader'; import { StatChip } from '@/components/layout/StatChip';"
    >
      <DocExample
        title="Pemakaian"
        note="Taruh sebagai elemen pertama halaman. Aksi utama memakai Button variant light, aksi lain glass. children untuk baris tambahan (tab, kotak pintasan) yang ikut disembunyikan saat ringkas."
        code={`
<PageHeader
  stats={[
    { label: 'Produk', value: 248 },
    { label: 'Menipis', value: 12, tone: 'warn', pressed, onClick: toggle },
  ]}
  actions={<>
    <Button variant="glass"><Download /> Ekspor</Button>
    <Button variant="light"><Plus /> Tambah Produk</Button>
  </>}
/>`}
      >
        <div className="flex w-full flex-col gap-2.5 rounded-3xl bg-grad-hero px-4 pb-3.5 pt-3 text-on-grad">
          <div className="flex min-h-8 items-center gap-2.5">
            <p className="flex-1 text-xl font-bold">Data Produk</p>
            <HeaderIconButton label="Notifikasi">
              <Bell aria-hidden />
            </HeaderIconButton>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap gap-1.5">
              <StatChip label="Produk" value={248} />
              <StatChip label="Aman" value={230} tone="ok" />
              <StatChip
                label="Menipis"
                value={12}
                tone="warn"
                pressed={filter === 'menipis'}
                onClick={() => setFilter(filter === 'menipis' ? 'semua' : 'menipis')}
              />
              <StatChip label="Habis" value={6} tone="bad" />
            </div>
            <div className="flex gap-2">
              <Button variant="glass">
                <Download aria-hidden /> Ekspor
              </Button>
              <Button variant="light">
                <Plus aria-hidden /> Tambah Produk
              </Button>
            </div>
          </div>
        </div>
      </DocExample>
    </DocSection>
  );
};

export const SegmentedDocs: React.FC = () => {
  const [value, setValue] = useState('semua');
  const [glass, setGlass] = useState('system');
  return (
    <DocSection
      id="segmented"
      title="SegmentedControl"
      description="Pilihan tunggal bersegmen dengan hitungan opsional. Varian glass untuk di atas gradien (tab laporan di header, tema di sidebar)."
      importPath="import { SegmentedControl } from '@/components/data/SegmentedControl';"
    >
      <DocExample
        title="Default dan glass"
        code={`
<SegmentedControl
  label="Status"
  value={value}
  onChange={setValue}
  options={[
    { value: 'semua', label: 'Semua', count: 42 },
    { value: 'menunggu', label: 'Menunggu', count: 3 },
    { value: 'selesai', label: 'Selesai' },
  ]}
/>
<SegmentedControl variant="glass" full ... />`}
      >
        <SegmentedControl
          label="Status"
          value={value}
          onChange={setValue}
          options={[
            { value: 'semua', label: 'Semua', count: 42 },
            { value: 'menunggu', label: 'Menunggu', count: 3 },
            { value: 'selesai', label: 'Selesai' },
          ]}
        />
        <div className="w-64 rounded-xl bg-grad-side p-2">
          <SegmentedControl
            label="Tema"
            variant="glass"
            full
            value={glass}
            onChange={setGlass}
            options={[
              { value: 'light', label: 'Terang' },
              { value: 'system', label: 'Sistem' },
              { value: 'dark', label: 'Gelap' },
            ]}
          />
        </div>
      </DocExample>
    </DocSection>
  );
};

export const ToneIconDocs: React.FC = () => (
  <DocSection
    id="tone-icon"
    title="ToneIcon"
    description="Ikon di dalam kotak berwarna lembut untuk baris daftar, notifikasi, kepala panel, dan keadaan kosong."
    importPath="import { ToneIcon } from '@/components/data/ToneIcon';"
  >
    <DocExample
      title="Nada dan ukuran"
      note="tone: primary, ok, warn, bad, info, neutral, atau kategori (obat, bhp, imun, alkes). size: sm 26px, md 32px, lg 36px, xl 40px."
      code={`
<ToneIcon icon={CircleCheck} tone="ok" />
<ToneIcon icon={TriangleAlert} tone="warn" size="lg" />`}
    >
      <ToneIcon icon={Bell} tone="primary" size="sm" />
      <ToneIcon icon={CircleCheck} tone="ok" />
      <ToneIcon icon={TriangleAlert} tone="warn" size="lg" />
      <ToneIcon icon={TriangleAlert} tone="bad" size="xl" />
      <ToneIcon icon={Bell} tone="info" />
      <ToneIcon icon={Bell} tone="neutral" />
      <ToneIcon icon={Bell} tone="obat" />
      <ToneIcon icon={Bell} tone="bhp" />
      <ToneIcon icon={Bell} tone="imun" />
      <ToneIcon icon={Bell} tone="alkes" />
    </DocExample>
  </DocSection>
);
