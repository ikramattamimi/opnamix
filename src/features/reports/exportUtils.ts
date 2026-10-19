import type { Product } from '@/features/products/types';
import type { Service } from '@/features/services/types';
import type { StockInReceipt } from '@/features/stock-in/types';
import type { StockOutRequest } from '@/features/stock-out/types';
import { toDate } from '@/lib/utils';
import { CATEGORY_META } from '@/features/products/catalog';
import type { MutationRow, TransactionRow } from './types';

type XLSXModule = typeof import('xlsx');
type ExcelRow = Record<string, string | number>;

const loadXLSX = async (): Promise<XLSXModule> => import('xlsx');

export const exportStockInToExcel = async (data: StockInReceipt[]) => {
  try {
    const XLSX = await loadXLSX();
    const excelData: ExcelRow[] = [];
    data.forEach((receipt) => {
      if (receipt.items && receipt.items.length > 0) {
        receipt.items.forEach((item, idx) => {
          excelData.push({
            'No. Invoice': idx === 0 ? receipt.invoiceNumber : '',
            Supplier: idx === 0 ? receipt.supplierName : '',
            Tanggal: idx === 0 ? receipt.date : '',
            'Nama Produk': item.productName || '-',
            Kategori: item.category || '-',
            Jumlah: item.quantity,
            Satuan: item.unit || '-',
            'Exp. Date': item.expiryDate || '-',
            Status: idx === 0 ? receipt.status : '',
            'Diterima Oleh': idx === 0 ? receipt.receivedBy : '',
          });
        });
      } else {
        excelData.push({
          'No. Invoice': receipt.invoiceNumber,
          Supplier: receipt.supplierName,
          Tanggal: receipt.date,
          'Nama Produk': '-',
          Kategori: '-',
          Jumlah: 0,
          Satuan: '-',
          'Exp. Date': '-',
          Status: receipt.status,
          'Diterima Oleh': receipt.receivedBy,
        });
      }
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    ws['!cols'] = [
      { wch: 20 },
      { wch: 25 },
      { wch: 15 },
      { wch: 30 },
      { wch: 18 },
      { wch: 10 },
      { wch: 10 },
      { wch: 15 },
      { wch: 12 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Stok Masuk');
    XLSX.writeFile(wb, `Stok_Masuk_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Error exporting stock-in data:', error);
  }
};

export const exportStockOutToExcel = async (data: StockOutRequest[]) => {
  try {
    const XLSX = await loadXLSX();
    const excelData: ExcelRow[] = [];
    data.forEach((req) => {
      const tipeSumber =
        req.tipeSumber === 'PENGAJUAN_NAKES'
          ? 'Pengajuan Nakes'
          : req.tipeSumber === 'KASIR_LANGSUNG'
            ? 'Kasir Langsung'
            : req.tipeSumber;
      if (req.drugs && req.drugs.length > 0) {
        req.drugs.forEach((drug, idx) => {
          excelData.push({
            'Request ID': idx === 0 ? req.requestId : '',
            Tanggal: idx === 0 ? req.date : '',
            'Nama Pasien': idx === 0 ? req.patient?.fullName || '-' : '',
            'Tipe Sumber': idx === 0 ? tipeSumber : '',
            'Diminta Oleh': idx === 0 ? req.requestedBy || '-' : '',
            'Nama Obat': drug.productName || '-',
            Jumlah: drug.quantity,
            Harga: drug.price || 0,
            'Biaya Layanan': idx === 0 ? req.serviceFee || 0 : '',
            Diskon: idx === 0 ? req.discount || 0 : '',
            Total: idx === 0 ? req.totalAmount || 0 : '',
            Status: idx === 0 ? req.status : '',
          });
        });
      } else {
        excelData.push({
          'Request ID': req.requestId,
          Tanggal: req.date,
          'Nama Pasien': req.patient?.fullName || '-',
          'Tipe Sumber': tipeSumber,
          'Diminta Oleh': req.requestedBy || '-',
          'Nama Obat': '-',
          Jumlah: 0,
          Harga: 0,
          'Biaya Layanan': req.serviceFee || 0,
          Diskon: req.discount || 0,
          Total: req.totalAmount || 0,
          Status: req.status,
        });
      }
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    ws['!cols'] = [
      { wch: 20 },
      { wch: 15 },
      { wch: 25 },
      { wch: 18 },
      { wch: 20 },
      { wch: 30 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Stok Keluar');
    XLSX.writeFile(wb, `Stok_Keluar_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Error exporting stock-out data:', error);
  }
};

export const exportProductsToExcel = async (data: Product[]) => {
  try {
    const XLSX = await loadXLSX();
    const excelData = data.map((row) => ({
      Kode: row.code || '-',
      'Nama Obat': row.name,
      Jenis: row.category,
      Stok: row.stock,
      Satuan: row.unit,
      'Harga Jual': row.sellingPrice,
      // Product belum punya tanggal kadaluarsa, jadi kolom ini selalu '-'.
      Kadaluarsa: '-',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    ws['!cols'] = [
      { wch: 15 },
      { wch: 30 },
      { wch: 20 },
      { wch: 10 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'Data Produk');
    XLSX.writeFile(wb, `Data_Produk_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Error exporting products:', error);
  }
};

export const exportServicesToExcel = async (data: Service[]) => {
  try {
    const XLSX = await loadXLSX();
    const excelData = data.map((row) => ({
      'Kode Jasa': row.code,
      'Nama Jasa': row.name,
      Kategori: row.categoryName,
      Harga: row.price,
      Deskripsi: row.description || '-',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    ws['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Data Jasa');
    XLSX.writeFile(wb, `Data_Jasa_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Error exporting services:', error);
  }
};

const writeSheet = async (rows: ExcelRow[], sheet: string, file: string, widths: number[]) => {
  const XLSX = await loadXLSX();
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = widths.map((wch) => ({ wch }));
  XLSX.utils.book_append_sheet(wb, ws, sheet);
  XLSX.writeFile(wb, file);
};

const today = () => new Date().toISOString().split('T')[0];

// Laporan Stok · Posisi stok per hari ini
export const exportStockPositionToExcel = (
  products: Product[],
  lastOpname: ReadonlyMap<string, Date>,
) =>
  writeSheet(
    products.map((p) => ({
      Produk: p.name,
      Merek: p.brand || 'Generik',
      Kategori: CATEGORY_META[p.category]?.short ?? p.category,
      Sediaan: p.dosageForm || '-',
      Stok: p.stock,
      Satuan: p.unit,
      Minimum: p.minStock,
      'Harga beli': p.purchasePrice,
      Nilai: Math.max(0, p.stock) * p.purchasePrice,
      'Opname terakhir': lastOpname.get(p.id)?.toLocaleDateString('id-ID') ?? 'Belum pernah',
    })),
    'Posisi stok',
    `Posisi_Stok_${today()}.xlsx`,
    [32, 16, 12, 14, 8, 10, 9, 12, 14, 16],
  );

// Laporan Stok · Mutasi stok dalam periode
export const exportMutationsToExcel = (rows: MutationRow[], label: string) =>
  writeSheet(
    rows.map((m) => ({
      Waktu: toDate(m.date).toLocaleString('id-ID'),
      'No. transaksi': m.code,
      Tipe: m.type,
      Produk: m.product.name,
      Merek: m.product.brand || 'Generik',
      Jumlah: m.qty,
      Satuan: m.product.unit,
      'Nilai (harga beli)': m.value,
      Oleh: m.by,
      Keterangan: m.note,
    })),
    'Mutasi stok',
    `Mutasi_Stok_${label.replace(/[^\w-]+/g, '_')}.xlsx`,
    [20, 22, 12, 32, 16, 9, 10, 16, 18, 36],
  );

// Laporan Stok · Transaksi keluar dalam periode
export const exportTransactionsToExcel = (rows: TransactionRow[], label: string) =>
  writeSheet(
    rows.map((t) => ({
      Waktu: toDate(t.date).toLocaleString('id-ID'),
      Kode: t.code,
      Jenis: t.kind,
      Status: t.status,
      Pasien: t.patient,
      'Diajukan oleh': t.requestedBy,
      'Diproses oleh': t.processedBy ?? '-',
      'Obat & BHP': t.drugs.map((d) => `${d.name} (${d.quantity})`).join(', ') || '-',
      Jasa: t.services.map((s) => s.name).join(', ') || '-',
      'Nilai obat': t.drugTotal,
      'Nilai jasa': t.serviceTotal,
      'Biaya layanan': t.serviceFee,
      Diskon: t.discount,
      Total: t.total,
    })),
    'Transaksi keluar',
    `Transaksi_Keluar_${label.replace(/[^\w-]+/g, '_')}.xlsx`,
    [20, 22, 11, 10, 22, 18, 18, 40, 24, 12, 12, 12, 10, 12],
  );
