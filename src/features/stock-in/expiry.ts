// Tanggal kedaluwarsa batch. Isian POS memakai bulan ("2027-03"); database
// menyimpan tanggal, diisi hari terakhir bulan itu.

export const EXPIRY_WARN_MONTHS = 6;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

// Tanggal lokal dari "YYYY-MM" atau "YYYY-MM-DD"; null kalau tidak valid
function parseExpiry(value?: string | null): Date | null {
  const match = value?.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  if (m < 1 || m > 12) return null;
  // Tanpa hari: akhir bulan
  return d ? new Date(y, m - 1, d) : new Date(y, m, 0);
}

const pad = (n: number) => String(n).padStart(2, '0');

// "2027-03" → "2027-03-31"; kosong/tidak valid → ''
export function monthToExpiryDate(month: string): string {
  const date = parseExpiry(month);
  return date ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` : '';
}

// Kedaluwarsa kurang dari `months` bulan lagi (termasuk yang sudah lewat)
export function isExpiringSoon(
  value: string | null | undefined,
  now: Date = new Date(),
  months: number = EXPIRY_WARN_MONTHS,
): boolean {
  const date = parseExpiry(value);
  if (!date) return false;
  const limit = new Date(now.getFullYear(), now.getMonth() + months, now.getDate());
  return date < limit;
}

// "Mar 2027"; tidak valid → '-'
export function formatExpiry(value?: string | null): string {
  const date = parseExpiry(value);
  return date ? `${MONTHS[date.getMonth()]} ${date.getFullYear()}` : '-';
}

// Batch lama diisi "-" atau "EXP: <tanggal>" (form lama tidak punya isian batch)
export function cleanBatch(batch?: string | null): string {
  const value = batch?.trim() ?? '';
  return value === '-' || /^EXP:/i.test(value) ? '' : value;
}
