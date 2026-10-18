import React, { useState, useEffect } from 'react';
import { CircleAlert, CircleCheck, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUsers } from './useUsers';
import type { UserRow } from './types';
import UserStats from './components/UserStats';
import UserTable from './components/UserTable';
import UserFormDialog from './components/UserFormDialog';
import ResetPasswordDialog from './components/ResetPasswordDialog';
import DeleteUserDialog from './components/DeleteUserDialog';
import { PageHeader } from '@/components/layout/PageHeader';

type ActiveDialog =
  { type: 'create' } | { type: 'edit' | 'resetPassword' | 'delete'; user: UserRow } | null;

const UserManagement: React.FC = () => {
  const [dialog, setDialog] = useState<ActiveDialog>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: users = [], isLoading, error: loadError, refetch } = useUsers();

  // Auto-dismiss messages
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const openDialog = (next: ActiveDialog) => {
    setError(null);
    setDialog(next);
  };

  const closeDialog = () => setDialog(null);

  const handleSuccess = (message: string) => {
    setSuccess(message);
    setDialog(null);
  };

  const dialogProps = { onClose: closeDialog, onSuccess: handleSuccess, onError: setError };

  return (
    <>
      <PageHeader
        actions={
          <Button variant="light" onClick={() => openDialog({ type: 'create' })}>
            <UserPlus aria-hidden />
            Tambah Pengguna
          </Button>
        }
      />
      <div className="space-y-6">
        {/* Toast Messages - Fixed Position */}
        {error && (
          <div className="fixed top-4 right-4 z-[60] bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl flex items-center gap-2 animate-[fadeIn_0.3s] shadow-lg max-w-md">
            <CircleAlert className="size-5 shrink-0" aria-hidden />
            {error}
          </div>
        )}
        {success && (
          <div className="fixed top-4 right-4 z-[60] bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-300 px-4 py-3 rounded-xl flex items-center gap-2 animate-[fadeIn_0.3s] shadow-lg max-w-md">
            <CircleCheck className="size-5 shrink-0" aria-hidden />
            {success}
          </div>
        )}

        <UserStats users={users} />

        <UserTable
          users={users}
          isLoading={isLoading}
          error={loadError}
          onRetry={() => refetch()}
          onEdit={(user) => openDialog({ type: 'edit', user })}
          onResetPassword={(user) => openDialog({ type: 'resetPassword', user })}
          onDelete={(user) => setDialog({ type: 'delete', user })}
        />
      </div>

      {dialog?.type === 'create' && <UserFormDialog {...dialogProps} />}
      {dialog?.type === 'edit' && <UserFormDialog user={dialog.user} {...dialogProps} />}
      {dialog?.type === 'resetPassword' && (
        <ResetPasswordDialog user={dialog.user} {...dialogProps} />
      )}
      {dialog?.type === 'delete' && <DeleteUserDialog user={dialog.user} {...dialogProps} />}
    </>
  );
};

export default UserManagement;
