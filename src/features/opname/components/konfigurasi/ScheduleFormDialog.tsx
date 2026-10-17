import React, { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { useCreateOpnameSchedule, useUpdateOpnameSchedule } from '../../useOpnameSchedules';
import { OpnameSchedule } from '../../types';
import { Product } from '@/features/products/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { Form } from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import ScheduleInfoFields from './ScheduleInfoFields';
import ScheduleProductPicker from './ScheduleProductPicker';
import {
  emptyScheduleForm,
  formToScheduleConfig,
  INFO_FIELDS,
  scheduleFormSchema,
  scheduleToForm,
  type ScheduleFormValues,
} from './scheduleForm';

interface ScheduleFormDialogProps {
  open: boolean;
  // null = tambah jadwal baru
  schedule: OpnameSchedule | null;
  products: Product[];
  onClose: () => void;
}

const stepClass = (active: boolean, done: boolean) =>
  cn(
    'flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex-1 sm:flex-initial justify-center',
    active && 'bg-primary text-white',
    done && 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
    !active && !done && 'bg-background text-muted-foreground',
  );

// Dialog tambah/edit jadwal dalam dua langkah: info jadwal, lalu pilih obat.
// Halaman me-mount ulang dialog ini setiap kali dibuka, jadi form selalu
// mulai dari nilai jadwal yang dipilih.
const ScheduleFormDialog: React.FC<ScheduleFormDialogProps> = ({
  open,
  schedule,
  products,
  onClose,
}) => {
  const { showToast } = useToast();
  const createSchedule = useCreateOpnameSchedule();
  const updateSchedule = useUpdateOpnameSchedule();
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: schedule ? scheduleToForm(schedule) : emptyScheduleForm(),
  });
  const [nama, selectAll, obatIds] = useWatch({
    control: form.control,
    name: ['nama', 'selectAll', 'obatIds'],
  });
  const isSaving = form.formState.isSubmitting;
  const isEditing = schedule !== null;

  const goToProducts = async () => {
    if (await form.trigger(INFO_FIELDS)) setModalStep(2);
  };

  const handleSave = form.handleSubmit(async (values) => {
    // Cek ulang skema sebelum memanggil API
    const config = formToScheduleConfig(scheduleFormSchema.parse(values));
    try {
      if (schedule) {
        await updateSchedule.mutateAsync({ id: schedule.id, config });
      } else {
        await createSchedule.mutateAsync(config);
      }
      onClose();
      showToast(isEditing ? 'Jadwal berhasil diperbarui!' : 'Jadwal berhasil dibuat!', 'success');
    } catch (error) {
      console.error('Failed to save schedule:', error);
      showToast('Gagal menyimpan jadwal.', 'error');
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] bg-card rounded-2xl sm:rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} noValidate>
            <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
              <DialogTitle className="text-base sm:text-lg font-bold">
                {isEditing ? 'Edit Jadwal Opname' : 'Tambah Jadwal Baru'}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                {modalStep === 1
                  ? 'Isi informasi jadwal opname.'
                  : 'Pilih obat yang akan di-opname pada jadwal ini.'}
              </DialogDescription>
            </DialogHeader>

            <div className="px-4 sm:px-6 flex items-center gap-1 sm:gap-2">
              <div className={stepClass(modalStep === 1, modalStep > 1)}>
                {modalStep > 1 ? <Check className="size-3" aria-hidden /> : <span>1</span>}
                <span className="hidden xs:inline sm:inline">Info Jadwal</span>
                <span className="xs:hidden sm:hidden">Info</span>
              </div>
              <div className="w-4 sm:w-6 h-0.5 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0" />
              <div className={stepClass(modalStep === 2, false)}>
                <span>2</span>
                <span className="hidden xs:inline sm:inline">Pilih Obat</span>
                <span className="xs:hidden sm:hidden">Obat</span>
              </div>
            </div>

            {modalStep === 1 && <ScheduleInfoFields />}
            {modalStep === 2 && <ScheduleProductPicker products={products} />}

            <DialogFooter className="px-4 sm:px-6 pb-4 sm:pb-6 pt-2 gap-2 sm:gap-3 flex-col sm:flex-row">
              {modalStep === 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setModalStep(1)}
                  className="font-bold rounded-xl px-4 h-auto py-3 sm:py-2.5 w-full sm:w-auto sm:mr-auto order-1 sm:order-none"
                >
                  <ArrowLeft className="mr-1" aria-hidden />
                  Kembali
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="font-bold rounded-xl px-4 h-auto py-3 sm:py-2.5 w-full sm:w-auto order-3 sm:order-none"
              >
                Batal
              </Button>
              {modalStep === 1 ? (
                <Button
                  type="button"
                  onClick={goToProducts}
                  disabled={!nama?.trim()}
                  className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl px-6 h-auto py-3 sm:py-2.5 shadow-lg shadow-primary/20 disabled:opacity-50 w-full sm:w-auto order-2 sm:order-none"
                >
                  Lanjutkan
                  <ArrowRight className="ml-1.5" aria-hidden />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={(!selectAll && obatIds.length === 0) || isSaving}
                  className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl px-6 h-auto py-3 sm:py-2.5 shadow-lg shadow-primary/20 disabled:opacity-50 w-full sm:w-auto order-2 sm:order-none"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-1 animate-spin" aria-hidden />
                      Menyimpan...
                    </>
                  ) : isEditing ? (
                    'Simpan Perubahan'
                  ) : (
                    'Simpan Jadwal'
                  )}
                </Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleFormDialog;
