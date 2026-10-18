import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CornerDownLeft, Search, type LucideIcon } from 'lucide-react';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { useAuth } from '@/features/auth/useAuth';
import { APP_ROUTES } from '@/app/routes';
import { canAccessRoute, getUserRoles } from '@/app/routeUtils';
import { ROUTES } from '@/types/routes';
import { cn } from '@/lib/utils';

// Kotak cari di header: lompat ke halaman mana pun yang boleh dibuka pengguna.
// Ctrl/⌘ K memfokuskan kotak dari mana saja. Pencarian data (produk, nota)
// tetap di halaman masing-masing.

interface SearchItem {
  path: string;
  label: string;
  hint: string;
  icon?: LucideIcon;
}

function buildItems(userRoles: readonly string[]): SearchItem[] {
  return APP_ROUTES.filter(
    (route) =>
      (route.showInSidebar || route.path === ROUTES.PROFIL) && canAccessRoute(route, userRoles),
  ).map((route) => ({
    path: route.path,
    label: route.sidebar?.label ?? route.title,
    hint: route.sidebar?.group ?? route.title,
    icon: route.sidebar?.icon,
  }));
}

const normalize = (text: string) => text.toLocaleLowerCase('id-ID').trim();

export const GlobalSearch: React.FC<{ className?: string }> = ({ className }) => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const items = useMemo(() => buildItems(getUserRoles(userProfile)), [userProfile]);
  const results = useMemo(() => {
    const q = normalize(query);
    if (!q) return items;
    return items.filter((item) => normalize(`${item.label} ${item.hint}`).includes(q));
  }, [items, query]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const choose = (item: SearchItem | undefined) => {
    if (!item) return;
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
    navigate(item.path);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      choose(results[active]);
    } else if (event.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <Popover open={open && results.length > 0} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <label
          className={cn(
            'flex h-8 w-64 items-center gap-2 rounded-full border border-glass-line bg-glass pl-2.5 pr-1.5 text-on-grad-2 focus-within:bg-glass-2',
            className,
          )}
        >
          <Search className="size-3.5 shrink-0" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Cari menu…"
            aria-label="Cari menu Opnamix"
            role="combobox"
            aria-expanded={open && results.length > 0}
            aria-controls={listId}
            aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-xs text-on-grad outline-none placeholder:text-on-grad-3"
          />
          <kbd className="rounded-md border border-glass-line bg-glass px-1.5 font-mono text-2xs text-on-grad-2">
            Ctrl K
          </kbd>
        </label>
      </PopoverAnchor>
      <PopoverContent
        data-header-popover=""
        align="start"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          if (event.target instanceof Node && inputRef.current?.contains(event.target)) {
            event.preventDefault();
          }
        }}
        className="w-[var(--radix-popover-trigger-width)] min-w-64 p-1"
      >
        <ul id={listId} role="listbox" aria-label="Hasil pencarian menu">
          {results.map((item, index) => {
            const Icon = item.icon;
            return (
              <li
                key={item.path}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                onMouseEnter={() => setActive(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(item)}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-meta aria-selected:bg-surface-2"
              >
                {Icon && <Icon className="size-4 text-muted-foreground" aria-hidden />}
                <span className="flex-1 truncate">{item.label}</span>
                <span className="text-xs text-muted-foreground">{item.hint}</span>
                {index === active && (
                  <CornerDownLeft className="size-3.5 text-muted-foreground" aria-hidden />
                )}
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
};
