export enum Category {
  Obat = 'Obat',
  BHP = 'BHP (Habis Pakai)',
  Imunisasi = 'Imunisasi',
  Alkes = 'Alat Kesehatan',
}

export enum ServiceCategory {
  Konsultasi = 'Konsultasi',
  Tindakan = 'Tindakan',
  TesLab = 'Tes Lab',
  Vaksinasi = 'Vaksinasi',
}

export enum Unit {
  Tablet = 'Tablet',
  Strip = 'Strip',
  Botol = 'Botol',
  Box = 'Box',
  Ampul = 'Ampul',
  Sachet = 'Sachet',
  Pcs = 'Pcs',
}

export interface PaginationParams {
  page: number;
  perPage: number;
  search?: string; // Optional search term for filtering
  status?: string; // Optional status filter
  createdBy?: string; // Optional filter by creator user ID
  nakesName?: string; // Optional filter by nakes name (nama_nakes column)
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category: Category;
  unit: Unit;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  description: string;
  color: string;
  brand?: string; // merek obat
  composition?: string; // kandungan obat
}

export interface ServiceCategoryType {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isActive: boolean | null;
}

export interface Service {
  id: string;
  code: string; // kode
  name: string; // nama
  categoryId?: string; // Reference to service_categories
  categoryName?: string; // Display name from joined category
  price: number; // harga
  description: string;
  isActive: boolean | null; // is_active
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  // UI helpers
  icon?: string;
  iconColor?: string;
  iconBg?: string;
}
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

// Stock Opname Interfaces
export type OpnameStatus = 'belum_dilaksanakan' | 'sedang_dilaksanakan' | 'selesai';

export interface OpnameItem {
  id: string;
  productId: string;
  productName: string;
  category: string;
  unit: string;
  systemStock: number | null;
  physicalStock?: number | null;
  difference?: number | null;
  stokFinal?: number | null;
  reason?: string | null;
  detailStatus?: 'pending' | 'sesuai' | 'disesuaikan';
}

export interface StockOpname {
  id: string;
  opnameNumber: string;
  scheduleDate: string; // tanggal_jadwal
  status: OpnameStatus;
  auditor: string;
  currentStep: number; // 1, 2, or 3
  selectedObatIds?: string[];
  completedAt?: string;
  scheduleName?: string; // from opname_schedule.nama
  items: OpnameItem[];
}

export type PengulanganOpname = 'BULANAN' | 'TRIWULAN' | 'TAHUNAN';

export interface OpnameSchedule {
  id: string;
  nama: string;
  tanggalAudit: number | null; // 1-28
  waktuJam: number | null;
  waktuMenit: number | null;
  pengulangan: PengulanganOpname;
  obatIds: string[] | null; // null = semua obat
  durasiPengerjaan: number | null;
  isActive: boolean | null;
}

export interface OpnameScheduleConfig {
  nama?: string;
  pengulangan: PengulanganOpname;
  dayOfMonth: number; // tanggal_audit
  waktuJam: number;
  waktuMenit: number;
  durasiPengerjaan?: number;
  obatIds?: string[] | null;
}

export type ViewType =
  | 'dashboard'
  | 'master-data-produk'
  | 'master-data-jasa'
  | 'stok-masuk'
  | 'stok-keluar'
  | 'stok-opname'
  | 'laporan-stok';

// Route paths for React Router
// ==================== NOTIFICATIONS ====================
export type NotificationType =
  | 'STOCK_OUT_REQUEST'
  | 'STOCK_OUT_PROCESSED'
  | 'STOCK_LOW'
  | 'STOCK_EMPTY'
  | 'OPNAME_STARTED'
  | 'OPNAME_COMPLETED'
  | 'OPNAME_CREATED'
  | 'OPNAME_STEP_CHANGED'
  | 'STOCK_IN'
  | 'STOCK_OUT_DIRECT'
  | 'OPNAME_DISCREPANCY'
  | 'PRODUCT_ADDED'
  | 'PRODUCT_DELETED'
  | 'SERVICE_ADDED';

export interface AppNotification {
  id: number;
  user_id: string | null;
  target_role: string | null;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export const ROUTES = {
  DASHBOARD: '/',
  MASTER_DATA_PRODUK: '/master-data/produk',
  MASTER_DATA_JASA: '/master-data/jasa',
  STOK_MASUK: '/transaksi/stok-masuk',
  STOK_KELUAR: '/transaksi/stok-keluar',
  STOK_OPNAME: '/audit/stok-opname',
  RIWAYAT_OPNAME: '/audit/stok-opname/riwayat',
  KONFIGURASI_OPNAME: '/audit/stok-opname/konfigurasi',
  PELAKSANAAN_OPNAME: '/audit/stok-opname/pelaksanaan/:opnameId',
  DETAIL_OPNAME: '/audit/stok-opname/detail/:opnameId',
  LAPORAN_STOK: '/laporan/stok',
  USER_MANAGEMENT: '/pengaturan/user-management',
  PROFIL: '/pengaturan/profil',
  NOTIFICATIONS: '/notifikasi',
} as const;
