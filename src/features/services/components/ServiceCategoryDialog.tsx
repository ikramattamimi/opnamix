import React, { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { getErrorMessage } from '@/lib/utils';
import { useCreateServiceCategory } from '../useServiceCategories';
import type { ServiceCategoryType } from '../types';
import {
  generateCategoryCodePreview,
  serviceCategoryFormSchema,
  type ServiceCategoryFormValues,
} from '../serviceSchema';
import { serviceInputClassName, serviceLabelClassName } from './serviceFormStyles';

interface ServiceCategoryDialogProps {
  onClose: () => void;
  onCreated?: (category: ServiceCategoryType) => void;
}

export const ServiceCategoryDialog: React.FC<ServiceCategoryDialogProps> = ({
  onClose,
  onCreated,
}) => {
  const { showToast } = useToast();
  const createServiceCategory = useCreateServiceCategory();
  const [serverError, setServerError] = useState('');

  const form = useForm<ServiceCategoryFormValues>({
    resolver: zodResolver(serviceCategoryFormSchema),
    defaultValues: { name: '', description: '' },
    // Validasi hanya saat submit, seperti sebelumnya
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });
  const categoryName = useWatch({ control: form.control, name: 'name' });

  const handleCreateCategory = async (values: ServiceCategoryFormValues) => {
    try {
      const createdCategory = await createServiceCategory.mutateAsync({
        name: values.name.trim(),
        description: values.description.trim(),
      });

      onCreated?.(createdCategory);
      onClose();
      showToast(`Kategori "${createdCategory.name}" berhasil ditambahkan.`, 'success');
    } catch (error) {
      console.error('Error creating category:', error);
      setServerError(getErrorMessage(error) || 'Gagal menambah kategori.');
    }
  };

  const categoryError = form.formState.errors.name?.message || serverError;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader className="mb-1 pr-8">
          <DialogTitle>Tambah Kategori Jasa</DialogTitle>
          <DialogDescription>Kategori baru akan langsung tersedia di form jasa.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreateCategory)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-0">
                  <FormLabel className={serviceLabelClassName}>
                    Nama Kategori <span className="text-red-600 dark:text-red-400">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      className={serviceInputClassName}
                      placeholder="Contoh: Rawat Jalan"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        // Pesan error hilang begitu nama diketik ulang
                        if (categoryError) {
                          form.clearErrors('name');
                          setServerError('');
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="space-y-0">
                  <FormLabel className={serviceLabelClassName}>Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      className={`${serviceInputClassName} py-3 resize-none shadow-none`}
                      placeholder="Opsional"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="rounded-xl bg-background px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Kode Otomatis
              </p>
              <p className="text-sm font-bold text-foreground">
                {generateCategoryCodePreview(categoryName)}
              </p>
            </div>

            {categoryError && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
              >
                {categoryError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createServiceCategory.isPending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={createServiceCategory.isPending}>
                {createServiceCategory.isPending ? 'Menyimpan...' : 'Simpan Kategori'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
