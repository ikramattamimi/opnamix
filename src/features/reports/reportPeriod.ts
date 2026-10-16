export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface DateRange {
  start: string;
  end: string;
}

// Nilai filter tanggal laporan: periode yang dipilih dan rentangnya.
export interface ReportDateRange {
  period: ReportPeriod;
  startDate: string;
  endDate: string;
}

export const PERIOD_OPTIONS: { value: ReportPeriod; label: string }[] = [
  { value: 'daily', label: 'Hari Ini' },
  { value: 'weekly', label: '7 Hari Terakhir' },
  { value: 'monthly', label: 'Bulan Ini' },
  { value: 'yearly', label: 'Tahun Ini' },
  { value: 'custom', label: 'Custom' },
];

// Format YYYY-MM-DD lewat toISOString, sama seperti nilai awal input tanggal.
export const toDateInputValue = (date: Date): string => date.toISOString().split('T')[0];

// Rentang tanggal untuk periode; null untuk 'custom' (tanggal tidak diubah).
export const getPeriodRange = (period: ReportPeriod, today = new Date()): DateRange | null => {
  let start: Date;
  let end: Date;

  switch (period) {
    case 'daily':
      start = today;
      end = today;
      break;
    case 'weekly':
      start = new Date(today);
      start.setDate(today.getDate() - 7);
      end = today;
      break;
    case 'monthly':
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      break;
    case 'yearly':
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today.getFullYear(), 11, 31);
      break;
    case 'custom':
      return null;
  }

  return { start: toDateInputValue(start), end: toDateInputValue(end) };
};

// Nilai awal filter laporan: periode hari ini.
export const createInitialDateRange = (today = new Date()): ReportDateRange => ({
  period: 'daily',
  startDate: toDateInputValue(today),
  endDate: toDateInputValue(today),
});

// Ganti periode: tanggal ikut berubah, kecuali untuk 'custom'.
export const applyPeriod = (
  current: ReportDateRange,
  period: ReportPeriod,
  today = new Date(),
): ReportDateRange => {
  const range = getPeriodRange(period, today);
  return range ? { period, startDate: range.start, endDate: range.end } : { ...current, period };
};

// Mengubah tanggal secara manual selalu memindah periode ke 'custom'.
export const applyDate = (
  current: ReportDateRange,
  field: 'startDate' | 'endDate',
  value: string,
): ReportDateRange => ({ ...current, [field]: value, period: 'custom' });
