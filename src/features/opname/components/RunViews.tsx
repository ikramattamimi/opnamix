import React, { useRef, useState } from 'react';
import { CircleCheck, EyeOff, RotateCcw, ScanBarcode } from 'lucide-react';
import { Toolbar, ToolbarSpacer } from '@/components/data/Toolbar';
import { SearchInput } from '@/components/data/SearchInput';
import { SegmentedControl } from '@/components/data/SegmentedControl';
import { MiniStats } from '@/components/panel/MiniStats';
import { InfoBox } from '@/components/panel/InfoBox';
import { LineItems } from '@/components/panel/LineItems';
import { StatusChip } from '@/components/data/StatusChip';
import { SignedValue } from '@/components/data/SignedValue';
import { EmptyState } from '@/components/common/QueryState';
import { CountInput } from '@/components/form/CountInput';
import { ChoiceChips } from '@/components/form/ChoiceChips';
import { Field } from '@/components/form/Field';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { productMatches } from '@/features/products/catalog';
import {
  ProductBrandTag,
  ProductMeta,
  ProductTitle,
} from '@/features/products/components/ProductTitle';
import {
  REASONS,
  diffOf,
  finalOf,
  hasReason,
  isCounted,
  valueOf,
  type ReasonCode,
  type RunItem,
} from '../catalog';
import type { RunItemUpdate } from '../types';

// Isi utama layar kerja opname: daftar hitung (stok sistem disembunyikan) dan
// tinjau selisih (alasan wajib untuk setiap selisih).

export type CountFilter = 'Semua' | 'Belum' | 'Sudah';

const unitOf = (i: RunItem) => i.product.unit.toLowerCase();

const ProductCell: React.FC<{ item: RunItem }> = ({ item }) => (
  <span className="flex min-w-0 flex-col gap-0.5">
    <span className="flex min-w-0 items-center gap-1.5 text-label font-semibold">
      <ProductBrandTag product={item.product} size="sm" />
      <ProductTitle product={item.product} showBrand={false} className="truncate" />
    </span>
    <ProductMeta product={item.product} className="text-xs text-muted-foreground" />
  </span>
);

