import React from 'react';
import {
  PERIOD_OPTIONS,
  applyDate,
  applyPeriod,
  type ReportDateRange,
  type ReportPeriod,
} from '../reportPeriod';

interface DateRangeFilterProps {
  value: ReportDateRange;
  onChange: (value: ReportDateRange) => void;
  // Field dan tombol tambahan di baris filter yang sama
  children?: React.ReactNode;
}

const fieldClass =
  'block w-full rounded-xl border-gray-200 bg-white px-4 py-2 text-text-primary-light dark:border-gray-700 dark:bg-card-dark dark:text-white';

// Filter periode + rentang tanggal yang dipakai bersama oleh laporan transaksi dan mutasi stok.
const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ value, onChange, children }) => (
  <div className="flex flex-wrap items-end gap-4 mb-6">
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase text-text-secondary-light">Periode</label>
      <select
        value={value.period}
        onChange={(e) => onChange(applyPeriod(value, e.target.value as ReportPeriod))}
        className={fieldClass}
      >
        {PERIOD_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase text-text-secondary-light">Dari Tanggal</label>
      <input
        type="date"
        value={value.startDate}
        onChange={(e) => onChange(applyDate(value, 'startDate', e.target.value))}
        className={fieldClass}
      />
    </div>
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase text-text-secondary-light">
        Sampai Tanggal
      </label>
      <input
        type="date"
        value={value.endDate}
        onChange={(e) => onChange(applyDate(value, 'endDate', e.target.value))}
        className={fieldClass}
      />
    </div>
    {children}
  </div>
);

export default DateRangeFilter;
