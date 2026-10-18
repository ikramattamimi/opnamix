import React, { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Kotak cari di daftar. Tombol "/" memfokuskan kotak ini (kecuali sedang mengetik
// di isian lain).

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  /** Aktifkan pintasan "/" */
  shortcut?: boolean;
  className?: string;
}

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Cari…',
  label,
  shortcut = true,
  className,
}) => {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!shortcut) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === '/' && !isTyping(event.target) && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shortcut]);

  return (
    <label
      className={cn(
        'flex h-8 min-w-0 max-w-[22.5rem] flex-[1_1_13.75rem] items-center gap-2 rounded-lg border border-input bg-card px-2.5 text-faint focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/25',
        className,
      )}
    >
      <Search className="size-4 shrink-0" aria-hidden />
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        className="min-w-0 flex-1 bg-transparent text-meta text-foreground outline-none placeholder:text-faint [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            onChange('');
            ref.current?.focus();
          }}
          aria-label="Hapus pencarian"
          className="grid size-5 place-items-center rounded text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      ) : (
        shortcut && (
          <kbd className="rounded-md border bg-surface-2 px-1.5 font-mono text-2xs text-muted-foreground">
            /
          </kbd>
        )
      )}
    </label>
  );
};
