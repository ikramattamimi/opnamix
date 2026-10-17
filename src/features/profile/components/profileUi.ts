import { Pill, ShieldCheck, ShieldPlus, type LucideIcon } from 'lucide-react';

export interface RoleInfo {
  label: string;
  color: string;
  icon: LucideIcon;
}

const ROLE_LABELS: Record<string, RoleInfo> = {
  admin: {
    label: 'Admin',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
    icon: ShieldCheck,
  },
  apoteker: {
    label: 'Farmasi',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    icon: Pill,
  },
  farmasi: {
    label: 'Farmasi',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    icon: Pill,
  },
  nakes: {
    label: 'Nakes',
    color: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
    icon: ShieldPlus,
  },
};

// Role utama untuk tampilan: admin > apoteker > farmasi > nakes
export function getRoleInfo(userRoles: string[]): RoleInfo {
  const primaryRole = userRoles.includes('admin')
    ? 'admin'
    : userRoles.includes('apoteker')
      ? 'apoteker'
      : userRoles.includes('farmasi')
        ? 'farmasi'
        : userRoles.includes('nakes')
          ? 'nakes'
          : userRoles[0] || 'nakes';
  return ROLE_LABELS[primaryRole] || ROLE_LABELS.nakes;
}

// Warna ikon role di kolom "Role" (berbeda dari badge di header)
export function getRoleIconColor(userRoles: string[]): string {
  if (userRoles.includes('admin')) return 'text-purple-500';
  if (userRoles.includes('apoteker') || userRoles.includes('farmasi')) return 'text-blue-500';
  return 'text-green-500';
}

export const FIELD_LABEL_CLASS = 'text-xs font-bold uppercase text-muted-foreground';
// Ukuran, warna, dan fokus mengikuti input manual sebelumnya
export const FIELD_INPUT_CLASS =
  'h-auto w-full px-4 py-2.5 rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-background text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/30 transition-all';
