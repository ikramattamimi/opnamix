export enum Category {
  Obat = 'Obat',
  BHP = 'BHP (Habis Pakai)',
  Imunisasi = 'Imunisasi',
  Alkes = 'Alat Kesehatan',
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
