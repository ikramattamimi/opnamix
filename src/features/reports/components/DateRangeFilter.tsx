import React, { useId } from 'react';
import { Input } from '@/components/ui/input';
import {
  PERIOD_OPTIONS,
  applyDate,
  applyPeriod,
  type ReportDateRange,
  type ReportPeriod,
} from '../reportPeriod';
import { FilterField, FilterSelect } from './FilterSelect';

interface DateRangeFilterProps {
  value: ReportDateRange;
  onChange: (value: ReportDateRange) => void;
  // Field dan tombol tambahan di baris filter yang sama
  children?: React.ReactNode;
}

const dateInputClass =
  'h-auto rounded-xl border-0 bg-white px-4 py-2 text-base md:text-base text-foreground shadow-none dark:bg-card';

// Filter periode + rentang tanggal yang dipakai bersama oleh laporan transaksi dan mutasi stok.
const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ value, onChange, children }) => {
  const id = useId();

  return (
    <div className="flex flex-wrap items-end gap-4 mb-6">
      <FilterField label="Periode" htmlFor={`${id}-period`}>
        <FilterSelect
          id={`${id}-period`}
          value={value.period}
          onValueChange={(period) => onChange(applyPeriod(value, period as ReportPeriod))}
          options={PERIOD_OPTIONS}
        />
      </FilterField>
      <FilterField label="Dari Tanggal" htmlFor={`${id}-start`}>
        <Input
          id={`${id}-start`}
          type="date"
          value={value.startDate}
          onChange={(e) => onChange(applyDate(value, 'startDate', e.target.value))}
          className={dateInputClass}
        />
      </FilterField>
      <FilterField label="Sampai Tanggal" htmlFor={`${id}-end`}>
        <Input
          id={`${id}-end`}
          type="date"
          value={value.endDate}
          onChange={(e) => onChange(applyDate(value, 'endDate', e.target.value))}
          className={dateInputClass}
        />
      </FilterField>
      {children}
    </div>
  );
};

export default DateRangeFilter;
