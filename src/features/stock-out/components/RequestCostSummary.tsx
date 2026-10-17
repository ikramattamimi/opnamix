import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import type { StockOutRequestValues } from '../schemas';

interface RequestCostSummaryProps {
  totalDrugs: number;
  totalServices: number;
  totalAmount: number;
  isLoading: boolean;
}

const toAmount = (value: string) => (value === '' ? 0 : Math.max(0, Number(value)));

const AMOUNT_FIELDS = [
  { name: 'serviceFee', label: 'Biaya Layanan' },
  { name: 'discount', label: 'Diskon' },
] as const;

// Ringkasan biaya, biaya layanan, diskon, dan tombol kirim di form permintaan
const RequestCostSummary: React.FC<RequestCostSummaryProps> = ({
  totalDrugs,
  totalServices,
  totalAmount,
  isLoading,
}) => {
  const { control } = useFormContext<StockOutRequestValues>();

  return (
    <div className="bg-gradient-to-br from-primary to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-primary/20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
      <h3 className="font-bold text-lg mb-4 relative z-10">Ringkasan Biaya</h3>
      <div className="flex flex-col gap-3 relative z-10 mb-6">
        <div className="flex justify-between text-sm text-blue-100">
          <span>Total Obat (Estimasi)</span>
          <span>Rp {totalDrugs.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between text-sm text-blue-100">
          <span>Total Tindakan</span>
          <span>Rp {totalServices.toLocaleString('id-ID')}</span>
        </div>
        {AMOUNT_FIELDS.map(({ name, label }) => (
          <FormField
            key={name}
            control={control}
            name={name}
            render={({ field }) => (
              <FormItem className="rounded-xl bg-white/10 p-3">
                <FormLabel className="block text-sm font-medium text-white/90">{label}</FormLabel>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/90">Rp</span>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={field.value === 0 ? '' : field.value}
                      onChange={(e) => field.onChange(toAmount(e.target.value))}
                      className="border border-white/20 bg-white/10 px-3 text-sm md:text-sm font-bold text-white placeholder:text-white/90 focus:border-white/40 focus-visible:ring-white/40"
                    />
                  </FormControl>
                </div>
              </FormItem>
            )}
          />
        ))}
        <div className="h-px bg-white/20 my-1"></div>
        <div className="flex justify-between items-end">
          <span className="text-sm font-medium text-white/90">Total Tagihan</span>
          <span className="text-2xl font-bold">Rp {totalAmount.toLocaleString('id-ID')}</span>
        </div>
      </div>
      <Button
        type="submit"
        size="lg"
        className="w-full bg-white text-blue-700 hover:bg-blue-50 font-bold shadow-lg transition-all flex items-center justify-center gap-2 relative z-10 text-lg [&_svg]:size-6"
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
  );
};

export default RequestCostSummary;
