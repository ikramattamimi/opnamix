// Format tampilan bersama (locale id-ID).

const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
};

// Tanggal saja, contoh "05 Okt 2026". Kosong atau tidak valid menjadi '-'.
export const formatDateForDisplay = (value?: string, options?: Intl.DateTimeFormatOptions) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString('id-ID', options || DEFAULT_DATE_OPTIONS);
};

// Tanggal dan jam, contoh "05 Okt 2026 14.30". Nilai tidak valid ditampilkan apa adanya.
export const formatDateTimeForDisplay = (value?: string) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('id-ID', {
    ...DEFAULT_DATE_OPTIONS,
    hour: '2-digit',
    minute: '2-digit',
  });
};
