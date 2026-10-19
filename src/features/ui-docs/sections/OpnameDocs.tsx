import React, { useState } from 'react';
import { CloudCheck, Play, Timer } from 'lucide-react';
import { GlassTile } from '@/components/layout/GlassTile';
import { StepBar } from '@/components/data/StepBar';
import { SignedValue } from '@/components/data/SignedValue';
import { StatusChip } from '@/components/data/StatusChip';
import { CountInput } from '@/components/form/CountInput';
import { CheckList, CheckRow } from '@/components/form/CheckRow';
import { Button } from '@/components/ui/button';
import { DocExample, DocSection } from '../components/DocSection';

export const OpnameDocs: React.FC = () => {
  const [counts, setCounts] = useState<(number | null)[]>([24, null, null]);
  const [picked, setPicked] = useState<Set<number>>(new Set([0]));
  return (
    <DocSection
      id="opname-primitives"
      title="Layar kerja dan opname"
      description="GlassTile (baris kaca di dalam PageHeader: opname berjalan, pintasan), StepBar (langkah berurutan dengan status simpan di kanan), CountInput (angka besar + satuan, kosong = belum dihitung, Enter lompat ke berikutnya), CheckRow/CheckList (centang ringkas untuk daftar panjang), dan SignedValue (angka bertanda: kurang merah, lebih biru)."
      importPath="import { CountInput } from '@/components/form/CountInput'; import { StepBar } from '@/components/data/StepBar'; import { GlassTile } from '@/components/layout/GlassTile';"
    >
      <DocExample
        title="GlassTile"
        note="Hanya di atas gradien header."
        code={`
<PageHeader …>
  <GlassTile
    icon={Timer}
    title="Sedang berjalan · Opname cepat 19 Okt"
    subtitle="OPN-14 · dimulai 09.12 oleh Doni · 6 produk dikunci"
    progress={{ label: 'Dihitung', value: 2, max: 6 }}
    action={<Button variant="light"><Play />Lanjutkan</Button>}
  />
</PageHeader>`}
      >
        <div className="w-full rounded-2xl bg-grad-hero p-3">
          <GlassTile
            icon={Timer}
            title="Sedang berjalan · Opname cepat 19 Okt"
            subtitle="OPN-14 · dimulai 09.12 oleh Doni Saputra · 6 produk dikunci dari transaksi"
            progress={{ label: 'Dihitung', value: 2, max: 6 }}
            action={
              <Button variant="light">
                <Play aria-hidden />
                Lanjutkan
              </Button>
            }
          />
        </div>
      </DocExample>

      <DocExample
        title="StepBar"
        code={`
<StepBar
  steps={[
    { key: 'cakupan', label: 'Cakupan · 6 produk', state: 'done' },
    { key: 'hitung', label: 'Hitung · 6/6', state: 'current' },
    { key: 'tinjau', label: 'Tinjau selisih', state: 'todo', onClick: goReview, disabled: remaining > 0, hint: 'Hitung semua produk dulu' },
  ]}
  aside={<><CloudCheck />Tersimpan otomatis 09.41</>}
/>`}
      >
        <StepBar
          className="w-full"
          steps={[
            { key: 'cakupan', label: 'Cakupan · 3 produk', state: 'done' },
            { key: 'hitung', label: 'Hitung · 1/3', state: 'current' },
            {
              key: 'tinjau',
              label: 'Tinjau selisih',
              state: 'todo',
              onClick: () => undefined,
              disabled: true,
              hint: 'Hitung semua produk dulu',
            },
          ]}
          aside={
            <>
              <CloudCheck className="size-3.5" aria-hidden />
              Tersimpan otomatis 09.41
            </>
          }
        />
      </DocExample>

      <DocExample
        title="CountInput"
        note="Hanya digit. Kosongkan untuk menandai belum dihitung; isian terisi berwarna hijau."
        code={`<CountInput value={item.physicalStock} onValueChange={(v) => save({ physicalStock: v })} unit="tablet" aria-label="Stok fisik Amoxicillin" onEnter={focusNext} />`}
      >
        <div className="flex flex-wrap gap-2">
          {['tablet', 'botol', 'box'].map((unit, i) => (
            <CountInput
              key={unit}
              value={counts[i]}
              unit={unit}
              aria-label={`Contoh hitung ${unit}`}
              onValueChange={(v) => setCounts((prev) => prev.map((c, j) => (j === i ? v : c)))}
            />
          ))}
        </div>
      </DocExample>

      <DocExample
        title="CheckRow dan SignedValue"
        code={`
<CheckList label="Produk">
  <CheckRow checked={…} onCheckedChange={…} title="Amoxicillin 500 mg" subtitle="Generik · opname terakhir 3 Okt 2026" trailing={<StatusChip tone="warn">Menipis</StatusChip>} />
</CheckList>
<SignedValue value={-12500} currency />`}
      >
        <div className="flex w-full max-w-md flex-col gap-3">
          <CheckList label="Contoh produk">
            {[
              ['Amoxicillin 500 mg', 'Generik · opname terakhir 3 Okt 2026', 'warn', 'Menipis'],
              ['Kasa steril 16 × 16 cm', 'OneMed · belum pernah diopname', 'ok', 'Aman'],
              ['Paracetamol sirup 60 ml', 'Sanmol · sedang dihitung di Opname cepat', 'ok', 'Aman'],
            ].map(([title, sub, tone, label], i) => (
              <CheckRow
                key={title}
                checked={picked.has(i)}
                disabled={i === 2}
                onCheckedChange={(on) =>
                  setPicked((prev) => {
                    const next = new Set(prev);
                    if (on) next.add(i);
                    else next.delete(i);
                    return next;
                  })
                }
                title={title}
                subtitle={sub}
                trailing={<StatusChip tone={tone as 'ok' | 'warn'}>{label}</StatusChip>}
              />
            ))}
          </CheckList>
          <span className="flex gap-4 text-label font-semibold">
            <SignedValue value={-12500} currency />
            <SignedValue value={4000} currency />
            <SignedValue value={0} currency zero="Rp 0" />
            <SignedValue value={-3} />
          </span>
        </div>
      </DocExample>
    </DocSection>
  );
};
