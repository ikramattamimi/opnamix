import React from 'react';
import { Users, type LucideIcon } from 'lucide-react';
import { ROLE_OPTIONS } from '../roles';
import type { UserRow } from '../types';

const StatItem: React.FC<{
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  value: number;
  label: string;
}> = ({ icon: Icon, iconBg, iconColor, value, label }) => (
  <div className="bg-card rounded-2xl p-5 shadow-soft">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
        <Icon className={`size-6 ${iconColor}`} aria-hidden />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  </div>
);

// Kartu jumlah pengguna total dan per role
const UserStats: React.FC<{ users: UserRow[] }> = ({ users }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <StatItem
      icon={Users}
      iconBg="bg-primary/10"
      iconColor="text-primary"
      value={users.length}
      label="Total Pengguna"
    />
    {ROLE_OPTIONS.map((role) => (
      <StatItem
        key={role.value}
        icon={role.icon}
        iconBg={role.iconBg}
        iconColor={role.iconColor}
        value={users.filter((u) => u.roles.includes(role.value)).length}
        label={role.label}
      />
    ))}
  </div>
);

export default UserStats;
