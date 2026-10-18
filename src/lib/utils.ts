import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// tailwind-merge perlu tahu token tambahan di tailwind.config.js. Tanpa ini,
// `text-meta` dianggap warna teks dan membuang `text-primary` di kelas yang sama.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      spacing: ['rail', 'sbw', 'below-header'],
    },
    classGroups: {
      'font-size': [{ text: ['2xs', 'meta'] }],
      shadow: [{ shadow: ['float'] }],
      rounded: [{ rounded: ['card', 'control'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Build a toast message from a base text and the error's own message
 * (Error, Supabase PostgrestError, or plain { message } object).
 * Example: 'Gagal menyimpan transaksi: Stok tidak cukup untuk X. Tersedia: 1, diminta: 2'
 */
export function withErrorDetail(base: string, error: unknown): string {
  const detail =
    error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
      ? error.message.trim()
      : '';
  return detail ? `${base}: ${detail}` : `${base}.`;
}

/**
 * Sanitize price input by removing leading zeros
 * Example: '007' → '7', '000' → '0'
 */
export function sanitizePriceInput(value: string): string {
  if (!value) return '';
  // Remove all non-numeric characters first
  const numericOnly = value.replace(/[^0-9]/g, '');
  // Remove leading zeros, but keep at least one digit
  const sanitized = numericOnly.replace(/^0+(?=.)/, '');
  return sanitized;
}

/**
 * `message` dari error apa pun yang ditangkap di catch (Error, Supabase
 * PostgrestError/AuthError, atau objek { message }). undefined kalau tidak ada.
 */
export function getErrorMessage(error: unknown): string | undefined {
  return (error as { message?: string } | null | undefined)?.message;
}

/**
 * `new Date(value)` yang juga menerima null/undefined dari kolom database,
 * dengan hasil yang sama seperti JavaScript: null → epoch, undefined → Invalid Date.
 */
export function toDate(value: string | number | Date | null | undefined): Date {
  return new Date(value as string);
}
