import React from 'react';
import { Badge } from '@/components/ui/badge';
import { getRoleIcon, getRoleOption } from '../roles';

const RoleBadges: React.FC<{ roles: string[] }> = ({ roles }) => (
  <div className="flex flex-wrap items-center gap-1.5">
    {roles.map((role) => {
      const opt = getRoleOption(role);
      const Icon = getRoleIcon(role);
      return (
        <Badge
          key={role}
          variant="outline"
          className={`gap-1 border-transparent px-2.5 py-1 rounded-full text-xs font-bold ${opt?.color || 'bg-gray-100 text-gray-600'}`}
        >
          <Icon className="size-3" aria-hidden />
          {opt?.label || role}
        </Badge>
      );
    })}
  </div>
);

export default RoleBadges;
