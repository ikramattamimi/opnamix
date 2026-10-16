import { z } from 'zod';
import { Category, Unit } from './types';
import { getProductDisplayName } from './productDisplay';

// Skema form produk. Angka yang dikosongkan bernilai undefined, jadi semua
// aturan ditulis di superRefine supaya pesannya sama seperti validasi lama.
export const productFormSchema = z
  .object({
    name: z.string(),
    brand: z.string(),
    composition: z.string(),
    category: z.enum(Category),
    unit: z.enum(Unit),
    purchasePrice: z.number().optional(),
    sellingPrice: z.number().optional(),
    stock: z.number().optional(),
    minStock: z.number().optional(),
    description: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.category === Category.Obat) {
      // Nama obat dibentuk dari merek + kandungan
      const generatedName = getProductDisplayName(values);
      if (!generatedName || generatedName.length < 3) {
        ctx.addIssue({
          code: 'custom',
          path: ['name'],
          message: 'Isi merek atau kandungan obat minimal 3 karakter',
        });
      }
    } else if (values.name.trim() === '') {
      ctx.addIssue({ code: 'custom', path: ['name'], message: 'Nama produk wajib diisi' });
    } else if (values.name.length < 3) {
      ctx.addIssue({ code: 'custom', path: ['name'], message: 'Nama produk minimal 3 karakter' });
    }

    if (!values.sellingPrice || values.sellingPrice <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['sellingPrice'],
        message: 'Harga jual harus lebih dari 0',
      });
    }

    if (values.stock === undefined || values.stock < 0) {
      ctx.addIssue({ code: 'custom', path: ['stock'], message: 'Stok tidak boleh negatif' });
    }

    if (values.minStock === undefined || values.minStock < 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['minStock'],
        message: 'Stok minimum tidak boleh negatif',
      });
    } else if (values.minStock && values.stock && values.minStock > values.stock) {
      // Sama seperti aturan lama: stok 0 tidak dibandingkan, supaya produk
      // yang stoknya habis tetap bisa diedit
      ctx.addIssue({
        code: 'custom',
        path: ['minStock'],
        message: 'Stok minimum tidak boleh lebih dari stok awal',
      });
    }
  });

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const emptyProductFormValues: ProductFormValues = {
  name: '',
  brand: '',
  composition: '',
  category: Category.Obat,
  unit: Unit.Tablet,
  purchasePrice: undefined,
  sellingPrice: undefined,
  stock: undefined,
  minStock: undefined,
  description: '',
};
