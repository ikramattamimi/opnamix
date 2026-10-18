import React, { useState } from 'react';
import { Stethoscope } from 'lucide-react';
import { ItemCard } from '@/components/data/ItemCard';
import { StatusChip } from '@/components/data/StatusChip';
import { Meter } from '@/components/data/Meter';
import { ToneIcon } from '@/components/data/ToneIcon';
import { LineItems } from '@/components/panel/LineItems';
import { Field } from '@/components/form/Field';
import { OptionSelect } from '@/components/form/OptionSelect';
import { TagInput, type TagItem } from '@/components/form/TagInput';
import { rp } from '@/lib/format';
import {
  ProductBrandTag,
  ProductMeta,
  ProductTitle,
} from '@/features/products/components/ProductTitle';
import { SAMPLES } from './sampleProducts';
import { DocExample, DocSection } from '../components/DocSection';

const KNOWN_INGREDIENTS = [
  'Ambroxol HCl',
  'Chlorphenamine maleate',
  'Dextromethorphan HBr',
  'Ibuprofen',
  'Paracetamol',
  'Phenylephrine HCl',
];

export const TagInputDocs: React.FC = () => {
  const [tags, setTags] = useState<TagItem[]>([
    { value: 'Paracetamol', secondary: '500 mg' },
    { value: 'Kafein', secondary: '' },
    { value: 'Ibuprofeen', secondary: '' },
  ]);
  const [form, setForm] = useState('Sirup');
  return (
    <DocSection
      id="tag-input"
      title="TagInput dan OptionSelect"
      description="TagInput: daftar tag dengan isian sekunder per tag (zat + kekuatan). Enter atau koma menambah tag, teks dipisah koma bisa ditempel sekaligus, saran diambil dari nilai yang sudah ada, nama yang mirip saran ditandai “Mungkin maksudnya …?” (jarak Levenshtein ≤ 3), dan nama yang benar-benar baru diberi label “baru”. OptionSelect: Select dari daftar pilihan yang meneruskan id dan aria ke pemicu, jadi bisa langsung dipakai di dalam Field."
      importPath="import { TagInput } from '@/components/form/TagInput'; import { OptionSelect } from '@/components/form/OptionSelect';"
    >
      <DocExample
        title="Kandungan obat"
        note="Coba ketik “am”, tempel “Ambroxol HCl 15 mg, Kafein 50 mg”, atau klik tanda kuning untuk memperbaiki salah ketik. Backspace di isian kosong menghapus tag terakhir."
        code={`
<Field label="Kandungan · kekuatan opsional" hint="…" error={errors.ingredients}>
  <TagInput
    value={tags}
    onChange={setTags}
    suggestions={ingredientNames}
    placeholder="Ketik zat lalu Enter, atau tempel daftar dipisah koma"
    secondaryPlaceholder="Kekuatan"
  />
</Field>`}
      >
        <div className="w-full max-w-md">
          <Field label="Kandungan · kekuatan opsional" hint={`${tags.length} zat`}>
            <TagInput
              value={tags}
              onChange={setTags}
              suggestions={KNOWN_INGREDIENTS}
              placeholder="Ketik zat lalu Enter, atau tempel daftar dipisah koma"
              secondaryPlaceholder="Kekuatan"
            />
          </Field>
        </div>
      </DocExample>

      <DocExample
        title="OptionSelect"
        code={`
<Field label="Sediaan">
  <OptionSelect value={form} onValueChange={setForm} options={[{ value: 'Sirup', label: 'Sirup' }, …]} />
</Field>
<OptionSelect aria-label="Urutkan" className="w-auto" value={sort} onValueChange={setSort} options={PRODUCT_SORTS} />`}
      >
        <div className="w-full max-w-xs">
          <Field label="Sediaan">
            <OptionSelect
              value={form}
              onValueChange={setForm}
              options={['Tablet', 'Kapsul', 'Sirup', 'Injeksi'].map((v) => ({
                value: v,
                label: v,
              }))}
            />
          </Field>
        </div>
      </DocExample>
    </DocSection>
  );
};

