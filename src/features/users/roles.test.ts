import { describe, expect, it } from 'vitest';
import { avatarTone, getInitialRoles, getRoleDisplay, isRoleValue, toggleRole } from './roles';

describe('isRoleValue', () => {
  it('mengenali role yang bisa dipilih', () => {
    expect(isRoleValue('admin')).toBe(true);
    expect(isRoleValue('nakes')).toBe(true);
    expect(isRoleValue('apoteker')).toBe(false);
  });
});

describe('getInitialRoles', () => {
  it('memakai role yang dikenal dari user_roles', () => {
    expect(getInitialRoles({ roles: ['admin', 'apoteker', 'nakes'], role: 'admin' })).toEqual([
      'admin',
      'nakes',
    ]);
  });

  it('jatuh ke role profil lalu nakes kalau tidak ada role yang dikenal', () => {
    expect(getInitialRoles({ roles: [], role: 'farmasi' })).toEqual(['farmasi']);
    expect(getInitialRoles({ roles: [], role: null })).toEqual(['nakes']);
  });
});

describe('toggleRole', () => {
  it('menambah dan melepas role', () => {
    expect(toggleRole(['nakes'], 'admin', true)).toEqual(['nakes', 'admin']);
    expect(toggleRole(['nakes', 'admin'], 'nakes', false)).toEqual(['admin']);
  });

  it('tidak melepas role terakhir', () => {
    expect(toggleRole(['nakes'], 'nakes', false)).toEqual(['nakes']);
  });
});

describe('getRoleDisplay', () => {
  it('menampilkan role lama dan role tak dikenal', () => {
    expect(getRoleDisplay('admin')).toMatchObject({ label: 'Admin', tone: 'imun' });
    expect(getRoleDisplay('apoteker')).toEqual({ label: 'Apoteker', tone: 'obat' });
    expect(getRoleDisplay('kasir')).toEqual({ label: 'kasir', tone: 'neutral' });
  });
});

describe('avatarTone', () => {
  it('memberi warna yang sama untuk id yang sama', () => {
    expect(avatarTone('a1b2')).toBe(avatarTone('a1b2'));
    expect(['obat', 'bhp', 'imun', 'alkes']).toContain(avatarTone('xyz'));
  });
});
