// Password acak yang mudah dibaca (tanpa huruf/angka yang mirip seperti l/1/O/0)
const CHARS = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generatePassword(length = 10): string {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => CHARS[n % CHARS.length]).join('');
}
