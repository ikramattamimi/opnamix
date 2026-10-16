import React from 'react';
import { ROLE_OPTIONS } from '../roles';
import type { UserRow } from '../types';

const StatItem: React.FC<{
  icon: React.ReactNode;
  iconBg: string;
  value: number;
  label: string;
}> = ({ icon, iconBg, value, label }) => (
  <div className="bg-card-light dark:bg-card-dark rounded-2xl p-5 shadow-soft">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-text-primary-light dark:text-white">{value}</p>
        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">{label}</p>
      </div>
    </div>
  </div>
);

// Kartu jumlah pengguna total dan per role
const UserStats: React.FC<{ users: UserRow[] }> = ({ users }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <StatItem
      icon={<span className="material-icons-round text-primary">group</span>}
      iconBg="bg-primary/10"
      value={users.length}
      label="Total Pengguna"
    />
    {ROLE_OPTIONS.map((role) => (
      <StatItem
        key={role.value}
        icon={
          <span
            className={`material-icons-round ${role.value === 'admin' ? 'text-purple-600 dark:text-purple-400' : role.value === 'farmasi' ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'}`}
          >
            {role.value === 'admin'
              ? 'admin_panel_settings'
              : role.value === 'farmasi'
                ? 'medication'
                : 'health_and_safety'}
          </span>
        }
        iconBg={
          role.value === 'admin'
            ? 'bg-purple-100 dark:bg-purple-500/20'
            : role.value === 'farmasi'
              ? 'bg-blue-100 dark:bg-blue-500/20'
              : 'bg-green-100 dark:bg-green-500/20'
        }
        value={users.filter((u) => u.roles.includes(role.value)).length}
        label={role.label}
      />
    ))}
  </div>
);

export default UserStats;