export const ProductDomainDocs: React.FC = () => (
  <DocSection
    id="product-domain"
    title="Komponen domain produk"
    description="ProductTitle, ProductMeta, dan ProductBrandTag menyusun primitif (BrandTag, CategoryIcon, StatusChip) dengan aturan nama produk. Dipakai di card Data Produk, dan nanti di tile POS, keranjang, daftar hitung opname, dan laporan. Obat 1 zat: judul = kandungan + kekuatan. Obat 2+ zat: merek, lalu kandungan kecil (maks. 2 nama) + chip “+N”. Kategori lain: nama produk. Baris bawah: ikon kategori + “Obat · Sediaan”, tanpa kode barang."
    importPath="import { ProductTitle, ProductMeta, ProductBrandTag } from '@/features/products/components/ProductTitle';"
  >
    <DocExample
      title="Di ItemCard"
      note="Di card, merek sudah tampil lewat ProductBrandTag, jadi ProductTitle memakai showBrand={false}."
      code={`
<ItemCard
  topStart={<ProductBrandTag product={p} />}
  topEnd={<StatusChip tone="warn">Menipis</StatusChip>}
  title={<ProductTitle product={p} showBrand={false} />}
  subtitle={<ProductMeta product={p} />}
  meter={<Meter value={p.stock / (p.minStock * 3)} tone="warn" />}
  footer={…}
/>`}
    >
      <div className="grid w-full gap-2.5 sm:grid-cols-3">
        {SAMPLES.map((p) => {
          const tone = p.stock === 0 ? 'bad' : p.stock <= p.minStock ? 'warn' : 'ok';
          return (
            <ItemCard
              key={p.id}
              topStart={<ProductBrandTag product={p} />}
              topEnd={
                tone !== 'ok' && (
                  <StatusChip tone={tone}>{tone === 'bad' ? 'Habis' : 'Menipis'}</StatusChip>
                )
              }
              title={<ProductTitle product={p} showBrand={false} />}
              subtitle={<ProductMeta product={p} />}
              meter={<Meter value={p.stock / Math.max(p.minStock * 3, 1)} tone={tone} />}
              footer={
                <>
                  <span>
                    <b>{p.stock}</b> {p.unit.toLowerCase()} · min {p.minStock}
                  </span>
                  <b>{rp(p.sellingPrice)}</b>
                </>
              }
            />
          );
        })}
      </div>
    </DocExample>

    <DocExample
      title="Di baris daftar"
      note="Tanpa BrandTag di dekatnya, ProductTitle menulis merek di atas kandungan obat kombinasi."
      code={`
<LineItems items={[{ id, title: <ProductTitle product={p} />, subtitle: <ProductMeta product={p} />, amount }]} />`}
    >
      <div className="w-full max-w-md">
        <LineItems
          items={SAMPLES.map((p) => ({
            id: p.id,
            title: <ProductTitle product={p} />,
            subtitle: <ProductMeta product={p} />,
            amount: rp(p.sellingPrice),
          }))}
        />
      </div>
    </DocExample>

    <DocExample
      title="LineItems dengan ikon"
      note="LineItems kini menerima `lead` untuk ikon di kiri, dipakai di panel Kelola kategori jasa."
      code={`<LineItems items={[{ id, lead: <ToneIcon icon={Stethoscope} tone="obat" size="sm" />, title, subtitle, amount }]} />`}
    >
      <div className="w-full max-w-md">
        <LineItems
          items={[
            {
              id: 1,
              lead: <ToneIcon icon={Stethoscope} tone="obat" size="sm" />,
              title: 'Konsultasi',
              subtitle: 'Konsultasi dokter dan kontrol.',
              amount: (
                <StatusChip tone="neutral" plain>
                  4 jasa
                </StatusChip>
              ),
            },
          ]}
        />
      </div>
    </DocExample>
  </DocSection>
);
