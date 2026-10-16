import type { Product, Service, StockInReceipt, StockOutRequest } from '../types';
import type { RecentTransaction, StockMutationRow, TransactionReportRow } from './api';

type XLSXModule = typeof import('xlsx');
type ExcelRow = Record<string, string | number>;

const loadXLSX = async (): Promise<XLSXModule> => import('xlsx');

export const exportTransactionReportToExcel = async (
  data: TransactionReportRow[],
  startDate: string,
  endDate: string,
) => {
  try {
    const XLSX = await loadXLSX();
    const excelData = data.map((row) => ({
      Tanggal: new Date(row.date).toLocaleString('id-ID'),
      'Nomor Referensi': row.id,
      Tipe: row.type === 'masuk' ? 'Masuk' : 'Keluar',
      'Atas Nama': row.patient || '-',
      Nakes: row.nakes || '-',
      Sumber: row.source || '-',
      Obat: row.items || '-',
      'Detail Obat': row.drugDetails?.length
        ? row.drugDetails
            .map(
              (drug) =>
                `${drug.name} | qty ${drug.quantity} | harga Rp ${Number(drug.price || 0).toLocaleString('id-ID')} | subtotal Rp ${Number(drug.subtotal || 0).toLocaleString('id-ID')}`,
            )
            .join(' ; ')
        : '-',
      Jasa: row.services || '-',
      'Detail Jasa': row.serviceDetails?.length
        ? row.serviceDetails
            .map(
              (service) =>
                `${service.name} | qty ${service.quantity} | harga Rp ${Number(service.price || 0).toLocaleString('id-ID')} | subtotal Rp ${Number(service.subtotal || 0).toLocaleString('id-ID')}`,
            )
            .join(' ; ')
        : '-',
      'Biaya Layanan': `Rp ${Number(row.serviceFee || 0).toLocaleString('id-ID')}`,
      Diskon: row.discount ? `Rp ${Number(row.discount || 0).toLocaleString('id-ID')}` : '-',
      Total: `Rp ${row.total?.toLocaleString('id-ID') || 0}`,
      Status: row.status,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    ws['!cols'] = [
      { wch: 20 },
      { wch: 25 },
      { wch: 10 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 40 },
      { wch: 60 },
      { wch: 35 },
      { wch: 60 },
      { wch: 15 },
      { wch: 10 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Transaksi');
    const filename = `Laporan_Transaksi_${startDate}_to_${endDate}.xlsx`;
    XLSX.writeFile(wb, filename);
  } catch (error) {
    console.error('Error exporting transaction report:', error);
  }
};

export const exportStockMutationToExcel = async (
  data: StockMutationRow[],
  startDate: string,
  endDate: string,
) => {
  try {
    const XLSX = await loadXLSX();
    const excelData = data.map((row) => ({
      Tanggal: new Date(row.date).toLocaleString('id-ID'),
      'Nomor Transaksi': row.trxNumber,
      Tipe:
        row.type === 'masuk'
          ? 'Masuk'
          : row.type === 'keluar'
            ? 'Keluar'
            : row.type === 'penyesuaian'
              ? 'Penyesuaian (Opname)'
              : row.type,
      Sumber: row.source || '-',
      'Item Obat': row.itemName || '-',
      'Qty/Selisih': row.qty,
      'Stok Sistem': row.systemStock ?? '-',
      'Stok Fisik': row.physicalStock ?? '-',
      'Stok Final': row.finalStock ?? '-',
      Status: row.status,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    ws['!cols'] = [
      { wch: 20 },
      { wch: 25 },
      { wch: 22 },
      { wch: 20 },
      { wch: 30 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Mutasi Stok');
    const filename = `Mutasi_Stok_${startDate}_to_${endDate}.xlsx`;
    XLSX.writeFile(wb, filename);
  } catch (error) {
    console.error('Error exporting stock mutation report:', error);
  }
};

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

export const exportRecentTransactionsToExcel = async (data: RecentTransaction[]) => {
  try {
    const XLSX = await loadXLSX();
    const excelData = data.map((row) => ({
      Tanggal: row.date,
      'ID Transaksi': row.id,
      Item: row.name,
      Kategori: row.category,
      Tipe: row.status,
      Jumlah: row.amount,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    ws['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 35 }, { wch: 20 }, { wch: 15 }, { wch: 10 }];

    XLSX.utils.book_append_sheet(wb, ws, 'Transaksi Terbaru');
    XLSX.writeFile(wb, `Transaksi_Terbaru_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Error exporting recent transactions:', error);
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
