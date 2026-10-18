// Format dan parsing angka untuk isian (rupiah, jumlah).

export const formatThousands = (n: number) => Math.round(n).toLocaleString('id-ID');

// Ambil digit saja: "Rp 12.500" → 12500; kosong → null
export function parseDigits(text: string): number | null {
  const digits = text.replace(/\D/g, '');
  return digits ? Number(digits) : null;
}

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
