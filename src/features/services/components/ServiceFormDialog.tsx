import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { FieldErrorMessage } from '@/features/products/components/FieldErrorMessage';
import { NumberInputField } from '@/features/products/components/NumberInputField';
import {
  fieldErrorClassName,
  isFieldErrorVisible,
} from '@/features/products/components/fieldErrorVisibility';
import type { Service } from '../types';
import { useCreateService, useUpdateService } from '../useServices';
import { useServiceCategories } from '../useServiceCategories';
import {
  emptyServiceFormValues,
  generateServiceCode,
  serviceFormSchema,
  type ServiceFormValues,
} from '../serviceSchema';
import { ServiceCategoryDialog } from './ServiceCategoryDialog';
import { serviceInputClassName, serviceLabelClassName } from './serviceFormStyles';

interface ServiceFormDialogProps {
  editingService?: Service;
  onClose: () => void;
}

const toFormValues = (service?: Service): ServiceFormValues =>
  service
    ? {
        name: service.name,
        code: service.code,
        categoryId: service.categoryId ?? '',
        price: service.price,
        description: service.description || '',
      }
    : emptyServiceFormValues;

export const ServiceFormDialog: React.FC<ServiceFormDialogProps> = ({
  editingService,
  onClose,
}) => {
  const { showToast } = useToast();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const { data: categories = [] } = useServiceCategories();
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: toFormValues(editingService),
    mode: 'onTouched',
  });
  const revalidate = () => void form.trigger();
  const isSaving = createService.isPending || updateService.isPending;

  const handleSubmit = async (values: ServiceFormValues) => {
    const payload: Partial<Service> = {
      ...values,
      code: values.code.trim() || generateServiceCode(values.name),
    };

    try {
      if (editingService) {
        await updateService.mutateAsync({ id: editingService.id, updates: payload });
      } else {
        await createService.mutateAsync(payload);
      }
      onClose();
    } catch (error) {
      console.error('Error saving service:', error);
      showToast('Gagal menyimpan jasa', 'error');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm m-0">
        <div className="bg-white dark:bg-card-dark w-full max-w-2xl rounded-[32px] shadow-soft p-8 overflow-y-auto max-h-[90vh] relative">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-text-primary-light dark:text-white">
              {editingService ? 'Edit Jasa' : 'Tambah Jasa Baru'}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Tutup"
                className="h-auto w-auto p-2 text-current hover:text-current bg-background-light dark:bg-white/5 rounded-full hover:bg-gray-200 transition-colors [&_svg]:size-6"
              >
                <X aria-hidden />
              </Button>
            </div>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" noValidate>
              <FormField
                control={form.control}
                name="name"
                render={({ field, fieldState, formState }) => (
                  <FormItem className="space-y-0">
                    <FormLabel className={serviceLabelClassName}>
                      Nama Jasa <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        className={cn(
                          serviceInputClassName,
                          isFieldErrorVisible(fieldState, formState.isSubmitted) &&
                            fieldErrorClassName,
                        )}
                        placeholder="contoh: Konsultasi Umum"
                        type="text"
                        {...field}
                        onBlur={() => {
                          field.onBlur();
                          revalidate();
                        }}
                      />
                    </FormControl>
                    <FieldErrorMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormLabel className={serviceLabelClassName}>
                      Kategori <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className={serviceInputClassName}>
                          <SelectValue placeholder="Pilih Kategori" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="z-[100]">
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setIsCategoryDialogOpen(true)}
                      className="mt-2 h-auto p-0 gap-1 text-xs font-bold text-primary hover:text-primary/80 hover:no-underline"
                    >
                      <Plus aria-hidden />
                      Tambah kategori baru
                    </Button>
                    <FieldErrorMessage />
                  </FormItem>
                )}
              />
              <NumberInputField
                control={form.control}
                name="price"
                label={
                  <>
                    Harga (Rp) <span className="text-red-500">*</span>
                  </>
                }
                labelClassName={serviceLabelClassName}
                inputClassName={`${serviceInputClassName} pl-10 pr-4`}
                placeholder="150000"
                prefix="Rp"
                onBlur={revalidate}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <FormLabel className={serviceLabelClassName}>Deskripsi</FormLabel>
                    <FormControl>
                      <Textarea
                        className={`${serviceInputClassName} resize-none shadow-none`}
                        placeholder="Deskripsi singkat layanan..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="pt-4">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-bold shadow-lg [&_svg]:size-[18px]"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin mr-1" aria-hidden />
                      Menyimpan...
                    </>
                  ) : editingService ? (
                    'Simpan Perubahan'
                  ) : (
                    'Tambah Data Jasa'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>

      {isCategoryDialogOpen && (
        <ServiceCategoryDialog
          onClose={() => setIsCategoryDialogOpen(false)}
          onCreated={(category) => form.setValue('categoryId', category.id)}
        />
      )}
    </>
  );
};
