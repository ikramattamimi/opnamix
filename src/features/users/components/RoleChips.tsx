import React from 'react';
import { StatusChip } from '@/components/data/StatusChip';
import { cn } from '@/lib/utils';
import { getRoleDisplay } from '../roles';

// Chip role pengguna. Dipakai di kartu pengguna, panel edit, dan Profil.
export const RoleChips: React.FC<{ roles: string[]; className?: string }> = ({
  roles,
  className,
}) => (
  <span className={cn('flex min-h-5 flex-wrap gap-1', className)}>
    {roles.map((role) => {
      const { label, tone } = getRoleDisplay(role);
      return (
        <StatusChip key={role} tone={tone} plain>
          {label}
        </StatusChip>
      );
    })}
  </span>
);
