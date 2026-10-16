import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { UserRow } from '../types';
import RoleBadges from './RoleBadges';
import UserAvatar from './UserAvatar';

interface UserTableProps {
  users: UserRow[];
  isLoading: boolean;
  onEdit: (user: UserRow) => void;
  onResetPassword: (user: UserRow) => void;
  onDelete: (user: UserRow) => void;
}

const formatCreatedAt = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '-';

// Filter cari/role dan tabel pengguna
const UserTable: React.FC<UserTableProps> = ({
  users,
  isLoading,
  onEdit,
  onResetPassword,
  onDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('Semua');

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'Semua' || u.roles.includes(filterRole);
    return matchesSearch && matchesRole;
  });

  return (
    <>
      {/* Filter Bar */}
      <div className="bg-card-light dark:bg-card-dark rounded-2xl p-4 shadow-soft flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary-light text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Cari nama atau email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-background-dark text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-background-dark text-sm px-4 py-2.5 focus:ring-2 focus:ring-primary/30"
        >
          <option value="Semua">Semua Role</option>
          <option value="admin">Admin</option>
          <option value="farmasi">Farmasi</option>
          <option value="nakes">Nakes</option>
        </select>
      </div>

      {/* User Table */}
      <div className="bg-card-light dark:bg-card-dark rounded-2xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-white/5">
              <tr className="text-xs uppercase font-bold text-text-secondary-light dark:text-text-secondary-dark">
                <th className="px-6 py-4">Pengguna</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Dibuat</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <span className="material-icons-round text-primary text-3xl animate-spin">
                      refresh
                    </span>
                    <p className="mt-2 text-sm text-text-secondary-light">Memuat data...</p>
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar user={user} />
                        <div>
                          <p className="font-bold text-text-primary-light dark:text-white">
                            {user.full_name || '-'}
                          </p>
                          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadges roles={user.roles} />
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                      {formatCreatedAt(user.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(user)}
                          className="h-8 w-8 text-text-secondary-light hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <span className="material-icons-round text-base">edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onResetPassword(user)}
                          className="h-8 w-8 text-text-secondary-light hover:text-amber-500 transition-colors"
                          title="Reset Password"
                        >
                          <span className="material-icons-round text-base">lock_reset</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(user)}
                          className="h-8 w-8 text-text-secondary-light hover:text-red-500 transition-colors"
                          title="Hapus"
                        >
                          <span className="material-icons-round text-base">delete</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center opacity-40">
                      <span className="material-icons-round text-5xl mb-2">person_off</span>
                      <p className="font-bold text-sm">Tidak ada pengguna ditemukan.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default UserTable;
