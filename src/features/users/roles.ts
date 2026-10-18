import { Pill, ShieldCheck, ShieldPlus, type LucideIcon } from 'lucide-react';
import type { UserRow } from './types';

// Role yang bisa dipilih di halaman manajemen user. 'apoteker' tidak ditampilkan.
// color untuk badge, iconBg/iconColor untuk kartu statistik.
export const ROLE_OPTIONS = [
  {
    value: 'admin',
    label: 'Admin',
    icon: ShieldCheck,
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
    iconBg: 'bg-purple-100 dark:bg-purple-500/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    value: 'farmasi',
    label: 'Farmasi',
    icon: Pill,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    iconBg: 'bg-blue-100 dark:bg-blue-500/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    value: 'nakes',
    label: 'Nakes',
    icon: ShieldPlus,
    color: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
    iconBg: 'bg-green-100 dark:bg-green-500/20',
    iconColor: 'text-green-600 dark:text-green-400',
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

// Role yang tidak dikenal (misalnya 'apoteker') memakai ikon role nakes, seperti sebelumnya
export const getRoleIcon = (role: string): LucideIcon => getRoleOption(role)?.icon ?? ShieldPlus;

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
