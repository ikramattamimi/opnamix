import React, { useId, useMemo, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { StatusChip } from '@/components/data/StatusChip';
import { cn } from '@/lib/utils';
import { addTags, matchSuggestions, parseTag, renameTag, tagState, type TagItem } from './tagList';

// Daftar tag dengan isian sekunder per tag (mis. zat + kekuatan).
// - Enter atau koma menambah tag; teks dipisah koma/baris bisa ditempel sekaligus.
// - Saran diambil dari `suggestions`; panah atas/bawah memilih, Enter menambah.
// - Nama yang belum dikenal tapi mirip saran diberi tanda "Mungkin maksudnya …?";
//   yang benar-benar baru diberi label "baru".
// - Backspace di isian kosong menghapus tag terakhir.
// Di dalam Field, id dan aria-* diteruskan ke isian ketik.

export type { TagItem } from './tagList';

type InputAttrs = Pick<
  React.InputHTMLAttributes<HTMLInputElement>,
  'id' | 'aria-invalid' | 'aria-describedby' | 'aria-required' | 'disabled'
>;

export interface TagInputProps extends InputAttrs {
  value: TagItem[];
  onChange: (tags: TagItem[]) => void;
  suggestions?: readonly string[];
  placeholder?: string;
  /** Label isian ketik untuk pembaca layar bila tidak di dalam Field */
  label?: string;
  /** Placeholder isian sekunder; kosongkan untuk menyembunyikan isian itu */
  secondaryPlaceholder?: string;
  /** Pengurai teks menjadi tag. Bawaan: bagian berangka menjadi isian sekunder */
  parse?: (text: string) => TagItem;
  className?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  value,
  onChange,
  suggestions = [],
  placeholder = 'Ketik lalu Enter',
  label,
  secondaryPlaceholder,
  parse = parseTag,
  className,
  id,
  disabled,
  ...aria
}) => {
  const autoId = useId();
  const inputId = id ?? autoId;
  const listId = `${inputId}-list`;
  const [text, setText] = useState('');
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);

  const matches = useMemo(
    () => matchSuggestions(parse(text).value, suggestions, value),
    [parse, text, suggestions, value],
  );
  const showList = open && matches.length > 0;

  const commit = (raw: string) => {
    if (!raw.trim()) return;
    onChange(addTags(value, raw, suggestions, parse));
    setText('');
    setActive(0);
  };

  // Pilih saran: pertahankan isian sekunder yang sudah diketik ("para 500" → Paracetamol 500)
  const pick = (name: string) => {
    const typed = parse(text);
    commit(typed.secondary ? `${name} ${typed.secondary}` : name);
  };

  const update = (index: number, patch: Partial<TagItem>) =>
    onChange(value.map((tag, i) => (i === index ? { ...tag, ...patch } : tag)));

  const remove = (index: number) => onChange(value.filter((_, i) => i !== index));

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (showList && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((i) => (i + step + matches.length) % matches.length);
    } else if (event.key === 'Enter' || event.key === ',') {
      if (!text.trim()) return;
      event.preventDefault();
      if (showList && event.key === 'Enter') pick(matches[active]);
      else commit(text);
    } else if (event.key === 'Escape' && showList) {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === 'Backspace' && !text && value.length) {
      remove(value.length - 1);
    }
  };

  const onPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text');
    if (/[,;\n]/.test(pasted)) {
      event.preventDefault();
      commit(text + pasted);
    }
  };

  return (
    <div
      className={cn(
        'relative flex flex-col gap-1 rounded-control border border-input bg-card p-1 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/25',
        aria['aria-invalid'] && 'border-bad',
        disabled && 'opacity-50',
        className,
      )}
    >
      {value.length > 0 && (
        <ul className="flex flex-col gap-1" aria-label="Daftar tag">
          {value.map((tag, index) => {
            const state = suggestions.length ? tagState(tag.value, suggestions) : null;
            return (
              <li
                key={`${tag.value}-${index}`}
                className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-1.5 rounded-md bg-surface-2 py-0.5 pl-2 pr-0.5"
              >
                <span className="flex min-w-0 flex-col items-start gap-0.5 py-0.5 text-meta font-medium">
                  <span className="max-w-full truncate">{tag.value}</span>
                  {state?.kind === 'typo' && (
                    <button
                      type="button"
                      onClick={() => onChange(renameTag(value, index, state.suggestion))}
                      title={`Ganti ke ${state.suggestion}`}
                      disabled={disabled}
                      className="inline-flex min-h-5 max-w-full items-center gap-1 rounded-xl bg-warn-soft px-2 py-0.5 text-left text-2xs font-semibold text-warn hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-3 [&_svg]:shrink-0"
                    >
                      <Sparkles aria-hidden />
                      <span>Mungkin maksudnya {state.suggestion}?</span>
                    </button>
                  )}
                  {state?.kind === 'new' && (
                    <StatusChip tone="info" plain>
                      baru
                    </StatusChip>
                  )}
                </span>
                {secondaryPlaceholder !== undefined ? (
                  <input
                    value={tag.secondary}
                    onChange={(event) => update(index, { secondary: event.target.value })}
                    placeholder={secondaryPlaceholder}
                    aria-label={`${secondaryPlaceholder} ${tag.value}`}
                    disabled={disabled}
                    className="h-6.5 w-24 rounded-md border border-input bg-card px-2 text-xs text-foreground placeholder:text-faint focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
                  />
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`Hapus ${tag.value}`}
                  disabled={disabled}
                  className="grid size-6.5 place-items-center rounded-md text-muted-foreground hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-3.5"
                >
                  <X aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <input
        id={inputId}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList ? `${listId}-${active}` : undefined}
        aria-label={label}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setOpen(false);
          // Teks yang ditinggalkan tetap menjadi tag
          if (text.trim()) commit(text);
        }}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        className="h-7 min-w-0 bg-transparent px-1.5 text-meta text-foreground outline-none placeholder:text-faint"
        {...aria}
      />

      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Saran"
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-control border bg-popover p-1 text-popover-foreground shadow-float"
        >
          {matches.map((name, index) => (
            <li
              key={name}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              // mousedown supaya isian tidak blur lebih dulu
              onMouseDown={(event) => {
                event.preventDefault();
                pick(name);
              }}
              onMouseEnter={() => setActive(index)}
              className={cn(
                'cursor-pointer truncate rounded-md px-2 py-1.5 text-meta',
                index === active && 'bg-surface-2 text-foreground',
              )}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
