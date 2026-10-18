export interface StockInItem {
  id: string;
  productId: string;
  productName: string;
  category: string;
  expiryDate: string;
  quantity: number;
  unit: string;
  batch: string; // kosong kalau tidak diisi
  price: number; // harga beli per satuan
}

export interface StockInReceipt {
  id: string;
  invoiceNumber: string;
  supplierName: string;
  date: string;
  items: StockInItem[];
  status: string;
  receivedBy: string;
  evidenceUrl?: string | null; // Add evidenceUrl
  total: number; // nilai pembelian
  createdAt: string; // waktu dicatat (untuk jam di daftar)
}
