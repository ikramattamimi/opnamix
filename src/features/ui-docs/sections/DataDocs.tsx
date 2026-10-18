import React, { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { PackageSearch } from 'lucide-react';
import { Pagination } from '@/components/data/Pagination';
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
  { accessorKey: 'stok', header: 'Stok', meta: { align: 'right' } },
];

export const TableDocs: React.FC = () => {
  const [page, setPage] = useState(3);
  const [selected, setSelected] = useState<string | null>('OBT-002');
  return (
    <DocSection
      id="table"
      title="DataTable dan Pagination"
      description="DataTable (TanStack Table): baris 36px, header menempel, klik judul untuk sort, angka rata kanan dengan meta.align, baris bisa diklik dan ditandai terpilih. Pagination dipakai di semua daftar dan tabel (juga paginasi dari server)."
      importPath="import { DataTable } from '@/components/ui/data-table'; import { Pagination } from '@/components/data/Pagination';"
    >
      <DocExample
        title="DataTable"
        code={`
const columns: ColumnDef<Product>[] = [
  { accessorKey: 'kode', header: 'Kode' },
  { accessorKey: 'stok', header: 'Stok', meta: { align: 'right' } },
];

<DataTable
  columns={columns}
  data={products}
  pageSize={10}
  getRowId={(p) => p.kode}
  selectedRowId={selected}
  onRowClick={(p) => setSelected(p.kode)}
/>`}
      >
        <div className="w-full">
          <DataTable
            columns={SAMPLE_COLUMNS}
            data={SAMPLE_ROWS}
            searchable
            searchPlaceholder="Cari produk..."
            getRowId={(row) => row.kode}
            selectedRowId={selected}
            onRowClick={(row) => setSelected(row.kode)}
          />
        </div>
      </DocExample>

      <DocExample
        title="Pagination"
        note="disabled (mis. isPlaceholderData dari useQuery) menonaktifkan tombol selama halaman baru dimuat. note untuk keterangan ukuran halaman. PaginationControls lama dihapus setelah semua halaman pindah."
        code={`
<Pagination
  page={page}
  pageSize={12}
  total={data.total}
  onPageChange={setPage}
  note="12 per halaman mengikuti lebar layar"
/>`}
      >
        <div className="w-full">
          <Pagination
            page={page}
            pageSize={12}
            total={248}
            onPageChange={setPage}
            note="12 per halaman mengikuti lebar layar"
          />
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
          <div className="rounded-xl border">
            <LoadingState label="Memuat produk..." />
          </div>
          <div className="rounded-xl border">
            <EmptyState
              icon={PackageSearch}
              title="Belum ada produk"
              description="Tambahkan produk pertama lewat tombol Tambah Produk."
            />
          </div>
          <div className="rounded-xl border">
            <ErrorState onRetry={() => showToast('Mencoba lagi...', 'info')} />
          </div>
        </div>
      </DocExample>
    </DocSection>
  );
};
