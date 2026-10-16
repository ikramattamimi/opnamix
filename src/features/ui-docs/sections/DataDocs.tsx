import React, { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { PackageSearch } from 'lucide-react';
import PaginationControls from '@/components/common/PaginationControls';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/QueryState';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { useToast } from '@/components/ui/toast';
import { DocExample, DocSection } from '../components/DocSection';

interface SampleRow {
  kode: string;
  nama: string;
  stok: number;
}

const SAMPLE_ROWS: SampleRow[] = [
  { kode: 'OBT-001', nama: 'Paracetamol 500mg', stok: 120 },
  { kode: 'OBT-002', nama: 'Amoxicillin 500mg', stok: 4 },
  { kode: 'OBT-003', nama: 'Vitamin C 100mg', stok: 0 },
  { kode: 'BMHP-001', nama: 'Kasa Steril', stok: 56 },
];

const SAMPLE_COLUMNS: ColumnDef<SampleRow>[] = [
  { accessorKey: 'kode', header: 'Kode' },
  { accessorKey: 'nama', header: 'Nama' },
  { accessorKey: 'stok', header: 'Stok' },
];

export const TableDocs: React.FC = () => {
  const [page, setPage] = useState(1);
  return (
    <DocSection
      id="table"
      title="DataTable dan PaginationControls"
      description="DataTable (TanStack Table) untuk tabel dengan sorting, pencarian, dan paginasi di client. Kolom didefinisikan di file <Fitur>Columns.tsx. Untuk paginasi dari server, pakai PaginationControls."
      importPath="import { DataTable } from '@/components/ui/data-table'; import PaginationControls from '@/components/common/PaginationControls';"
    >
      <DocExample
        title="DataTable"
        code={`
const columns: ColumnDef<Product>[] = [
  { accessorKey: 'kode', header: 'Kode' },
  { accessorKey: 'nama', header: 'Nama' },
];

<DataTable columns={columns} data={products} searchable searchPlaceholder="Cari produk..." pageSize={10} />`}
      >
        <div className="w-full">
          <DataTable
            columns={SAMPLE_COLUMNS}
            data={SAMPLE_ROWS}
            searchable
            searchPlaceholder="Cari produk..."
          />
        </div>
      </DocExample>

      <DocExample
        title="PaginationControls (paginasi server)"
        note="isPlaceholderData dari useQuery (keepPreviousData) menonaktifkan tombol selama halaman baru dimuat."
        code={`
<PaginationControls
  currentPage={page}
  totalPages={data.totalPages}
  onPageChange={setPage}
  isPlaceholderData={isPlaceholderData}
/>`}
      >
        <div className="w-full">
          <PaginationControls currentPage={page} totalPages={5} onPageChange={setPage} />
        </div>
      </DocExample>
    </DocSection>
  );
};

export const FeedbackDocs: React.FC = () => {
  const { showToast } = useToast();
  return (
    <DocSection
      id="feedback"
      title="Toast dan status data"
      description="Toast untuk umpan balik singkat setelah aksi. LoadingState, EmptyState, dan ErrorState untuk status query; jangan membuat spinner atau pesan kosong sendiri."
      importPath="import { useToast } from '@/components/ui/toast'; import { LoadingState, EmptyState, ErrorState } from '@/components/common/QueryState';"
    >
      <DocExample
        title="Toast"
        code={`
const { showToast } = useToast();
showToast('Produk berhasil disimpan', 'success'); // success | error | warning | info`}
      >
        {(['success', 'error', 'warning', 'info'] as const).map((type) => (
          <Button
            key={type}
            variant="outline"
            size="sm"
            onClick={() => showToast(`Contoh toast ${type}`, type)}
          >
            {type}
          </Button>
        ))}
      </DocExample>

      <DocExample
        title="LoadingState, EmptyState, ErrorState"
        code={`
if (isPending) return <LoadingState />;
if (isError) return <ErrorState message={error.message} onRetry={refetch} />;
if (data.length === 0)
  return <EmptyState icon={PackageSearch} title="Belum ada produk" description="..." />;`}
      >
        <div className="grid w-full gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-gray-100 dark:border-white/10">
            <LoadingState label="Memuat produk..." />
          </div>
          <div className="rounded-xl border border-gray-100 dark:border-white/10">
            <EmptyState
              icon={PackageSearch}
              title="Belum ada produk"
              description="Tambahkan produk pertama lewat tombol Tambah Produk."
            />
          </div>
          <div className="rounded-xl border border-gray-100 dark:border-white/10">
            <ErrorState onRetry={() => showToast('Mencoba lagi...', 'info')} />
          </div>
        </div>
      </DocExample>
    </DocSection>
  );
};
