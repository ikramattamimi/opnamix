import { z } from 'zod';

// Skema form stok keluar. Dipakai form (zodResolver) dan bisa dipakai ulang
// untuk validasi sebelum memanggil API.

const requiredText = (message: string) =>
  z.string().refine((value) => value.trim().length > 0, { message });

const QUANTITY_MESSAGE = 'Jumlah harus lebih dari 0';
const PRODUCT_MESSAGE = 'Produk wajib dipilih';

// Input angka yang dikosongkan menghasilkan NaN (valueAsNumber)
const isPositive = (value: number | undefined) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

// --- Stok keluar manual ---

export const manualItemSchema = z.object({
  productId: z.string().min(1, PRODUCT_MESSAGE),
  productName: z.string(),
  unit: z.string(),
  quantity: z.number({ error: QUANTITY_MESSAGE }).refine(isPositive, QUANTITY_MESSAGE),
});

export const stockOutManualSchema = z.object({
  formNumber: requiredText('Nomor formulir wajib diisi'),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  patientName: requiredText('Nama pasien wajib diisi'),
  patientBirthDate: z.string(),
  reason: z.string(),
  items: z.array(manualItemSchema).min(1),
});

export type ManualItemValues = z.infer<typeof manualItemSchema>;
export type StockOutManualValues = z.infer<typeof stockOutManualSchema>;

export const emptyManualItem = (): ManualItemValues => ({
  productId: '',
  productName: '',
  unit: '',
  quantity: 1,
});

// --- Permintaan nakes ---

export const requestDrugSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  unit: z.string(),
  instructions: z.string(),
  // number atau NaN (input kosong); dicek di superRefine supaya baris draft lolos
  quantity: z.number().or(z.nan()),
});

export type RequestDrugValues = z.infer<typeof requestDrugSchema>;

// Baris yang baru ditambah dan belum diisi tidak ikut divalidasi maupun dikirim
export const isDraftDrugRow = (drug: RequestDrugValues) =>
  !drug.productId &&
  !drug.productName.trim() &&
  (drug.quantity === 1 || drug.quantity === 0 || Number.isNaN(drug.quantity));

export const MIN_CONTENT_MESSAGE = 'Tambahkan minimal 1 obat atau pilih 1 jasa';

export const stockOutRequestSchema = z
  .object({
    formNumber: requiredText('Nomor formulir wajib diisi'),
    patientName: requiredText('Nama pasien wajib diisi'),
    patientBirthDate: z.string(),
    nakesName: z.string(),
    drugs: z.array(requestDrugSchema),
    serviceIds: z.array(z.string()),
    serviceFee: z.number().min(0),
    discount: z.number().min(0),
  })
  .superRefine((values, ctx) => {
    let hasValidDrug = false;
    let hasDrugError = false;

    values.drugs.forEach((drug, index) => {
      if (isDraftDrugRow(drug)) return;
      const validProduct = !!drug.productId;
      const validQuantity = isPositive(drug.quantity);
      if (!validProduct) {
        ctx.addIssue({
          code: 'custom',
          path: ['drugs', index, 'productId'],
          message: PRODUCT_MESSAGE,
        });
      }
      if (!validQuantity) {
        ctx.addIssue({
          code: 'custom',
          path: ['drugs', index, 'quantity'],
          message: QUANTITY_MESSAGE,
        });
      }
      if (validProduct && validQuantity) hasValidDrug = true;
      else hasDrugError = true;
    });

    if (!hasValidDrug && values.serviceIds.length === 0 && !hasDrugError) {
      ctx.addIssue({ code: 'custom', path: ['drugs'], message: MIN_CONTENT_MESSAGE });
    }
  });

export type StockOutRequestValues = z.infer<typeof stockOutRequestSchema>;

export const emptyRequestDrug = (): RequestDrugValues => ({
  productId: '',
  productName: '',
  unit: 'Tablet',
  instructions: '3x1 Sesudah makan',
  quantity: 1,
});
