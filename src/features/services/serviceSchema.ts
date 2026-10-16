import { z } from 'zod';

// Skema form jasa. Harga yang dikosongkan bernilai undefined.
export const serviceFormSchema = z.object({
  name: z.string().refine((value) => value.trim().length >= 3, 'Nama jasa minimal 3 karakter'),
  code: z.string(),
  categoryId: z.string(),
  price: z
    .number()
    .optional()
    .refine((value) => value !== undefined && value > 0, 'Harga harus lebih dari 0'),
  description: z.string(),
});

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;

export const emptyServiceFormValues: ServiceFormValues = {
  name: '',
  code: '',
  categoryId: '',
  price: undefined,
  description: '',
};

export const serviceCategoryFormSchema = z.object({
  name: z.string().refine((value) => value.trim() !== '', 'Nama kategori wajib diisi.'),
  description: z.string(),
});

export type ServiceCategoryFormValues = z.infer<typeof serviceCategoryFormSchema>;

export const generateServiceCode = (name?: string) => {
  const normalizedName =
    (name || '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '')
      .slice(0, 4) || 'SRV';
  const timestamp = Date.now().toString().slice(-6);
  return `${normalizedName}-${timestamp}`;
};

export const generateCategoryCodePreview = (name?: string) =>
  (name || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
    .slice(0, 20) || 'KATEGORI';
