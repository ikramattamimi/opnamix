// Logika murni untuk Pagination dan ResponsiveGrid (diuji tanpa DOM).

export type PageItem = number | 'gap';

// Nomor halaman yang ditampilkan: pertama, terakhir, dan tetangga halaman aktif
export function pageItems(current: number, pages: number): PageItem[] {
  const items: PageItem[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - current) <= 1) items.push(i);
    else if (items[items.length - 1] !== 'gap') items.push('gap');
  }
  return items;
}

export function pageRange(page: number, pageSize: number, total: number) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pages);
  const from = total ? (current - 1) * pageSize + 1 : 0;
  const to = Math.min(total, current * pageSize);
  return { pages, current, from, to };
}

// Kolom dari lebar wadah supaya baris terakhir tetap penuh. Ukuran halaman =
// kolom × baris; kolom sedikit (HP) mendapat baris tambahan.
export function gridLayout(width: number, minItemWidth: number, rows: number, gap = 10) {
  const cols = Math.max(1, Math.floor((width + gap) / (minItemWidth + gap)));
  const r = cols === 1 ? rows + 3 : cols === 2 ? rows + 1 : rows;
  return { cols, rows: r, pageSize: cols * r };
}
