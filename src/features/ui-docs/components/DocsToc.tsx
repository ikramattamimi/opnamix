import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface TocItem {
  id: string;
  label: string;
}

// Bagian yang sedang dibaca: bagian terakhir yang judulnya sudah lewat
// garis sedikit di bawah header sticky.
const useActiveSection = (ids: string[]) => {
  const [activeId, setActiveId] = useState(ids[0]);

  useEffect(() => {
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        });
        const first = ids.find((id) => visible.has(id));
        if (first) setActiveId(first);
      },
      // Abaikan area di bawah header (atas) dan separuh bawah layar
      { rootMargin: '-120px 0px -55% 0px' },
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids]);

  return activeId;
};

const scrollToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// Deretan tombol di atas konten, untuk layar sempit
export const DocsTocInline: React.FC<{ items: TocItem[] }> = ({ items }) => (
  <nav aria-label="Daftar komponen" className="flex flex-wrap gap-2">
    {items.map(({ id, label }) => (
      <button
        key={id}
        type="button"
        onClick={() => scrollToSection(id)}
        className="rounded-lg border bg-card px-3 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-primary"
      >
        {label}
      </button>
    ))}
  </nav>
);

// Kolom kanan yang menempel di bawah header, dengan penanda bagian aktif
export const DocsTocSidebar: React.FC<{ items: TocItem[] }> = ({ items }) => {
  const ids = React.useMemo(() => items.map((item) => item.id), [items]);
  const activeId = useActiveSection(ids);

  return (
    <nav
      aria-label="Daftar komponen"
      className="sticky top-below-header max-h-[calc(100vh-10rem)] overflow-y-auto"
    >
      <p className="mb-3 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Komponen
      </p>
      <ul className="space-y-0.5 border-l border-border">
        {items.map(({ id, label }) => {
          const isActive = id === activeId;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => scrollToSection(id)}
                aria-current={isActive ? 'location' : undefined}
                className={cn(
                  '-ml-px w-full border-l-2 px-3 py-1.5 text-left text-sm transition-colors',
                  isActive
                    ? 'border-primary font-bold text-primary'
                    : 'border-transparent text-muted-foreground hover:border-border-strong hover:text-foreground',
                )}
              >
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
