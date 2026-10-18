// Utilitas teks kecil.

// Jarak Levenshtein: jumlah sisip/hapus/ganti huruf untuk mengubah a menjadi b
export function levenshtein(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = temp;
    }
  }
  return prev[b.length];
}

// Kandidat paling mirip yang bukan dirinya sendiri (kemungkinan salah ketik),
// atau null kalau tidak ada yang cukup dekat.
export function closestMatch(word: string, candidates: readonly string[], maxDistance = 3) {
  const target = word.toLocaleLowerCase('id-ID');
  let best: string | null = null;
  let bestDistance = maxDistance + 1;
  for (const candidate of candidates) {
    const d = levenshtein(target, candidate.toLocaleLowerCase('id-ID'));
    if (d > 0 && d < bestDistance) {
      best = candidate;
      bestDistance = d;
    }
  }
  return best;
}
