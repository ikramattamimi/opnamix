import React, { useMemo, useState } from 'react';
import { SearchInput } from '@/components/data/SearchInput';
import { StatusChip } from '@/components/data/StatusChip';
import { ChoiceChips } from '@/components/form/ChoiceChips';
import { CheckList, CheckRow } from '@/components/form/CheckRow';
import { Button } from '@/components/ui/button';
import { formatDateForDisplay } from '@/lib/format';
import {
  CATEGORIES,
  CATEGORY_META,
  STOCK_STATUS_META,
  productMatches,
  stockStatus,
} from '@/features/products/catalog';
import type { Category, Product } from '@/features/products/types';

// Pilih produk untuk opname cepat atau cakupan manual jadwal: saring per
// kategori, stok menipis, belum lama diopname, dan cari; lalu centang.
// Produk yang sedang dihitung di opname lain tidak bisa dipilih.

type Flag = 'menipis' | 'lama';
const STALE_DAYS = 30;

interface ProductPickerProps {
  products: readonly Product[];
  selected: ReadonlySet<string>;
  onChange: (ids: Set<string>) => void;
  /** id produk → nama opname yang sedang menghitungnya */
  locked?: ReadonlyMap<string, string>;
  /** id produk → tanggal opname terakhir */
  lastOpnamed?: ReadonlyMap<string, Date>;
}

export const ProductPicker: React.FC<ProductPickerProps> = ({
  products,
  selected,
  onChange,
  locked,
  lastOpnamed,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [query, setQuery] = useState('');

  const staleBefore = useMemo(() => Date.now() - STALE_DAYS * 864e5, []);
  const candidates = products.filter((p) => {
    if (categories.length && !categories.includes(p.category)) return false;
    if (flags.includes('menipis') && stockStatus(p) === 'aman') return false;
    if (flags.includes('lama')) {
      const last = lastOpnamed?.get(p.id);
      if (last && last.getTime() > staleBefore) return false;
    }
    return productMatches(p, query);
  });
  const free = candidates.filter((p) => !locked?.has(p.id));
  const allOn = free.length > 0 && free.every((p) => selected.has(p.id));

  const toggle = (id: string, on: boolean) => {
    const next = new Set(selected);
    if (on) next.add(id);
    else next.delete(id);
    onChange(next);
  };

  const toggleAll = () => {
    const next = new Set(selected);
    for (const p of free) {
      if (allOn) next.delete(p.id);
      else next.add(p.id);
    }
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2">
      <ChoiceChips<Category>
        multiple
        label="Kategori"
        value={categories}
        onChange={setCategories}
        options={CATEGORIES.map((c) => ({ value: c, label: CATEGORY_META[c].short }))}
      />
      <ChoiceChips<Flag>
        multiple
        label="Saring produk"
        value={flags}
        onChange={setFlags}
        options={[
          { value: 'menipis', label: 'Stok menipis atau habis' },
          { value: 'lama', label: `Belum diopname > ${STALE_DAYS} hari` },
        ]}
      />
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Cari nama, merek, atau kandungan"
        label="Cari produk"
        shortcut={false}
        className="max-w-none"
      />
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {candidates.length} produk cocok · <b className="text-foreground">{selected.size}</b>{' '}
          dipilih
        </span>
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto px-0"
          disabled={free.length === 0}
          onClick={toggleAll}
        >
          {allOn ? 'Batalkan pilihan' : `Pilih semua hasil (${free.length})`}
        </Button>
      </div>
      <CheckList label="Produk">
        {candidates.length === 0 ? (
          <p className="px-2 py-4 text-center text-note text-muted-foreground">
            Tidak ada produk yang cocok.
          </p>
        ) : (
          candidates.map((p) => {
            const lockedBy = locked?.get(p.id);
            const last = lastOpnamed?.get(p.id);
            const st = STOCK_STATUS_META[stockStatus(p)];
            return (
              <CheckRow
                key={p.id}
                checked={selected.has(p.id)}
                disabled={!!lockedBy}
                onCheckedChange={(on) => toggle(p.id, on)}
                title={p.name}
                subtitle={`${p.brand || 'Generik'} · ${
                  lockedBy
                    ? `sedang dihitung di ${lockedBy}`
                    : last
                      ? `opname terakhir ${formatDateForDisplay(last.toISOString())}`
                      : 'belum pernah diopname'
                }`}
                trailing={<StatusChip tone={st.tone}>{st.label}</StatusChip>}
              />
            );
          })
        )}
      </CheckList>
    </div>
  );
};
