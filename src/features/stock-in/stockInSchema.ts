import { z } from 'zod';

export const MAX_RECEIPT_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Foto bukti nota: opsional, harus gambar, maksimal 5MB.
// Dikompres ke WebP sebelum diupload.
export const receiptFileSchema = z
  .instanceof(File)
  .refine((file) => file.type.startsWith('image/'), 'File harus berupa gambar')
  .refine((file) => file.size <= MAX_RECEIPT_FILE_SIZE, 'Ukuran file maksimal 5MB');

export const stockInItemSchema = z.object({
  productId: z.string().min(1, 'Pilih produk terlebih dahulu'),
  expiryDate: z.string().min(1, 'Tanggal kedaluwarsa wajib diisi'),
  // Input angka yang dikosongkan bernilai undefined
  quantity: z
    .number()
    .optional()
    .superRefine((value, ctx) => {
      if (value === undefined) {
        ctx.addIssue({ code: 'custom', message: 'Jumlah wajib diisi' });
      } else if (value <= 0) {
        ctx.addIssue({ code: 'custom', message: 'Jumlah harus lebih dari 0' });
      }
    })
    .transform((value) => value as number),
  unit: z.string(),
});

export const stockInFormSchema = z.object({
  invoiceNumber: z.string().refine((value) => value.trim() !== '', 'Nomor nota wajib diisi'),
  supplierName: z.string(), // opsional
  date: z.string().min(1, 'Tanggal penerimaan wajib diisi'),
  items: z.array(stockInItemSchema).min(1),
  file: receiptFileSchema.nullable(),
});

export type StockInFormInput = z.input<typeof stockInFormSchema>;
export type StockInFormValues = z.output<typeof stockInFormSchema>;
export type StockInItemInput = StockInFormInput['items'][number];

export const emptyStockInItem = (): StockInItemInput => ({
  productId: '',
  expiryDate: '',
  quantity: 0,
  unit: 'Box',
});

export const todayIsoDate = () => new Date().toISOString().split('T')[0];
