import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DocExample, DocSection } from '../components/DocSection';

export const InputDocs: React.FC = () => (
  <DocSection
    id="input"
    title="Input, Textarea, Label, Select"
    description="Kontrol isian dasar. Selalu pasangkan dengan Label (htmlFor = id input). Untuk form dengan validasi, bungkus dengan komponen Form di bagian Form."
    importPath="import { Input } from '@/components/ui/input'; // juga textarea, label, select"
  >
    <DocExample
      title="Input dan Label"
      code={`
<div className="grid w-full max-w-sm gap-2">
  <Label htmlFor="nama-produk">Nama Produk</Label>
  <Input id="nama-produk" placeholder="Contoh: Paracetamol 500mg" />
</div>`}
    >
      <div className="grid w-full max-w-sm gap-2">
        <Label htmlFor="doc-nama-produk">Nama Produk</Label>
        <Input id="doc-nama-produk" placeholder="Contoh: Paracetamol 500mg" />
      </div>
      <div className="grid w-full max-w-sm gap-2">
        <Label htmlFor="doc-input-disabled">Nonaktif</Label>
        <Input id="doc-input-disabled" value="Tidak bisa diubah" disabled readOnly />
      </div>
    </DocExample>

    <DocExample
      title="Textarea"
      code={`
<Label htmlFor="keterangan">Keterangan</Label>
<Textarea id="keterangan" placeholder="Catatan tambahan..." />`}
    >
      <div className="grid w-full max-w-sm gap-2">
        <Label htmlFor="doc-keterangan">Keterangan</Label>
        <Textarea id="doc-keterangan" placeholder="Catatan tambahan..." />
      </div>
    </DocExample>

    <DocExample
      title="Select"
      code={`
<Select value={satuan} onValueChange={setSatuan}>
  <SelectTrigger className="w-48">
    <SelectValue placeholder="Pilih satuan" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="strip">Strip</SelectItem>
    <SelectItem value="botol">Botol</SelectItem>
    <SelectItem value="box">Box</SelectItem>
  </SelectContent>
</Select>`}
    >
      <Select>
        <SelectTrigger className="w-48" aria-label="Satuan">
          <SelectValue placeholder="Pilih satuan" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="strip">Strip</SelectItem>
          <SelectItem value="botol">Botol</SelectItem>
          <SelectItem value="box">Box</SelectItem>
        </SelectContent>
      </Select>
    </DocExample>
  </DocSection>
);
