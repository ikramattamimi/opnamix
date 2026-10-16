import React from 'react';
import { ROLE_OPTIONS, toggleRole, type RoleValue } from '../roles';

interface RoleCheckboxesProps {
  value: RoleValue[];
  onChange: (roles: RoleValue[]) => void;
}

// Daftar centang role. Belum ada ui/checkbox, jadi tetap pakai input checkbox bawaan.
const RoleCheckboxes: React.FC<RoleCheckboxesProps> = ({ value, onChange }) => (
  <div className="space-y-2">
    {ROLE_OPTIONS.map((opt) => (
      <label
        key={opt.value}
        className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-700/20 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors"
      >
        <input
          type="checkbox"
          checked={value.includes(opt.value)}
          onChange={(e) => onChange(toggleRole(value, opt.value, e.target.checked))}
          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30"
        />
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${opt.color}`}
        >
          {opt.label}
        </span>
      </label>
    ))}
  </div>
);

export default RoleCheckboxes;
