export interface PatientData {
  fullName: string;
  medicalRecordNumber: string;
  birthDate: string;
  diagnosis: string;
}

export interface RequestedDrug {
  id: string;
  productId: string; // obat_id string
  productName: string;
  quantity: number;
  unit: string;
  instructions: string;
  price?: number; // Add price field
}

export interface RequestedService {
  id: string; // jasa_id
  name: string;
  price: number;
}

export interface StockOutRequest {
  id: string;
  requestId: string; // nomor
  patient: PatientData;
  drugs: RequestedDrug[];
  services: RequestedService[]; // Changed from string[] to object array
  totalAmount: number; // Keep this as grand total (after discount)
  discount: number; // diskon nominal
  serviceFee: number; // biaya layanan/admin nominal
  requestedBy: string;
  requestedByAvatar: string;
  status: 'Menunggu' | 'Selesai';
  date: string;
  tipeSumber: 'PENGAJUAN_NAKES'; // New field
  createdBy: string; // Add createdBy for Nakes filtering
}

export interface StockOutManualItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  instructions: string;
}

export interface StockOutManual {
  id: string;
  requestId: string;
  patient: PatientData;
  items: StockOutManualItem[];
  services: string[]; // New: Manual also supports services
  date: string;
  reason: string;
  tipeSumber: 'KASIR_LANGSUNG'; // New field
}
