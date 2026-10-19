import { CATEGORY_META } from '@/features/products/catalog';
import { diffOf, diffReasonLabel, finalOf, runStats, valueOf } from './catalog';
import type { OpnameRun } from './types';

// Ekspor laporan satu sesi opname ke Excel: lembar ringkasan dan lembar produk.
export async function exportOpnameToExcel(run: OpnameRun) {
  const XLSX = await import('xlsx');
  const s = runStats(run.items);
  const summary = [
    ['Opname', run.name],
    ['Kode', run.code],
    ['Jadwal', run.scheduleName ?? 'Opname cepat'],
    ['Petugas', run.auditor],
    ['Selesai', run.completedAt ? new Date(run.completedAt).toLocaleString('id-ID') : '-'],
    [],
    ['Produk dihitung', s.n],
    ['Sesuai', s.ok],
    ['Selisih', s.diff],
    ['Nilai kurang', s.minus],
    ['Nilai lebih', s.plus],
    ['Nilai bersih', s.net],
  ];
  const rows = run.items.map((i) => ({
    Produk: i.product.name,
    Merek: i.product.brand || 'Generik',
    Kategori: CATEGORY_META[i.product.category]?.short ?? i.product.category,
    Satuan: i.product.unit,
    Sistem: i.systemStock,
    Fisik: i.physicalStock ?? '',
    Final: finalOf(i) ?? '',
    Selisih: diffOf(i) ?? '',
    'Harga beli': i.product.purchasePrice,
    Nilai: valueOf(i),
    Alasan: diffReasonLabel(i) ?? '',
    Catatan: i.note ?? '',
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'Ringkasan');
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [30, 16, 12, 10, 8, 8, 8, 8, 12, 12, 24, 30].map((wch) => ({ wch }));
  XLSX.utils.book_append_sheet(wb, ws, 'Produk');
  XLSX.writeFile(wb, `Opname_${run.code}.xlsx`);
}
