// Operasi keranjang POS, dipakai POS Stok Keluar dan POS Stok Masuk.
// Semua fungsi murni: menerima daftar baris dan mengembalikan salinan baru.

export interface CartLineBase {
  productId: string;
  quantity: number;
}

// Tambah 1 ke baris yang sudah ada, atau buat baris baru lewat `create`.
// `max` membatasi jumlah (mis. sisa stok untuk barang keluar).
export function addToCart<T extends CartLineBase>(
  lines: readonly T[],
  productId: string,
  create: () => T,
  max: number = Number.MAX_SAFE_INTEGER,
): T[] {
  const existing = lines.find((line) => line.productId === productId);
  if (!existing) return max >= 1 ? [...lines, create()] : [...lines];
  return lines.map((line) =>
    line.productId === productId ? { ...line, quantity: Math.min(line.quantity + 1, max) } : line,
  );
}

// Jumlah 0 atau kurang menghapus baris
export function setCartQuantity<T extends CartLineBase>(
  lines: readonly T[],
  productId: string,
  quantity: number,
): T[] {
  if (quantity <= 0) return removeFromCart(lines, productId);
  return lines.map((line) => (line.productId === productId ? { ...line, quantity } : line));
}

export const removeFromCart = <T extends CartLineBase>(lines: readonly T[], productId: string) =>
  lines.filter((line) => line.productId !== productId);

export function updateCartLine<T extends CartLineBase>(
  lines: readonly T[],
  productId: string,
  patch: Partial<T>,
): T[] {
  return lines.map((line) => (line.productId === productId ? { ...line, ...patch } : line));
}

export const cartUnits = (lines: readonly CartLineBase[]) =>
  lines.reduce((sum, line) => sum + line.quantity, 0);

// Pilih/lepas id (jasa di keranjang)
export const toggleId = (ids: readonly string[], id: string) =>
  ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
