import type { ReactNode } from 'react';

// Grup untuk GroupedList: judul (hari/bulan) dan item-itemnya.
export interface ListGroup<T> {
  key: string;
  label: ReactNode;
  items: T[];
}

// Kelompokkan item per hari (urutan item dipertahankan)
export function groupByDay<T>(
  items: T[],
  getDate: (item: T) => Date,
  label: (date: Date) => string,
): ListGroup<T>[] {
  const groups: ListGroup<T>[] = [];
  for (const item of items) {
    const date = getDate(item);
    const key = date.toDateString();
    const last = groups[groups.length - 1];
    if (last?.key === key) last.items.push(item);
    else groups.push({ key, label: label(date), items: [item] });
  }
  return groups;
}
