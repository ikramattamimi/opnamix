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

// Zat aktif obat; kekuatan opsional ("500 mg", "120 mg/5 ml")
export interface Ingredient {
  name: string;
  strength: string;
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
  brand?: string; // merek, semua kategori; kosong berarti generik
  composition?: string; // ringkasan teks kandungan (kolom kandungan)
  dosageForm?: string; // sediaan obat
  packageSize?: string; // isi kemasan
  ingredients?: Ingredient[];
}
