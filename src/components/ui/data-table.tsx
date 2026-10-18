import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  RowData,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { SearchInput } from '@/components/data/SearchInput';
import { Pagination } from '@/components/data/Pagination';
import { EmptyState } from '@/components/common/QueryState';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';

// Tabel data (TanStack Table): baris 36px, header menempel di dalam area gulir,
// sort per kolom (klik judul berupa teks), angka rata kanan lewat
// `meta: { align: 'right' }`, baris bisa diklik dan ditandai terpilih.

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- parameter wajib sama dengan deklarasi asli
  interface ColumnMeta<TData extends RowData, TValue> {
    align?: 'left' | 'right' | 'center';
  }
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Aktifkan paginasi di client dengan ukuran halaman ini. Paginasi diterapkan
   *  SETELAH filter kolom, jadi jumlah halaman selalu sesuai hasil filter. */
  pageSize?: number;
  onRowClick?: (row: TData) => void;
  getRowId?: (row: TData) => string;
  selectedRowId?: string | null;
  /** Tinggi maksimum area gulir (mis. "28rem"); header menempel di dalamnya */
  maxHeight?: string;
  emptyMessage?: string;
}

const ALIGN = { left: 'text-left', right: 'text-right tabular-nums', center: 'text-center' };

export function DataTable<TData, TValue>({
  columns,
  data,
  searchable = false,
  searchPlaceholder = 'Cari…',
  pageSize,
  onRowClick,
  getRowId,
  selectedRowId,
  maxHeight,
  emptyMessage = 'Tidak ada data.',
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [pageIndex, setPageIndex] = React.useState(0);

  const hasPagination = pageSize !== undefined;

  const table = useReactTable({
    data,
    columns,
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    ...(hasPagination && { getPaginationRowModel: getPaginationRowModel() }),
    state: {
      sorting,
      columnFilters,
      globalFilter,
      ...(hasPagination && { pagination: { pageIndex, pageSize } }),
    },
  });

  // Filter berubah: kembali ke halaman pertama supaya tidak tertinggal di
  // halaman yang sudah tidak ada.
  React.useEffect(() => setPageIndex(0), [columnFilters, globalFilter]);

  const filteredTotal = table.getFilteredRowModel().rows.length;
  const rows = table.getRowModel().rows;

  return (
    <div className="flex flex-col gap-3">
      {searchable && (
        <SearchInput
          value={globalFilter}
          onChange={setGlobalFilter}
          placeholder={searchPlaceholder}
          shortcut={false}
        />
      )}
      <div className="w-full overflow-auto" style={maxHeight ? { maxHeight } : undefined}>
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const align = header.column.columnDef.meta?.align ?? 'left';
                  const rendered = header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext());
                  // Judul berupa teks bisa diklik untuk sort; judul kustom (filter) dibiarkan
                  const sortable =
                    header.column.getCanSort() &&
                    typeof header.column.columnDef.header === 'string';
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      className={ALIGN[align]}
                      aria-sort={
                        sorted === 'asc'
                          ? 'ascending'
                          : sorted === 'desc'
                            ? 'descending'
                            : undefined
                      }
                    >
                      {sortable ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className={cn(
                            'inline-flex items-center gap-1 rounded hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            align === 'right' && 'flex-row-reverse',
                            sorted && 'text-foreground',
                          )}
                        >
                          {rendered}
                          {sorted === 'asc' ? (
                            <ArrowUp className="size-3" aria-hidden />
                          ) : sorted === 'desc' ? (
                            <ArrowDown className="size-3" aria-hidden />
                          ) : (
                            <ChevronsUpDown className="size-3 opacity-50" aria-hidden />
                          )}
                        </button>
                      ) : (
                        rendered
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row) => {
                const selected = selectedRowId != null && row.id === selectedRowId;
                return (
                  <TableRow
                    key={row.id}
                    data-state={selected || row.getIsSelected() ? 'selected' : undefined}
                    aria-selected={onRowClick ? selected : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                    onKeyDown={
                      onRowClick
                        ? (event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              onRowClick(row.original);
                            }
                          }
                        : undefined
                    }
                    className={cn(
                      'group',
                      onRowClick &&
                        'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={ALIGN[cell.column.columnDef.meta?.align ?? 'left']}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length}>
                  <EmptyState title={emptyMessage} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {hasPagination && (
        <Pagination
          page={pageIndex + 1}
          pageSize={pageSize}
          total={filteredTotal}
          onPageChange={(page) => setPageIndex(page - 1)}
        />
      )}
    </div>
  );
}
