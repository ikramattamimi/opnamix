import React from 'react';
import { getRoleOption } from '../roles';

const roleIconName = (role: string) =>
  role === 'admin'
    ? 'admin_panel_settings'
    : role === 'farmasi'
      ? 'medication'
      : 'health_and_safety';

const RoleBadges: React.FC<{ roles: string[] }> = ({ roles }) => (
  <div className="flex flex-wrap items-center gap-1.5">
    {roles.map((role) => {
      const opt = getRoleOption(role);
      return (
        <span
          key={role}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${opt?.color || 'bg-gray-100 text-gray-600'}`}
        >
          <span className="material-icons-round text-xs">{roleIconName(role)}</span>
          {opt?.label || role}
        </span>
      );
    })}
  </div>
);

export default RoleBadges;
