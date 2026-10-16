import type { Product } from '@/features/products/types';
import type { Service } from '@/features/services/types';
import { RequestedDrug, StockOutRequest } from './types';

// Perubahan item permintaan saat mode edit di detail permintaan.
// Semua fungsi murni: menerima permintaan lama dan mengembalikan salinan baru.

type ProductOption = Pick<Product, 'id' | 'name' | 'sellingPrice'> & { unit: string };
type ServiceOption = Pick<Service, 'id' | 'name' | 'price'>;

export type DrugField = 'productId' | 'quantity';

export const updateDrug = (
  req: StockOutRequest,
  drugId: string,
  field: DrugField,
  value: string | number,
  products: ProductOption[],
): StockOutRequest => ({
  ...req,
  drugs: req.drugs.map((drug) => {
    if (drug.id !== drugId) return drug;

    if (field === 'productId') {
      const product = products.find((item) => item.id === value);
      return {
        ...drug,
        productId: String(value),
        productName: product?.name || '',
        unit: product?.unit || drug.unit,
        price: product?.sellingPrice || 0,
      };
    }

    return { ...drug, quantity: Math.max(1, Number(value) || 1) };
  }),
});

// id dioper dari pemanggil (misalnya `tmp-${Date.now()}`) supaya fungsi tetap murni
export const addDrug = (
  req: StockOutRequest,
  product: ProductOption,
  id: string,
): StockOutRequest => {
  const newDrug: RequestedDrug = {
    id,
    productId: product.id,
    productName: product.name,
    quantity: 1,
    unit: product.unit,
    instructions: '-',
    price: product.sellingPrice,
  };
  return { ...req, drugs: [...req.drugs, newDrug] };
};

export const removeDrug = (req: StockOutRequest, drugId: string): StockOutRequest => ({
  ...req,
  drugs: req.drugs.filter((drug) => drug.id !== drugId),
});

export const toggleService = (
  req: StockOutRequest,
  serviceId: string,
  services: ServiceOption[],
): StockOutRequest => {
  if (req.services.some((service) => service.id === serviceId)) {
    return { ...req, services: req.services.filter((service) => service.id !== serviceId) };
  }

  const service = services.find((item) => item.id === serviceId);
  if (!service) return req;

  return {
    ...req,
    services: [...req.services, { id: service.id, name: service.name, price: service.price }],
  };
};

// Pesan error pertama yang ditemukan, atau null kalau permintaan boleh disimpan
export const validateRequestEdit = (req: StockOutRequest): string | null => {
  if (!req.patient.fullName.trim()) return 'Nama pasien wajib diisi.';
  if (req.drugs.length === 0 && req.services.length === 0) {
    return 'Tambahkan minimal satu obat atau satu jasa.';
  }
  if (req.drugs.some((drug) => !drug.productId || drug.quantity <= 0)) {
    return 'Pastikan semua item obat sudah dipilih dan jumlahnya valid.';
  }
  return null;
};

// Salinan dalam supaya perubahan di mode edit tidak menyentuh data asli
export const cloneRequest = (req: StockOutRequest): StockOutRequest => ({
  ...req,
  patient: { ...req.patient },
  drugs: req.drugs.map((drug) => ({ ...drug })),
  services: req.services.map((service) => ({ ...service })),
});
