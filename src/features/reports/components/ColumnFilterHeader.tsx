import type { Column } from '@tanstack/react-table';
import { DataTableColumnFilter } from '@/components/ui/data-table-column-filter';

interface ColumnFilterHeaderProps<TData> {
  column: Column<TData, unknown>;
  label: string;
  title: string;
  options?: { label: string; value: string }[];
}

// Judul kolom laporan dengan filter kolom di bawahnya.
const ColumnFilterHeader = <TData,>({
  column,
  label,
  title,
  options,
}: ColumnFilterHeaderProps<TData>) => (
  <div className="space-y-2">
    <div className="font-bold text-foreground">{label}</div>
    <DataTableColumnFilter column={column} title={title} options={options} />
  </div>
);

export default ColumnFilterHeader;
