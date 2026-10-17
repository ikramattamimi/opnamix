import React, { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card w-full max-w-lg rounded-[28px] shadow-soft p-6">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-lg font-bold text-foreground">Tambah Kategori Jasa</h3>
            <p className="text-sm text-muted-foreground">
              Kategori baru akan langsung tersedia di form jasa.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Tutup"
            className="h-auto w-auto p-2 text-current hover:text-current rounded-full bg-background dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors [&_svg]:size-6"
          >
            <X aria-hidden />
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreateCategory)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-0">
                  <FormLabel className={serviceLabelClassName}>
                    Nama Kategori <span className="text-red-500">*</span>
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
                      className={`${serviceInputClassName} resize-none shadow-none`}
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
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
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
      </div>
    </div>
  );
};
