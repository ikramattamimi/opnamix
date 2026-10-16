import React, { useState } from 'react';
import { Archive, CircleDollarSign, TriangleAlert } from 'lucide-react';
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
        <CardContent className="text-sm text-text-secondary-light">
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
          <TabsContent value="transaksi" className="text-sm text-text-secondary-light">
            Isi tab Transaksi.
          </TabsContent>
          <TabsContent value="mutasi" className="text-sm text-text-secondary-light">
            Isi tab Mutasi Stok.
          </TabsContent>
        </Tabs>
      </DocExample>
    </DocSection>
  );
};
