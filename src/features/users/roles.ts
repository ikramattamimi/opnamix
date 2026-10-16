import type { UserRow } from './types';

// Role yang bisa dipilih di halaman manajemen user. 'apoteker' tidak ditampilkan.
export const ROLE_OPTIONS = [
  {
    value: 'admin',
    label: 'Admin',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
  },
  {
    value: 'farmasi',
    label: 'Farmasi',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  },
  {
    value: 'nakes',
    label: 'Nakes',
    color: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
  },
] as const;

export type RoleOption = (typeof ROLE_OPTIONS)[number];
export type RoleValue = RoleOption['value'];

export const ROLE_VALUES = ROLE_OPTIONS.map((r) => r.value) as [RoleValue, ...RoleValue[]];

export const isRoleValue = (role: string): role is RoleValue => {
  return role === 'admin' || role === 'farmasi' || role === 'nakes';
};

export const getRoleOption = (role: string): RoleOption | undefined =>
  ROLE_OPTIONS.find((r) => r.value === role);

// Role awal form edit: role yang dikenal, atau role lama di profil, atau 'nakes'
export const getInitialRoles = (user: Pick<UserRow, 'roles' | 'role'>): RoleValue[] => {
  const selectedRoles = (user.roles || []).filter(isRoleValue);
  return selectedRoles.length > 0 ? selectedRoles : [(user.role || 'nakes') as RoleValue];
};

// Centang/hapus centang role. Role terakhir tidak bisa dilepas.
export const toggleRole = (roles: RoleValue[], value: RoleValue, checked: boolean): RoleValue[] => {
  if (checked) return roles.includes(value) ? roles : [...roles, value];
  const filtered = roles.filter((r) => r !== value);
  return filtered.length ? filtered : [value];
};
