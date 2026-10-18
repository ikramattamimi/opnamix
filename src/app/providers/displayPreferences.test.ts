import { describe, expect, it } from 'vitest';

import {
  LEGACY_DARK_MODE_KEY,
  SIZE_STORAGE_KEY,
  THEME_STORAGE_KEY,
  readSizePreference,
  readThemePreference,
  resolveTheme,
} from './displayPreferences';

const storageWith = (values: Record<string, string>) => ({
  getItem: (key: string) => values[key] ?? null,
});

const throwingStorage = {
  getItem: () => {
    throw new Error('diblokir');
  },
};

describe('readThemePreference', () => {
  it('memakai pilihan yang tersimpan', () => {
    expect(readThemePreference(storageWith({ [THEME_STORAGE_KEY]: 'dark' }))).toBe('dark');
    expect(readThemePreference(storageWith({ [THEME_STORAGE_KEY]: 'system' }))).toBe('system');
  });

  it('membaca kunci lama bila pilihan baru belum ada', () => {
    expect(readThemePreference(storageWith({ [LEGACY_DARK_MODE_KEY]: 'true' }))).toBe('dark');
    expect(readThemePreference(storageWith({ [LEGACY_DARK_MODE_KEY]: 'false' }))).toBe('light');
  });

  it('pilihan baru mengalahkan kunci lama', () => {
    const storage = storageWith({ [THEME_STORAGE_KEY]: 'light', [LEGACY_DARK_MODE_KEY]: 'true' });
    expect(readThemePreference(storage)).toBe('light');
  });

  it('jatuh ke Sistem untuk nilai kosong, rusak, atau storage yang melempar error', () => {
    expect(readThemePreference(storageWith({}))).toBe('system');
    expect(readThemePreference(storageWith({ [THEME_STORAGE_KEY]: 'biru' }))).toBe('system');
    expect(readThemePreference(throwingStorage)).toBe('system');
  });
});

describe('readSizePreference', () => {
  it('hanya "besar" yang mengaktifkan ukuran Besar', () => {
    expect(readSizePreference(storageWith({ [SIZE_STORAGE_KEY]: 'besar' }))).toBe('besar');
    expect(readSizePreference(storageWith({ [SIZE_STORAGE_KEY]: 'raksasa' }))).toBe('standar');
    expect(readSizePreference(throwingStorage)).toBe('standar');
  });
});

describe('resolveTheme', () => {
  it('mengikuti sistem hanya untuk pilihan Sistem', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });
});
