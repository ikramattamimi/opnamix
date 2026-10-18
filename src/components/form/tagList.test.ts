import { describe, expect, it } from 'vitest';
import { addTags, matchSuggestions, parseTag, renameTag, splitTagText, tagState } from './tagList';

const KNOWN = ['Paracetamol', 'Ibuprofen', 'Ambroxol HCl', 'Chlorphenamine maleate'];

describe('splitTagText', () => {
  it('memisah per koma, titik koma, dan baris baru', () => {
    expect(splitTagText('Paracetamol, Kafein;\nVitamin B1 , ')).toEqual([
      'Paracetamol',
      'Kafein',
      'Vitamin B1',
    ]);
  });
});

describe('parseTag', () => {
  it('mengambil bagian berangka sebagai isian sekunder', () => {
    expect(parseTag('Paracetamol 120 mg/5 ml')).toEqual({
      value: 'Paracetamol',
      secondary: '120 mg/5 ml',
    });
    expect(parseTag('Vitamin B1')).toEqual({ value: 'Vitamin B1', secondary: '' });
  });
});

describe('addTags', () => {
  it('menambah banyak tag dari teks tempelan dan memakai ejaan saran', () => {
    expect(addTags([], 'paracetamol 500 mg, Kafein', KNOWN)).toEqual([
      { value: 'Paracetamol', secondary: '500 mg' },
      { value: 'Kafein', secondary: '' },
    ]);
  });

  it('melewati nama yang sudah ada', () => {
    const tags = [{ value: 'Paracetamol', secondary: '' }];
    expect(addTags(tags, 'PARACETAMOL 650 mg', KNOWN)).toEqual(tags);
  });
});

describe('tagState', () => {
  it('membedakan zat dikenal, salah ketik, dan baru', () => {
    expect(tagState('paracetamol', KNOWN)).toEqual({ kind: 'known' });
    expect(tagState('Paracetamool', KNOWN)).toEqual({ kind: 'typo', suggestion: 'Paracetamol' });
    expect(tagState('Kafein', KNOWN)).toEqual({ kind: 'new' });
  });
});

describe('matchSuggestions', () => {
  it('mendahulukan awalan dan tidak menyarankan tag yang sudah dipilih', () => {
    expect(matchSuggestions('am', KNOWN, [])).toEqual([
      'Ambroxol HCl',
      'Paracetamol',
      'Chlorphenamine maleate',
    ]);
    expect(matchSuggestions('am', KNOWN, [{ value: 'ambroxol hcl', secondary: '' }])).toEqual([
      'Paracetamol',
      'Chlorphenamine maleate',
    ]);
    expect(matchSuggestions('  ', KNOWN, [])).toEqual([]);
  });
});

describe('renameTag', () => {
  it('mengganti nama, atau menggabungkan bila nama sudah ada', () => {
    const tags = [
      { value: 'Paracetamol', secondary: '' },
      { value: 'Paracetamool', secondary: '650 mg' },
      { value: 'Kafein', secondary: '' },
    ];
    expect(renameTag(tags, 2, 'Caffeine')[2]).toEqual({ value: 'Caffeine', secondary: '' });
    expect(renameTag(tags, 1, 'Paracetamol')).toEqual([
      { value: 'Paracetamol', secondary: '650 mg' },
      { value: 'Kafein', secondary: '' },
    ]);
  });
});
