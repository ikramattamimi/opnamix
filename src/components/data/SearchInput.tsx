import React, { useEffect, useRef } from 'react';
import { Search, X, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Kbd } from './Kbd';

// Kotak cari di daftar. Tombol "/" memfokuskan kotak ini (kecuali sedang mengetik
// di isian lain). Dengan onEnter, Enter menjalankan aksi, mis. menambah hasil
// teratas (atau hasil scan barcode) ke keranjang POS.

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  /** Aktifkan pintasan "/" */
  shortcut?: boolean;
  onEnter?: () => void;
  /** Bawaan: kaca pembesar; POS memakai ikon scan */
  icon?: LucideIcon;
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
  onEnter,
  icon: Icon = Search,
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
      <Icon className="size-4 shrink-0" aria-hidden />
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && onEnter) {
            event.preventDefault();
            onEnter();
          }
        }}
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
        shortcut && <Kbd>/</Kbd>
      )}
    </label>
  );
};
