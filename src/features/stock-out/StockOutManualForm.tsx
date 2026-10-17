import React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BriefcaseMedical, Loader2, Send, X } from 'lucide-react';
import { StockOutManual } from './types';
import { useProducts } from '@/features/products/useProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { emptyManualItem, stockOutManualSchema, type StockOutManualValues } from './schemas';
import ManualItemsTable from './components/ManualItemsTable';
import { Card } from '@/components/ui/card';

interface StockOutManualFormProps {
  onSave: (record: StockOutManual) => void;
  onClose: () => void;
  isLoading?: boolean;
}

const randomId = () => Math.random().toString(36).slice(2, 11);

const LABEL = 'text-sm font-bold text-slate-700 dark:text-slate-300 ml-1 leading-normal';
const INPUT =
  'border-gray-100 dark:border-gray-700 bg-background px-4 text-sm md:text-sm focus:border-primary focus-visible:ring-primary text-foreground aria-[invalid=true]:border-red-500';
const MESSAGE = 'text-xs font-normal text-red-500 ml-1';

const RequiredMark = () => <span className="text-red-500">*</span>;

const toRecord = (values: StockOutManualValues): StockOutManual => ({
  id: randomId(),
  requestId: values.formNumber,
  patient: {
    fullName: values.patientName,
    medicalRecordNumber: '-',
    birthDate: values.patientBirthDate,
    diagnosis: '-',
  },
  items: values.items.map((item) => ({ ...item, id: randomId(), instructions: '-' })),
  date: values.date,
  reason: values.reason || '-',
  tipeSumber: 'KASIR_LANGSUNG',
  services: [],
});

const StockOutManualForm: React.FC<StockOutManualFormProps> = ({
  onSave,
  onClose,
  isLoading = false,
}) => {
  const { data: productData } = useProducts({ page: 1, perPage: 1000 });
  const products = productData?.data || [];

  const form = useForm<StockOutManualValues>({
    resolver: zodResolver(stockOutManualSchema),
    mode: 'onTouched',
    defaultValues: {
      formNumber: `OUT-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      patientName: '',
      patientBirthDate: '',
      reason: '',
      items: [emptyManualItem()],
    },
  });

  const items = useWatch({ control: form.control, name: 'items' });
  const totalCost = items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    return sum + (product ? product.sellingPrice * (item.quantity || 0) : 0);
  }, 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-background w-full max-w-6xl max-h-[95vh] overflow-y-auto rounded-2xl shadow-soft p-4 md:p-8 lg:p-10 font-display">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-bold text-foreground">Catat Stok Keluar Manual</h3>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            aria-label="Tutup"
            className="rounded-full hover:bg-gray-200 dark:hover:bg-white/5 [&_svg]:size-6"
          >
            <X aria-hidden />
          </Button>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => onSave(toRecord(values)))}
            noValidate
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="formNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={LABEL}>
                          Nomor Formulir <RequiredMark />
                        </FormLabel>
                        <FormControl>
                          <Input type="text" className={INPUT} {...field} />
                        </FormControl>
                        <FormMessage className={MESSAGE} />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={LABEL}>
                          Tanggal Pengeluaran <RequiredMark />
                        </FormLabel>
                        <FormControl>
                          <Input type="date" className={INPUT} {...field} />
                        </FormControl>
                        <FormMessage className={MESSAGE} />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="patientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={LABEL}>
                        Nama Pasien <RequiredMark />
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Masukkan nama pasien"
                          className={INPUT}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className={MESSAGE} />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="patientBirthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={LABEL}>Tanggal Lahir</FormLabel>
                        <FormControl>
                          <Input type="date" className={INPUT} {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/20 text-secondary">
                    <BriefcaseMedical className="size-5" aria-hidden />
                  </span>
                  <h4 className="text-base font-bold text-foreground">Permintaan Obat & Alkes</h4>
                </div>
                <ManualItemsTable />
              </Card>
            </div>

            <div className="lg:col-span-1 space-y-6">
              <Card className="p-6 space-y-4">
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-bold text-foreground leading-normal">
                        Keterangan
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ketik keterangan di sini..."
                          rows={3}
                          className="bg-background border-none shadow-none px-4 text-sm md:text-sm font-medium focus-visible:ring-2 focus-visible:ring-primary/20 text-foreground resize-none"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </Card>

              <div className="bg-gradient-to-br from-primary to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-primary/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                <h3 className="font-bold text-lg mb-4 relative z-10">Ringkasan Biaya</h3>

                <div className="flex flex-col gap-3 relative z-10 mb-6">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-medium text-white/90">Total Tagihan</span>
                    <span className="text-2xl font-bold">
                      Rp {totalCost.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <p className="text-xs text-blue-100/80 mt-1">
                    *Total otomatis dihitung berdasarkan produk dan jumlah yang diinput.
                  </p>
                </div>

                <Button
                  size="lg"
                  type="submit"
                  className={cn(
                    'w-full bg-white text-blue-700 hover:bg-blue-50 font-bold shadow-lg transition-all flex items-center justify-center gap-2 relative z-10 text-base',
                    '[&_svg]:size-6',
                  )}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" aria-hidden />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Send aria-hidden />
                      Kirim Permintaan
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default StockOutManualForm;
