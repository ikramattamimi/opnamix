import { describe, expect, it } from 'vitest';
import { gridLayout, pageItems, pageRange } from './pagination';

describe('pageItems', () => {
  it('menampilkan semua halaman bila sedikit', () => {
    expect(pageItems(2, 4)).toEqual([1, 2, 3, 4]);
  });
  it('memakai elipsis di kiri dan kanan', () => {
    expect(pageItems(5, 10)).toEqual([1, 'gap', 4, 5, 6, 'gap', 10]);
    expect(pageItems(1, 10)).toEqual([1, 2, 'gap', 10]);
  });
});

describe('pageRange', () => {
  it('menghitung rentang dan membatasi halaman', () => {
    expect(pageRange(2, 10, 25)).toEqual({ pages: 3, current: 2, from: 11, to: 20 });
    expect(pageRange(9, 10, 25)).toEqual({ pages: 3, current: 3, from: 21, to: 25 });
    expect(pageRange(1, 10, 0)).toEqual({ pages: 1, current: 1, from: 0, to: 0 });
  });
});

describe('gridLayout', () => {
  it('kolom dari lebar wadah, baris tambahan untuk kolom sedikit', () => {
    expect(gridLayout(1000, 208, 3)).toEqual({ cols: 4, rows: 3, pageSize: 12 });
    expect(gridLayout(430, 208, 3)).toEqual({ cols: 2, rows: 4, pageSize: 8 });
    expect(gridLayout(300, 208, 3)).toEqual({ cols: 1, rows: 6, pageSize: 6 });
  });
});
