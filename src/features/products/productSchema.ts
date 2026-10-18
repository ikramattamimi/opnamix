import { Category, Unit, type Ingredient, type Product } from './types';
import { getProductDisplayName, isCombination } from './productDisplay';

// Nilai form produk di panel Data Produk. Angka kosong bernilai null.
export interface ProductFormValues {
  category: Category;
  /** Kategori selain Obat; obat memakai nama dari kandungan atau merek */
  name: string;
  brand: string;
  dosageForm: string;
  packageSize: string;
  ingredients: Ingredient[];
  unit: Unit;
  purchasePrice: number | null;
  sellingPrice: number | null;
  stock: number | null;
  minStock: number | null;
}

export type ProductFormErrors = Partial<Record<keyof ProductFormValues, string>>;

export const emptyProductFormValues: ProductFormValues = {
  category: Category.Obat,
  name: '',
  brand: '',
  dosageForm: 'Tablet',
  packageSize: '',
  ingredients: [],
  unit: Unit.Tablet,
  purchasePrice: null,
  sellingPrice: null,
  stock: null,
  minStock: null,
};

export const productToFormValues = (p: Product): ProductFormValues => ({
  category: p.category,
  name: p.category === Category.Obat ? '' : p.name,
  brand: p.brand ?? '',
  dosageForm: p.dosageForm || (p.category === Category.Obat ? 'Tablet' : ''),
  packageSize: p.packageSize ?? '',
  ingredients: p.ingredients ?? [],
  unit: p.unit,
  purchasePrice: p.purchasePrice || null,
  sellingPrice: p.sellingPrice || null,
  stock: p.stock,
  minStock: p.minStock,
});

// Data yang dikirim ke API. `name` obat dibentuk dari kandungan atau merek.
export function formValuesToProduct(
  values: ProductFormValues,
  existing?: Product,
): Partial<Product> {
  const isMedicine = values.category === Category.Obat;
  const ingredients = isMedicine
    ? values.ingredients
        .map((i) => ({ name: i.name.trim(), strength: i.strength.trim() }))
        .filter((i) => i.name)
    : [];
  const product: Partial<Product> = {
    category: values.category,
    // Obat kombinasi tanpa merek mempertahankan nama kombinasi yang sudah ada
    name: isMedicine ? (existing && isCombination(existing) ? existing.name : '') : values.name,
    brand: values.brand.trim(),
    dosageForm: isMedicine ? values.dosageForm : '',
    packageSize: isMedicine ? values.packageSize.trim() : '',
    ingredients,
    unit: values.unit,
    purchasePrice: values.purchasePrice ?? 0,
    sellingPrice: values.sellingPrice ?? 0,
    minStock: values.minStock ?? 0,
  };
  product.name = getProductDisplayName(product);
  // Stok hanya diisi saat membuat produk
  if (!existing) product.stock = values.stock ?? 0;
  return product;
}

// Pesan galat per isian; objek kosong berarti valid
export function validateProductForm(
  values: ProductFormValues,
  { isNew }: { isNew: boolean },
): ProductFormErrors {
  const errors: ProductFormErrors = {};

  if (values.category === Category.Obat) {
    const filled = values.ingredients.filter((i) => i.name.trim());
    if (filled.length === 0) {
      errors.ingredients = 'Isi minimal satu kandungan';
    } else if (getProductDisplayName({ ...values, ingredients: filled }).length < 3) {
      errors.ingredients = 'Nama kandungan minimal 3 karakter';
    }
  } else if (values.name.trim() === '') {
    errors.name = 'Nama produk wajib diisi';
  } else if (values.name.trim().length < 3) {
    errors.name = 'Nama produk minimal 3 karakter';
  }

  if (!values.sellingPrice || values.sellingPrice <= 0) {
    errors.sellingPrice = 'Harga jual harus lebih dari 0';
  }

  if (isNew && values.stock === null) {
    errors.stock = 'Stok awal wajib diisi';
  }

  if (values.minStock === null) {
    errors.minStock = 'Stok minimum wajib diisi';
  } else if (isNew && values.stock && values.minStock > values.stock) {
    // Aturan lama: stok minimum tidak melebihi stok awal (stok 0 tidak dibandingkan)
    errors.minStock = 'Stok minimum tidak boleh lebih dari stok awal';
  }

  return errors;
}
