import React, { useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IdCard, Pill, User, X } from 'lucide-react';
import { StockOutRequest } from './types';
import { useProducts } from '@/features/products/useProducts';
import { useServices } from '@/features/services/useServices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/features/auth/useAuth';
import { useNakesProfiles } from './useStockOut';
import { isDraftDrugRow, stockOutRequestSchema, type StockOutRequestValues } from './schemas';
import RequestDrugRows from './components/RequestDrugRows';
import ServicePicker from './components/ServicePicker';
import RequestCostSummary from './components/RequestCostSummary';

interface StockOutRequestFormProps {
  onSave: (request: StockOutRequest) => void;
  onClose: () => void;
  isLoading?: boolean;
}

const DEFAULT_AVATAR =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBqgtWx9e1jooHDwfz33Jdt6bQ2j0HZ4SzvqJ1_axDjTlPbR-tFS58Fod4YQWEWXDCxd9TiTIB1S-bFtU89ptBoAi66Y1P4Df3e4uyUFX0rwZRmusSvpv2_u88tZQiqUWrg2nPdWUuciqKl8oGtia-pDjOTURi6Y1xSvjun4MEl2V5a4roBQ3fa7MXYUJibAxL_7x7QhjdO800MfK4tvvWLW_L4bxKginroIPYTP4Zy2VeA4jJ8LPJW4Ec5qt3yC5Kc3C2HmiVTxeA';

const LABEL = 'block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1 leading-normal';
const INPUT =
  'border-gray-100 dark:border-gray-700 bg-background px-4 text-sm md:text-sm focus:border-primary focus-visible:ring-primary dark:text-white aria-[invalid=true]:border-red-500';
const MESSAGE = 'text-xs font-normal text-red-500 mt-1 ml-1';
const CARD = 'bg-card rounded-2xl p-6 shadow-soft';
const CARD_TITLE = 'font-bold text-lg text-foreground flex items-center gap-2';

const RequiredMark = () => <span className="text-red-500">*</span>;

// Nilai select nakes; profil tanpa nama memakai id karena item select tidak boleh kosong
const nakesValue = (n: { id: string; full_name: string | null }) => n.full_name || n.id;

const StockOutRequestForm: React.FC<StockOutRequestFormProps> = ({
  onSave,
  onClose,
  isLoading = false,
}) => {
  const { user } = useAuth();
  const { data: productData } = useProducts({ page: 1, perPage: 1000 });
  const products = productData?.data || [];
  const { data: serviceData } = useServices({ page: 1, perPage: 1000 });
  const services = serviceData?.data || [];
  const { data: nakesList = [] } = useNakesProfiles();

  const form = useForm<StockOutRequestValues>({
    resolver: zodResolver(stockOutRequestSchema),
    mode: 'onTouched',
    defaultValues: {
      formNumber: `#REQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      patientName: '',
      patientBirthDate: '',
      nakesName: '',
      drugs: [],
      serviceIds: [],
      serviceFee: 0,
      discount: 0,
    },
  });

  // Pilih nakes pertama sekali saja saat daftar pertama kali tersedia
  const hasDefaultNakes = useRef(false);
  useEffect(() => {
    if (hasDefaultNakes.current || nakesList.length === 0) return;
    hasDefaultNakes.current = true;
    form.setValue('nakesName', nakesValue(nakesList[0]));
  }, [nakesList, form]);

  const [drugs, serviceIds, serviceFee, discount] = useWatch({
    control: form.control,
    name: ['drugs', 'serviceIds', 'serviceFee', 'discount'],
  });
  const totalDrugs = drugs.reduce((sum, drug) => {
    const product = products.find((p) => p.id === drug.productId);
    return sum + (product ? product.sellingPrice * (drug.quantity || 0) : 0);
  }, 0);
  const totalServices = serviceIds.reduce(
    (sum, id) => sum + (services.find((s) => s.id === id)?.price ?? 0),
    0,
  );
  const totalAmount = Math.max(0, totalDrugs + totalServices + serviceFee - discount);

  const handleValid = (values: StockOutRequestValues) => {
    onSave({
      id: Math.random().toString(36).slice(2, 11),
      requestId: values.formNumber,
      patient: {
        fullName: values.patientName,
        medicalRecordNumber: '-',
        birthDate: values.patientBirthDate,
        diagnosis: '-',
      },
      drugs: values.drugs
        .filter((drug) => !isDraftDrugRow(drug))
        .map((drug) => ({ ...drug, id: Math.random().toString() })),
      services: values.serviceIds.map((id) => {
        const s = services.find((svc) => svc.id === id);
        return { id, name: s?.name || 'Unknown', price: s?.price || 0 };
      }),
      totalAmount,
      discount: values.discount,
      serviceFee: values.serviceFee,
      requestedBy: values.nakesName,
      requestedByAvatar: DEFAULT_AVATAR,
      status: 'Menunggu',
      date: new Date().toISOString().split('T')[0],
      tipeSumber: 'PENGAJUAN_NAKES',
      createdBy: user?.id || '',
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-background w-full max-w-6xl max-h-[95vh] overflow-y-auto rounded-2xl shadow-soft p-4 md:p-8 lg:p-10 font-display">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-foreground tracking-tight">
            Formulir Permintaan Obat
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            aria-label="Tutup"
            className="rounded-full hover:bg-gray-200 dark:hover:bg-white/5 shadow-sm [&_svg]:size-6"
          >
            <X aria-hidden />
          </Button>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleValid)}
            noValidate
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
          >
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className={CARD}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={CARD_TITLE}>
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                      <User className="size-5" aria-hidden />
                    </span>
                    Data Pasien
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="formNumber"
                    render={({ field }) => (
                      <FormItem className="col-span-2 space-y-0">
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
                    name="patientName"
                    render={({ field }) => (
                      <FormItem className="col-span-2 space-y-0">
                        <FormLabel className={LABEL}>
                          Nama Lengkap Pasien <RequiredMark />
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
                  <FormField
                    control={form.control}
                    name="patientBirthDate"
                    render={({ field }) => (
                      <FormItem className="col-span-2 md:col-span-1 space-y-0">
                        <FormLabel className={LABEL}>Tanggal Lahir</FormLabel>
                        <FormControl>
                          <Input type="date" className={INPUT} {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className={CARD}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={CARD_TITLE}>
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-blue-700">
                      <IdCard className="size-5" aria-hidden />
                    </span>
                    Nama Nakes
                  </h3>
                </div>
                <FormField
                  control={form.control}
                  name="nakesName"
                  render={({ field }) => (
                    <FormItem>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger
                            aria-label="Nama Nakes"
                            className="border-gray-100 dark:border-gray-700 bg-background px-4 text-sm focus:border-primary focus:ring-primary dark:text-white"
                          >
                            <SelectValue placeholder="Memuat data nakes..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {nakesList.map((n) => (
                            <SelectItem key={n.id} value={nakesValue(n)}>
                              {n.full_name || n.id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              <div className={CARD}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={CARD_TITLE}>
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-100 text-green-700">
                      <Pill className="size-5" aria-hidden />
                    </span>
                    Permintaan Obat & Alkes
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      (Opsional)
                    </span>
                  </h3>
                </div>
                <RequestDrugRows products={products} />
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-6">
              <ServicePicker services={services} totalServices={totalServices} />
              <RequestCostSummary
                totalDrugs={totalDrugs}
                totalServices={totalServices}
                totalAmount={totalAmount}
                isLoading={isLoading}
              />
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default StockOutRequestForm;
