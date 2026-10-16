import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { getErrorMessage } from '@/lib/utils';
import { useSetUserPassword } from '../useUsers';
import { resetPasswordSchema, type ResetPasswordValues } from '../schema';
import type { UserRow } from '../types';
import UserAvatar from './UserAvatar';
import {
  dialogContentClass,
  dialogTitleClass,
  fieldInputClass,
  fieldLabelClass,
  footerButtonClass,
} from './formStyles';

interface ResetPasswordDialogProps {
  user: UserRow;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const ResetPasswordDialog: React.FC<ResetPasswordDialogProps> = ({
  user,
  onClose,
  onSuccess,
  onError,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const setUserPassword = useSetUserPassword();

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '' },
  });
  const password = form.watch('password');

  const onSubmit = async ({ password }: ResetPasswordValues) => {
    try {
      await setUserPassword.mutateAsync({ userId: user.id, password });
      onSuccess(`Password ${user.full_name || user.email} berhasil diubah!`);
    } catch (err) {
      onError('Gagal mengubah password: ' + getErrorMessage(err));
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={dialogContentClass} aria-describedby={undefined}>
        <DialogTitle className={dialogTitleClass}>
          <span className="material-icons-round text-amber-500">lock_reset</span>
          Ubah Password
        </DialogTitle>

        <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 flex items-center gap-3">
          <UserAvatar user={user} />
          <div>
            <p className="font-bold text-sm text-text-primary-light dark:text-white">
              {user.full_name || '-'}
            </p>
            <p className="text-xs text-text-secondary-light">{user.email}</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className={fieldLabelClass}>Password Baru</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Minimal 8 karakter"
                        className={`${fieldInputClass} pr-12`}
                        {...field}
                      />
                    </FormControl>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary-light hover:text-primary transition-colors"
                    >
                      <span className="material-icons-round text-lg">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                    Harus mengandung huruf besar, huruf kecil, dan angka.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className={footerButtonClass}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={setUserPassword.isPending || !password}
                className={`${footerButtonClass} bg-amber-500 text-white shadow-lg hover:bg-amber-600 disabled:opacity-50`}
              >
                {setUserPassword.isPending ? 'Menyimpan...' : 'Simpan Password'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ResetPasswordDialog;
