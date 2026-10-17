import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { ScheduleFormValues } from './scheduleForm';

const fieldClass =
  'h-auto w-full bg-background border-none rounded-xl px-4 py-3 text-sm md:text-sm font-medium';
const labelClass = 'text-xs sm:text-sm font-bold opacity-60';

// Langkah 1 dialog jadwal: nama, frekuensi, dan tanggal audit
const ScheduleInfoFields: React.FC = () => {
  const { control } = useFormContext<ScheduleFormValues>();

  return (
    <div className="px-4 sm:px-6 py-4 space-y-4 overflow-y-auto max-h-[60vh]">
      <FormField
        control={control}
        name="nama"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={labelClass}>Nama Jadwal</FormLabel>
            <FormControl>
              <Input
                type="text"
                placeholder="Contoh: Jadwal Rutin Bulanan"
                className={fieldClass}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="pengulangan"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClass}>Frekuensi</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className={fieldClass}>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="BULANAN">Setiap Bulan</SelectItem>
                  <SelectItem value="TRIWULAN">Setiap 3 Bulan</SelectItem>
                  <SelectItem value="TAHUNAN">Setiap Tahun</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="dayOfMonth"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={labelClass}>Tanggal Audit (1-28)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  max="28"
                  className={fieldClass}
                  {...field}
                  value={Number.isNaN(field.value) ? '' : field.value}
                  onChange={(e) => field.onChange(e.target.valueAsNumber)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default ScheduleInfoFields;
