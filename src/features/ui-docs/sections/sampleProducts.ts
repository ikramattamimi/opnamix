import { Category, Unit, type Product } from '@/features/products/types';

// Contoh produk untuk halaman Komponen UI

const product = (p: Partial<Product>): Product => ({
  id: p.name ?? 'x',
  code: 'OBT-0001',
  name: '',
  category: Category.Obat,
  unit: Unit.Tablet,
  purchasePrice: 0,
  sellingPrice: 0,
  stock: 0,
  minStock: 0,
  description: '',
  color: '',
  ...p,
});

export const SAMPLES: Product[] = [
  product({
    name: 'Paracetamol 120 mg/5 ml',
    brand: 'Sanmol',
    dosageForm: 'Sirup',
    packageSize: '60 ml',
    unit: Unit.Botol,
    ingredients: [{ name: 'Paracetamol', strength: '120 mg/5 ml' }],
    stock: 24,
    minStock: 10,
    sellingPrice: 18000,
  }),
  product({
    name: 'Colfin Sirup 60 ml',
    brand: 'Colfin',
    dosageForm: 'Sirup',
    packageSize: '60 ml',
    unit: Unit.Botol,
    ingredients: [
      { name: 'Paracetamol', strength: '' },
      { name: 'Dextromethorphan HBr', strength: '' },
      { name: 'Phenylephrine HCl', strength: '' },
      { name: 'Chlorphenamine maleate', strength: '' },
    ],
    stock: 8,
    minStock: 10,
    sellingPrice: 24000,
  }),
  product({
    name: 'Spuit 3 ml',
    category: Category.BHP,
    unit: Unit.Pcs,
    stock: 0,
    minStock: 50,
    sellingPrice: 2500,
  }),
];
