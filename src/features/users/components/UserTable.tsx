import React, { useState } from 'react';
import { Pencil, RotateCcwKey, Search, Trash2, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/QueryState';
import { getErrorMessage } from '@/lib/utils';
import { ROLE_OPTIONS } from '../roles';
import type { UserRow } from '../types';
import RoleBadges from './RoleBadges';
import UserAvatar from './UserAvatar';

interface UserTableProps {
  users: UserRow[];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
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

const actionButtonClass = 'h-8 w-8 text-muted-foreground transition-colors';

// Filter cari/role dan tabel pengguna
const UserTable: React.FC<UserTableProps> = ({
  users,
  isLoading,
  error,
  onRetry,
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

  const renderStatus = () => {
    if (isLoading) return <LoadingState label="Memuat data..." />;
    if (error) {
      return (
        <ErrorState
          title="Gagal memuat data pengguna"
          message={getErrorMessage(error)}
          onRetry={onRetry}
        />
      );
    }
    return <EmptyState icon={UserX} title="Tidak ada pengguna ditemukan." />;
  };

  const showRows = !isLoading && !error && filteredUsers.length > 0;

  return (
    <>
      {/* Filter Bar */}
      <div className="bg-card rounded-2xl p-4 shadow-soft flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-5"
            aria-hidden
          />
          <Input
            type="text"
            placeholder="Cari nama atau email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 border-gray-200 dark:border-gray-700 dark:bg-background text-sm md:text-sm focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary transition-all"
          />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger
            aria-label="Filter role"
            className="w-auto gap-2 border-gray-200 dark:border-gray-700 dark:bg-background text-sm px-4 focus:ring-2 focus:ring-primary/30"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Semua">Semua Role</SelectItem>
            {ROLE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* User Table */}
      <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-white/5">
              <tr className="text-xs uppercase font-bold text-muted-foreground">
                <th className="px-6 py-4">Pengguna</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Dibuat</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {showRows ? (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar user={user} />
                        <div>
                          <p className="font-bold text-foreground">{user.full_name || '-'}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadges roles={user.roles} />
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {formatCreatedAt(user.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(user)}
                          className={`${actionButtonClass} hover:text-primary`}
                          title="Edit"
                          aria-label="Edit"
                        >
                          <Pencil className="size-5" aria-hidden />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onResetPassword(user)}
                          className={`${actionButtonClass} hover:text-amber-500`}
                          title="Reset Password"
                          aria-label="Reset Password"
                        >
                          <RotateCcwKey className="size-5" aria-hidden />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(user)}
                          className={`${actionButtonClass} hover:text-red-500`}
                          title="Hapus"
                          aria-label="Hapus"
                        >
                          <Trash2 className="size-5" aria-hidden />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6">
                    {renderStatus()}
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
