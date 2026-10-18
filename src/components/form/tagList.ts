import { closestMatch } from '@/lib/text';

// Logika murni TagInput (diuji tanpa DOM).

export interface TagItem {
  value: string;
  /** Isian sekunder per tag, mis. kekuatan zat. Boleh kosong. */
  secondary: string;
}

const key = (text: string) => text.trim().toLocaleLowerCase('id-ID');

// Pisah teks yang diketik atau ditempel: koma, titik koma, atau baris baru
export const splitTagText = (text: string) =>
  text
    .split(/[,;\n]/)
    .map((part) => part.trim())
    .filter(Boolean);

// "Paracetamol 500 mg" → nilai "Paracetamol", sekunder "500 mg".
// Bagian yang diawali angka dianggap isian sekunder.
export function parseTag(text: string): TagItem {
  const match = text.trim().match(/^(.*?)\s+(\d.*)$/);
  return match
    ? { value: match[1].trim(), secondary: match[2].trim() }
    : { value: text.trim(), secondary: '' };
}

// Nama yang sama persis (tanpa beda huruf besar) dengan saran memakai ejaan saran
export const findKnown = (value: string, known: readonly string[]) =>
  known.find((k) => key(k) === key(value));

// Tambahkan tag dari teks. Nama yang sudah ada di daftar dilewati.
export function addTags(
  tags: readonly TagItem[],
  text: string,
  known: readonly string[] = [],
  parse: (text: string) => TagItem = parseTag,
): TagItem[] {
  const next = [...tags];
  for (const part of splitTagText(text)) {
    const tag = parse(part);
    if (!tag.value || next.some((t) => key(t.value) === key(tag.value))) continue;
    next.push({ ...tag, value: findKnown(tag.value, known) ?? tag.value });
  }
  return next;
}

export type TagState = { kind: 'known' } | { kind: 'typo'; suggestion: string } | { kind: 'new' };

// Nama yang belum dikenal tapi mirip saran kemungkinan salah ketik
export function tagState(value: string, known: readonly string[], maxDistance = 3): TagState {
  if (findKnown(value, known)) return { kind: 'known' };
  const suggestion = closestMatch(value, known, maxDistance);
  return suggestion ? { kind: 'typo', suggestion } : { kind: 'new' };
}

// Saran yang cocok dengan ketikan: awalan lebih dulu, lalu yang memuat ketikan
export function matchSuggestions(
  query: string,
  known: readonly string[],
  exclude: readonly TagItem[],
  limit = 6,
): string[] {
  const q = key(query);
  if (!q) return [];
  const taken = new Set(exclude.map((t) => key(t.value)));
  const pool = known.filter((k) => !taken.has(key(k)));
  const starts = pool.filter((k) => key(k).startsWith(q));
  const contains = pool.filter((k) => !key(k).startsWith(q) && key(k).includes(q));
  return [...starts, ...contains].slice(0, limit);
}

// Ganti nama satu tag (mis. memperbaiki salah ketik). Kalau nama baru sudah
// ada, kedua tag digabung: isian sekunder yang kosong diisi dari tag ini.
export function renameTag(tags: readonly TagItem[], index: number, value: string): TagItem[] {
  const other = tags.findIndex((t, i) => i !== index && key(t.value) === key(value));
  if (other === -1) return tags.map((t, i) => (i === index ? { ...t, value } : t));
  return tags
    .map((t, i) =>
      i === other && !t.secondary.trim() ? { ...t, secondary: tags[index].secondary } : t,
    )
    .filter((_, i) => i !== index);
}
