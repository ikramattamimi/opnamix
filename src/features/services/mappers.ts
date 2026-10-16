import { Service, ServiceCategoryType } from './types';
import type { Tables } from '@/lib/database.types';

export const mapServiceFromDB = (
  item: Tables<'master_jasa'> & { service_categories?: { name: string } | null },
): Service => ({
  id: item.id.toString(),
  code: item.kode,
  name: item.nama,
  categoryId: item.category_id?.toString(),
  categoryName: item.service_categories?.name,
  price: item.harga || 0,
  description: '',
  isActive: item.is_active,
  createdBy: item.created_by,
  updatedBy: item.updated_by,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
  icon: 'medical_services',
  iconColor: 'text-blue-600',
  iconBg: 'bg-blue-100',
});

export const mapServiceCategoryFromDB = (
  item: Tables<'service_categories'>,
): ServiceCategoryType => ({
  id: item.id.toString(),
  name: item.name,
  code: item.code,
  description: item.description,
  isActive: item.is_active,
});
