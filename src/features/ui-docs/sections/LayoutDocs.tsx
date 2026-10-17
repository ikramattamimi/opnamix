import React, { useState } from 'react';
import { Archive, CircleDollarSign, Download, Plus, TriangleAlert } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/layout/PageHeader';
import StatCard from '@/components/common/StatCard';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocExample, DocSection } from '../components/DocSection';

export const PageLayoutDocs: React.FC = () => (
  <DocSection
    id="page-layout"
    title="PageLayout dan PageHeader"
    description="Pembungkus setiap halaman di routes.tsx. PageLayout mengatur lebar dan jarak antar-bagian (space-y-6); PageHeader adalah judul h2 di dalam halaman (h1 sudah ada di Header) dengan deskripsi dan slot aksi di kanan."
    importPath="import PageLayout from '@/components/layout/PageLayout'; import PageHeader from '@/components/layout/PageHeader';"
  >
    <DocExample
      title="Judul dengan aksi"
      note="Aksi utama memakai Button default; aksi pendamping outline. Di layar kecil aksi turun ke bawah judul."
      code={`
<PageLayout>
  <PageHeader
    title="Daftar Produk"
    description="Kelola data obat dan alkes."
    actions={
      <>
        <Button variant="outline"><Download /> Ekspor</Button>
        <Button><Plus /> Tambah Produk</Button>
      </>
    }
  />
  {/* isi halaman */}
</PageLayout>`}
    >
      <PageLayout>
        <PageHeader
          title="Daftar Produk"
          description="Kelola data obat dan alkes."
          actions={
            <>
              <Button variant="outline">
                <Download aria-hidden /> Ekspor
              </Button>
              <Button>
                <Plus aria-hidden /> Tambah Produk
              </Button>
            </>
          }
        />
      </PageLayout>
    </DocExample>

    <DocExample
      title="Lebar sempit"
      note='maxWidth="narrow" membatasi isi ke max-w-3xl di tengah, untuk halaman baca atau form satu kolom (Profil, Notifikasi). Default "full".'
      code={`
<PageLayout maxWidth="narrow">
  <PageHeader title="Akun Saya" description="Data profil dan kata sandi." />
  ...
</PageLayout>`}
    >
      <PageLayout maxWidth="narrow" className="rounded-xl bg-background p-4">
        <PageHeader title="Akun Saya" description="Data profil dan kata sandi." />
      </PageLayout>
    </DocExample>
  </DocSection>
);

export const CardDocs: React.FC = () => (
  <DocSection
    id="card"
    title="Card dan StatCard"
    description="Card untuk mengelompokkan konten. StatCard untuk angka ringkasan di atas halaman; prop icon menerima komponen lucide."
    importPath="import { Card, ... } from '@/components/ui/card'; import StatCard from '@/components/common/StatCard';"
  >
    <DocExample
      title="StatCard"
      note="color adalah nama warna Tailwind tanpa prefix text- (misalnya primary, amber-500)."
      code={`
<StatCard label="Total Barang" value={120} icon={Archive} color="primary" />
<StatCard label="Nilai Stok" value="Rp 12.500.000" icon={CircleDollarSign} color="green-500" />
<StatCard label="Stok Menipis" value={4} icon={TriangleAlert} color="amber-500" />`}
    >
      <div className="grid w-full gap-4 sm:grid-cols-3">
        <StatCard label="Total Barang" value={120} icon={Archive} color="primary" />
        <StatCard
          label="Nilai Stok"
          value="Rp 12.500.000"
          icon={CircleDollarSign}
          color="green-500"
        />
        <StatCard label="Stok Menipis" value={4} icon={TriangleAlert} color="amber-500" />
      </div>
    </DocExample>

    <DocExample
      title="Card"
      code={`
<Card>
  <CardHeader>
    <CardTitle>Jadwal Opname</CardTitle>
    <CardDescription>Setiap akhir bulan</CardDescription>
  </CardHeader>
  <CardContent>...</CardContent>
  <CardFooter><Button size="sm">Mulai</Button></CardFooter>
</Card>`}
    >
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Jadwal Opname</CardTitle>
          <CardDescription>Setiap akhir bulan</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          32 produk akan dihitung.
        </CardContent>
        <CardFooter>
          <Button size="sm">Mulai</Button>
        </CardFooter>
      </Card>
    </DocExample>
  </DocSection>
);

export const TabsDocs: React.FC = () => {
  const [tab, setTab] = useState('transaksi');
  return (
    <DocSection
      id="tabs"
      title="Tabs"
      description="Membagi satu halaman menjadi beberapa tampilan, seperti di Laporan Stok. Isi tab yang tidak aktif tidak dirender."
      importPath="import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';"
    >
      <DocExample
        title="Tabs terkontrol"
        code={`
<Tabs value={tab} onValueChange={setTab}>
  <TabsList>
    <TabsTrigger value="transaksi">Transaksi</TabsTrigger>
    <TabsTrigger value="mutasi">Mutasi Stok</TabsTrigger>
  </TabsList>
  <TabsContent value="transaksi">...</TabsContent>
  <TabsContent value="mutasi">...</TabsContent>
</Tabs>`}
      >
        <Tabs value={tab} onValueChange={setTab} className="w-full max-w-md">
          <TabsList>
            <TabsTrigger value="transaksi">Transaksi</TabsTrigger>
            <TabsTrigger value="mutasi">Mutasi Stok</TabsTrigger>
          </TabsList>
          <TabsContent value="transaksi" className="text-sm text-muted-foreground">
            Isi tab Transaksi.
          </TabsContent>
          <TabsContent value="mutasi" className="text-sm text-muted-foreground">
            Isi tab Mutasi Stok.
          </TabsContent>
        </Tabs>
      </DocExample>
    </DocSection>
  );
};
