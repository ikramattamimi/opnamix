import React from 'react';
import { ScanBarcode, SearchX } from 'lucide-react';
import { Toolbar } from '@/components/data/Toolbar';
import { SearchInput } from '@/components/data/SearchInput';
import { ResponsiveGrid } from '@/components/data/ResponsiveGrid';
import { Pagination } from '@/components/data/Pagination';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/QueryState';
import { Card } from '@/components/ui/card';
import { useGridPageSize } from '@/hooks/useGridPageSize';

// Katalog kiri PosLayout: cari/scan (pintasan "/", Enter menjalankan onEnter),
// alat tambahan, baris filter, grid tile yang mengikuti lebar layar, dan
// pagination (kolom × baris).

const TILE_MIN_WIDTH = 168;
const ROWS = 4;

interface PosCatalogProps<T> {
  query: string;
  onQueryChange: (value: string) => void;
  /** Enter di kotak cari, biasanya menambah hasil teratas */
  onEnter: () => void;
  searchLabel: string;
  placeholder?: string;
  /** Di samping kotak cari, mis. tab Produk/Jasa */
  tools?: React.ReactNode;
  /** Baris di bawah kotak cari: kategori, chip filter */
  filters?: React.ReactNode;
  items: readonly T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
  page: number;
  onPageChange: (page: number) => void;
  isPending?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  emptyTitle?: string;
}

export function PosCatalog<T>({
  query,
  onQueryChange,
  onEnter,
  searchLabel,
  placeholder = 'Cari atau scan barcode',
  tools,
  filters,
  items,
  getKey,
  renderItem,
  page,
  onPageChange,
  isPending,
  isError,
  onRetry,
  emptyTitle = 'Tidak ditemukan',
}: PosCatalogProps<T>) {
  const grid = useGridPageSize(TILE_MIN_WIDTH, ROWS);
  const pages = Math.max(1, Math.ceil(items.length / grid.pageSize));
  const current = Math.min(page, pages);
  const visible = items.slice((current - 1) * grid.pageSize, current * grid.pageSize);
  const ready = !isPending && !isError;

  return (
    <Card className="flex flex-col gap-3 p-3">
      <Toolbar>
        <SearchInput
          value={query}
          onChange={onQueryChange}
          onEnter={onEnter}
          placeholder={placeholder}
          label={searchLabel}
          icon={ScanBarcode}
          className="max-w-none"
        />
        {tools}
      </Toolbar>
      {filters && <Toolbar>{filters}</Toolbar>}

      {/* Grid selalu terpasang supaya lebarnya terukur sejak awal */}
      <ResponsiveGrid ref={grid.ref} cols={grid.cols}>
        {ready &&
          visible.map((item) => (
            <React.Fragment key={getKey(item)}>{renderItem(item)}</React.Fragment>
          ))}
      </ResponsiveGrid>
      {isPending && <LoadingState label="Memuat katalog..." />}
      {isError && <ErrorState onRetry={onRetry} />}
      {ready && items.length === 0 && (
        <EmptyState
          icon={SearchX}
          title={emptyTitle}
          description={query.trim() ? 'Ubah kata kunci atau kategori.' : undefined}
        />
      )}
      {ready && (
        <Pagination
          page={current}
          pageSize={grid.pageSize}
          total={items.length}
          onPageChange={onPageChange}
          note={`${grid.cols} × ${ROWS}`}
        />
      )}
    </Card>
  );
}
