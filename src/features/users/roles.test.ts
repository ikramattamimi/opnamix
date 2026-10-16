import { describe, expect, it } from 'vitest';
import { getInitialRoles, isRoleValue, toggleRole } from './roles';

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