export const CountView: React.FC<{
  items: RunItem[];
  filter: CountFilter;
  onFilterChange: (f: CountFilter) => void;
  onChange: (u: RunItemUpdate) => void;
}> = ({ items, filter, onFilterChange, onChange }) => {
  const [query, setQuery] = useState('');
  const inputs = useRef(new Map<string, HTMLInputElement>());
  const counted = items.filter(isCounted).length;
  const list = items.filter(
    (i) =>
      (filter === 'Semua' || (filter === 'Belum') === !isCounted(i)) &&
      productMatches(i.product, query),
  );

  const focusNext = (fromId?: string) => {
    const ids = list.map((i) => i.detailId);
    const start = fromId ? ids.indexOf(fromId) + 1 : 0;
    const next =
      ids.slice(start).find((id) => !isCounted(list.find((i) => i.detailId === id)!)) ?? ids[start];
    if (next) inputs.current.get(next)?.focus();
    else if (fromId) inputs.current.get(fromId)?.blur();
  };

  return (
    <Card className="flex flex-col gap-3 p-3">
      <Toolbar>
        <SearchInput
          value={query}
          onChange={setQuery}
          icon={ScanBarcode}
          placeholder="Cari atau scan barcode untuk lompat ke produk"
          label="Cari produk"
          onEnter={() => focusNext()}
        />
        <SegmentedControl<CountFilter>
          label="Filter hitung"
          value={filter}
          onChange={onFilterChange}
          options={[
            { value: 'Semua', label: 'Semua', count: items.length },
            { value: 'Belum', label: 'Belum dihitung', count: items.length - counted },
            { value: 'Sudah', label: 'Sudah', count: counted },
          ]}
        />
      </Toolbar>
      <InfoBox icon={EyeOff}>
        Stok sistem disembunyikan selama menghitung. Ketik <b>0</b> bila produk memang tidak ada di
        rak. Tekan <b>Enter</b> untuk lompat ke produk berikutnya.
      </InfoBox>
      {list.length === 0 ? (
        <EmptyState
          icon={CircleCheck}
          title={filter === 'Belum' ? 'Semua produk sudah dihitung' : 'Tidak ada produk yang cocok'}
        />
      ) : (
        <div className="flex flex-col divide-y rounded-xl border">
          {list.map((item) => (
            <div
              key={item.detailId}
              className={cn(
                'grid grid-cols-[minmax(0,1fr)_auto_1.25rem] items-center gap-3 px-3 py-2',
                isCounted(item) && 'bg-surface-2/50',
              )}
            >
              <ProductCell item={item} />
              <CountInput
                ref={(el) => {
                  if (el) inputs.current.set(item.detailId, el);
                  else inputs.current.delete(item.detailId);
                }}
                value={item.physicalStock}
                onValueChange={(v) => onChange({ detailId: item.detailId, physicalStock: v })}
                unit={unitOf(item)}
                aria-label={`Stok fisik ${item.product.name}`}
                onEnter={() => focusNext(item.detailId)}
              />
              <CircleCheck
                className={cn('size-5 text-ok', !isCounted(item) && 'invisible')}
                aria-hidden
              />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export type ReviewFilter = 'Selisih' | 'Sesuai';

// Hitung ulang: nilai disimpan saat Enter atau keluar dari isian, supaya
// kartu tidak berpindah daftar selagi angka masih diketik
const RecountInput: React.FC<{
  item: RunItem;
  onCommit: (value: number | null) => void;
}> = ({ item, onCommit }) => {
  const [draft, setDraft] = useState<number | null>(null);
  return (
    <CountInput
      autoFocus
      className="h-7 w-24"
      value={draft}
      placeholder={String(item.physicalStock ?? '')}
      onValueChange={setDraft}
      onEnter={() => onCommit(draft)}
      onBlur={() => onCommit(draft)}
      aria-label={`Hitung ulang ${item.product.name}`}
    />
  );
};

const ReviewCard: React.FC<{ item: RunItem; onChange: (u: RunItemUpdate) => void }> = ({
  item,
  onChange,
}) => {
  const [recount, setRecount] = useState(false);
  const [finalEdit, setFinalEdit] = useState(item.finalStock !== null);
  const d = diffOf(item) ?? 0;
  const done = hasReason(item);
  return (
    <section
      className={cn(
        'flex flex-col gap-2.5 rounded-xl border p-3',
        done ? 'border-ok/40' : 'border-warn/50',
      )}
    >
      <div className="flex items-start gap-2">
        <ProductCell item={item} />
        <span className="flex-1" />
        <Button variant="ghost" size="sm" onClick={() => setRecount(true)}>
          <RotateCcw aria-hidden />
          Hitung ulang
        </Button>
      </div>
      <MiniStats
        items={[
          { label: 'Sistem', value: `${item.systemStock} ${unitOf(item)}` },
          {
            label: 'Fisik',
            value: recount ? (
              <RecountInput
                item={item}
                onCommit={(v) => {
                  setRecount(false);
                  if (v !== null) onChange({ detailId: item.detailId, physicalStock: v });
                }}
              />
            ) : (
              `${item.physicalStock ?? '—'} ${unitOf(item)}`
            ),
          },
          { label: 'Selisih', value: <SignedValue value={d} /> },
          { label: 'Nilai', value: <SignedValue value={valueOf(item)} currency /> },
        ]}
      />
      <Field
        label={
          <span className="inline-flex items-center gap-1.5">
            Alasan selisih
            {!done && <StatusChip tone="bad">wajib</StatusChip>}
          </span>
        }
      >
        <ChoiceChips<ReasonCode>
          label="Alasan selisih"
          value={item.reasonCode}
          onChange={(code) => onChange({ detailId: item.detailId, reasonCode: code })}
          options={REASONS.map((r) => ({ value: r.code, label: r.label }))}
        />
      </Field>
      <Input
        aria-label={`Catatan selisih ${item.product.name}`}
        value={item.note ?? ''}
        onChange={(e) => onChange({ detailId: item.detailId, note: e.target.value })}
        placeholder="Catatan (opsional), misalnya nomor resep yang belum dicatat"
      />
      {item.reasonText && !item.reasonCode && (
        <p className="text-note text-muted-foreground">Alasan lama: {item.reasonText}</p>
      )}
      {finalEdit ? (
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <p className="text-note text-muted-foreground">
            Stok final berbeda dari hitungan fisik, misalnya barang ditemukan setelah dihitung.
          </p>
          <CountInput
            value={finalOf(item)}
            unit={unitOf(item)}
            aria-label={`Stok final ${item.product.name}`}
            onValueChange={(v) =>
              onChange({
                detailId: item.detailId,
                finalStock: v === null || v === item.physicalStock ? null : v,
              })
            }
          />
        </div>
      ) : (
        <Button
          variant="link"
          size="sm"
          className="h-auto self-start px-0"
          onClick={() => setFinalEdit(true)}
        >
          Ubah stok final (lanjutan)
        </Button>
      )}
    </section>
  );
};

export const ReviewView: React.FC<{
  items: RunItem[];
  filter: ReviewFilter;
  onFilterChange: (f: ReviewFilter) => void;
  onChange: (u: RunItemUpdate) => void;
}> = ({ items, filter, onFilterChange, onChange }) => {
  const diffs = items.filter((i) => (diffOf(i) ?? 0) !== 0);
  const oks = items.filter((i) => diffOf(i) === 0);
  const [recounting, setRecounting] = useState<string | null>(null);
  return (
    <Card className="flex flex-col gap-3 p-3">
      <Toolbar>
        <SegmentedControl<ReviewFilter>
          label="Filter tinjau"
          value={filter}
          onChange={onFilterChange}
          options={[
            { value: 'Selisih', label: 'Selisih', count: diffs.length },
            { value: 'Sesuai', label: 'Sesuai', count: oks.length },
          ]}
        />
        <ToolbarSpacer />
        <span className="text-note text-muted-foreground">
          Selisih dihitung dari stok sistem saat opname dimulai.
        </span>
      </Toolbar>
      {filter === 'Selisih' ? (
        diffs.length === 0 ? (
          <EmptyState
            icon={CircleCheck}
            title="Tidak ada selisih"
            description="Semua hitungan cocok dengan stok sistem."
          />
        ) : (
          diffs.map((i) => <ReviewCard key={i.detailId} item={i} onChange={onChange} />)
        )
      ) : oks.length === 0 ? (
        <EmptyState icon={CircleCheck} title="Belum ada produk yang sesuai" />
      ) : (
        <LineItems
          items={oks.map((i) => ({
            id: i.detailId,
            title: i.product.name,
            subtitle: `${i.product.brand || 'Generik'} · ${i.systemStock} ${unitOf(i)}`,
            amount:
              recounting === i.detailId ? (
                <RecountInput
                  item={i}
                  onCommit={(v) => {
                    setRecounting(null);
                    if (v !== null) onChange({ detailId: i.detailId, physicalStock: v });
                  }}
                />
              ) : (
                <span className="flex items-center gap-2">
                  <StatusChip tone="ok">Sesuai</StatusChip>
                  <Button variant="ghost" size="sm" onClick={() => setRecounting(i.detailId)}>
                    <RotateCcw aria-hidden />
                    Hitung ulang
                  </Button>
                </span>
              ),
          }))}
        />
      )}
    </Card>
  );
};
