export enum ServiceCategory {
  Konsultasi = 'Konsultasi',
  Tindakan = 'Tindakan',
  TesLab = 'Tes Lab',
  Vaksinasi = 'Vaksinasi',
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
