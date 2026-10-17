import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Info, Pencil, UserPlus } from 'lucide-react';
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
import { useToast } from '@/components/ui/toast';
import { getErrorMessage } from '@/lib/utils';
import { useCreateUser, useUpdateUser } from '../useUsers';
import { getInitialRoles } from '../roles';
import { createUserSchema, editUserSchema, type UserFormValues } from '../schema';
import type { UserRow } from '../types';
import RoleCheckboxes from './RoleCheckboxes';
import UserAvatar from './UserAvatar';
import {
  dialogContentClass,
  dialogTitleClass,
  fieldInputClass,
  fieldLabelClass,
  footerButtonClass,
} from './formStyles';

interface UserFormDialogProps {
  // Tanpa user berarti tambah pengguna baru
  user?: UserRow;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const UserFormDialog: React.FC<UserFormDialogProps> = ({ user, onClose, onSuccess, onError }) => {
  const isEdit = !!user;
  const { showToast } = useToast();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const isSubmitting = createUser.isPending || updateUser.isPending;

  const form = useForm<UserFormValues>({
    resolver: zodResolver(isEdit ? editUserSchema : createUserSchema),
    defaultValues: {
      fullName: user?.full_name || '',
      email: user?.email || '',
      password: '',
      roles: user ? getInitialRoles(user) : ['nakes'],
    },
  });

  const onSubmit = async (values: UserFormValues) => {
    if (user) {
      try {
        await updateUser.mutateAsync({
          userId: user.id,
          updates: { full_name: values.fullName, roles: values.roles, email: values.email },
        });
        onSuccess(`Profil ${user.email} berhasil diperbarui!`);
      } catch (err) {
        onError('Gagal memperbarui pengguna: ' + getErrorMessage(err));
      }
      return;
    }

    try {
      await createUser.mutateAsync({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        roles: values.roles,
      });
      onSuccess(`Pengguna ${values.email} berhasil ditambahkan!`);
    } catch (err) {
      showToast('Gagal menambah pengguna.', 'error');
      console.error('Error adding user:', err);
      onError('Gagal menambah pengguna: ' + getErrorMessage(err));
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={dialogContentClass} aria-describedby={undefined}>
        <DialogTitle className={dialogTitleClass}>
          {isEdit ? (
            <Pencil className="size-6 text-primary" aria-hidden />
          ) : (
            <UserPlus className="size-6 text-primary" aria-hidden />
          )}
          {isEdit ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
        </DialogTitle>

        {user && (
          <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 flex items-center gap-3">
            <UserAvatar user={user} />
            <div>
              <p className="font-bold text-sm text-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground">ID: {user.id.slice(0, 8)}...</p>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className={fieldLabelClass}>Nama Lengkap</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder={isEdit ? undefined : 'Masukkan nama lengkap'}
                        className={fieldInputClass}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className={fieldLabelClass}>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={isEdit ? 'email@contoh.com' : 'nama@contoh.com'}
                        className={fieldInputClass}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    {isEdit && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        <Info className="inline size-3 align-text-bottom" aria-hidden />
                        Email akan diperbarui di profil. Untuk mengubah email login, gunakan fitur
                        reset password.
                      </p>
                    )}
                  </FormItem>
                )}
              />
              {!isEdit && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className={fieldLabelClass}>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Minimal 6 karakter"
                          className={fieldInputClass}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="roles"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className={fieldLabelClass}>Role</FormLabel>
                    <RoleCheckboxes value={field.value} onChange={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                disabled={isSubmitting}
                className={`${footerButtonClass} bg-primary text-white shadow-lg hover:bg-blue-700`}
              >
                {isSubmitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UserFormDialog;
