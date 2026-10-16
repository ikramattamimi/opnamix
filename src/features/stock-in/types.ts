export interface StockInItem {
  id: string;
  productId: string;
  productName: string;
  category: string;
  expiryDate: string;
  quantity: number;
  unit: string;
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
}
