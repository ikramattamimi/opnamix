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

// ---- Angka dan rupiah ----

const MINUS = '−';
const sign = (n: number) => (n > 0 ? '+' : n < 0 ? MINUS : '');

// "Rp 12.500"
export const rp = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID')}`;

// "Rp 1,3 jt" untuk angka jutaan ke atas, selain itu sama dengan rp()
export const rpShort = (n: number) =>
  Math.abs(n) >= 1e6
    ? `${n < 0 ? '-' : ''}Rp ${(Math.abs(n) / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`
    : rp(n);

// "+Rp 12.500" / "−Rp 3.000" / "Rp 0"
export const rpSigned = (n: number) => sign(n) + rp(Math.abs(n));

// "+12" / "−3" / "0"
export const signed = (n: number) => sign(n) + Math.abs(n).toLocaleString('id-ID');

// ---- Waktu relatif ----

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// "5 mnt lalu" / "3 jam lalu" / "2 hari lalu"
export const agoShort = (date: Date, now: Date = new Date()) => {
  const minutes = Math.max(0, Math.round((now.getTime() - date.getTime()) / 60000));
  if (minutes < 1) return 'baru saja';
  if (minutes < 60) return `${minutes} mnt lalu`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} jam lalu`;
  return `${Math.round(minutes / 1440)} hari lalu`;
};

// Judul grup per hari: "Hari ini · Minggu, 18 Oktober", "Kemarin · …", atau tanggalnya saja
export const dayLabel = (date: Date, now: Date = new Date()) => {
  const diff = Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / 864e5);
  const base = `${HARI[date.getDay()]}, ${date.getDate()} ${BULAN[date.getMonth()]}`;
  if (diff === 0) return `Hari ini · ${base}`;
  if (diff === 1) return `Kemarin · ${base}`;
  return date.getFullYear() === now.getFullYear() ? base : `${base} ${date.getFullYear()}`;
};

export const monthName = (monthIndex: number) => BULAN[monthIndex];

// Dua huruf awal nama untuk avatar: "Rina Kartika" → "RK"
export const initials = (name?: string | null) => {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
};
