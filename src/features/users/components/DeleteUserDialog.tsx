import React from 'react';
import { TriangleAlert } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getErrorMessage } from '@/lib/utils';
import { useDeleteUser } from '../useUsers';
import type { UserRow } from '../types';
import { footerButtonClass } from './formStyles';

interface DeleteUserDialogProps {
  user: UserRow;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const DeleteUserDialog: React.FC<DeleteUserDialogProps> = ({
  user,
  onClose,
  onSuccess,
  onError,
}) => {
  const deleteUser = useDeleteUser();

  const handleDelete = async (e: React.MouseEvent) => {
    // Dialog tetap terbuka selama proses hapus
    e.preventDefault();
    try {
      // Delete from auth.users (profile will cascade-delete)
      await deleteUser.mutateAsync(user.id);
      onSuccess(`Pengguna ${user.email} berhasil dihapus!`);
    } catch (err) {
      onError('Gagal menghapus pengguna: ' + getErrorMessage(err));
    }
  };

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-sm gap-5 rounded-2xl sm:rounded-2xl border-none bg-card-light dark:bg-card-dark p-6 shadow-xl">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <TriangleAlert className="size-8 text-red-500" aria-hidden />
          </div>
          <AlertDialogTitle className="text-lg font-bold text-text-primary-light dark:text-white">
            Hapus Pengguna?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-2">
            Anda akan menghapus profil <strong>{user.full_name || user.email}</strong>. Tindakan ini
            tidak dapat dibatalkan.
          </AlertDialogDescription>
        </div>

        <div className="flex gap-3">
          <AlertDialogCancel className={`${footerButtonClass} mt-0`}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteUser.isPending}
            className={`${footerButtonClass} bg-red-500 text-white shadow-lg hover:bg-red-600`}
          >
            {deleteUser.isPending ? 'Menghapus...' : 'Hapus'}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteUserDialog;
