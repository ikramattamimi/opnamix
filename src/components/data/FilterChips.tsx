import React from 'react';
import { X } from 'lucide-react';

// Chip filter aktif yang bisa dihapus satu per satu
export interface ActiveFilter {
  key: string;
  label: React.ReactNode;
}

export const FilterChips: React.FC<{
  filters: ActiveFilter[];
  onRemove: (key: string) => void;
  onClear?: () => void;
}> = ({ filters, onRemove, onClear }) => {
  if (filters.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {filters.map((filter) => (
        <span
          key={filter.key}
          className="inline-flex h-6 items-center gap-1 rounded-full bg-primary-soft pl-2.5 pr-1 text-xs font-semibold text-primary-ink"
        >
          {filter.label}
          <button
            type="button"
            onClick={() => onRemove(filter.key)}
            aria-label={`Hapus filter ${typeof filter.label === 'string' ? filter.label : ''}`.trim()}
            className="grid size-4.5 place-items-center rounded-full hover:bg-primary/15"
          >
            <X className="size-3" aria-hidden />
          </button>
        </span>
      ))}
      {onClear && filters.length > 1 && (
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-semibold text-primary-ink hover:underline"
        >
          Hapus semua
        </button>
      )}
    </div>
  );
};
