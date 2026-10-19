import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DocExample, DocSection } from '../components/DocSection';

export const CardDocs: React.FC = () => (
  <DocSection
    id="card"
    title="Card"
    description="Card untuk mengelompokkan konten. Angka ringkasan memakai StatChip di header atau KpiStrip di dalam halaman."
    importPath="import { Card, ... } from '@/components/ui/card';"
  >
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
