import React, { useState, useEffect } from 'react';
import { Product, Category, Unit } from '../types';
import { Button } from './ui/button';
import { sanitizePriceInput } from '../lib/utils';
import { getProductDisplayName } from '../lib/productDisplay';


interface ProductFormProps {
  onSave: (product: Product) => void;
  editingProduct?: Product;
  onCancel: () => void;
  isLoading?: boolean;
}

interface ValidationErrors {
  name?: string;
  brand?: string;
  composition?: string;
  sellingPrice?: string;
  stock?: string;
  minStock?: string;
}

const ProductForm: React.FC<ProductFormProps> = ({ onSave, editingProduct, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: Category.Obat,
    unit: Unit.Tablet,
    purchasePrice: undefined,
    sellingPrice: undefined,
    stock: undefined,
    minStock: undefined,
    description: '',
    brand: '',
    composition: ''
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (editingProduct) {
      setFormData(editingProduct);
    } else {
      handleReset();
    }
  }, [editingProduct]);

  const handleReset = () => {
    setFormData({
      name: '',
      category: Category.Obat,
      unit: Unit.Tablet,
      purchasePrice: undefined,
      sellingPrice: undefined,
      stock: undefined,
      minStock: undefined,
      description: '',
      brand: '',
      composition: ''
    });
    setErrors({});
    setTouched(new Set());
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    const isMedicine = formData.category === Category.Obat;
    const generatedProductName = getProductDisplayName({
      name: formData.name,
      category: formData.category as Category,
      brand: formData.brand,
      composition: formData.composition,
    });

    if (isMedicine) {
      if (!generatedProductName || generatedProductName.length < 3) {
        newErrors.name = 'Isi merek atau kandungan obat minimal 3 karakter';
      }
    } else if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'Nama produk wajib diisi';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Nama produk minimal 3 karakter';
    }

    // Selling price validation
    if (!formData.sellingPrice || formData.sellingPrice <= 0) {
      newErrors.sellingPrice = 'Harga jual harus lebih dari 0';
    }

    // Stock validation
    if (formData.stock === undefined || formData.stock < 0) {
      newErrors.stock = 'Stok tidak boleh negatif';
    }

    // Min stock validation
    if (formData.minStock === undefined || formData.minStock < 0) {
      newErrors.minStock = 'Stok minimum tidak boleh negatif';
    } else if (formData.minStock && formData.stock && formData.minStock > formData.stock) {
      newErrors.minStock = 'Stok minimum tidak boleh lebih dari stok awal';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched(prev => new Set(prev).add(field));
    validateForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isMedicine = formData.category === Category.Obat;
    const resolvedProductName = getProductDisplayName({
      name: formData.name,
      category: formData.category as Category,
      brand: formData.brand,
      composition: formData.composition,
    });
    
    // Mark all fields as touched
    setTouched(new Set([...(isMedicine ? ['brand', 'composition'] : ['name']), 'sellingPrice', 'stock', 'minStock']));
    
    if (!validateForm()) {
      return;
    }

    const finalProduct: Product = {
      id: formData.id || Math.random().toString(36).substr(2, 9),
      code: formData.code || `ID-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      name: resolvedProductName,
      category: formData.category as Category,
      unit: formData.unit as Unit,
      purchasePrice: Number(formData.purchasePrice),
      sellingPrice: Number(formData.sellingPrice),
      stock: Number(formData.stock),
      minStock: Number(formData.minStock),
      description: formData.description as string,
      color: formData.color || 'bg-primary',
      brand: formData.brand,
      composition: formData.composition
    };

    onSave(finalProduct);
    handleReset();
  };

  const getInputClassName = (fieldName: string, baseClassName: string) => {
    const hasError = touched.has(fieldName) && errors[fieldName as keyof ValidationErrors];
    return `${baseClassName} ${hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`;
  };

  const isMedicine = formData.category === Category.Obat;
  const previewProductName = getProductDisplayName({
    name: formData.name,
    category: formData.category as Category,
    brand: formData.brand,
    composition: formData.composition,
  });

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-text-primary-light dark:text-white">
          {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
        </h2>
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={handleReset}
            className="text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
          >
            Reset
          </button>
          <button 
            type="button"
            onClick={onCancel}
            className="p-2 bg-background-light dark:bg-white/5 rounded-full hover:bg-gray-200 transition-colors"
          >
            <span className="material-icons-round">close</span>
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isMedicine && (
          <div>
            <label className="block text-sm font-medium text-text-primary-light dark:text-white mb-2">
              Nama Produk <span className="text-red-500">*</span>
            </label>
            <input 
              className={getInputClassName('name', 'w-full rounded-xl border-gray-200 dark:border-gray-700 bg-background-light dark:bg-background-dark p-3 text-sm focus:border-primary focus:ring-primary dark:text-white')}
              placeholder="Contoh: Paracetamol 500mg" 
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              onBlur={() => handleBlur('name')}
            />
            {touched.has('name') && errors.name && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <span className="material-icons-round text-sm">error</span>
                {errors.name}
              </p>
            )}
          </div>
        )}

        {isMedicine && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary-light dark:text-white mb-2">
                Merek Obat
              </label>
              <input 
                type="text"
                className={getInputClassName('brand', 'w-full rounded-xl border-gray-200 dark:border-gray-700 bg-background-light dark:bg-background-dark p-3 text-sm focus:border-primary focus:ring-primary dark:text-white')}
                placeholder="Contoh: Sanbe, Kimia Farma..."
                value={formData.brand || ''}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                onBlur={() => handleBlur('brand')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary-light dark:text-white mb-2">
                Kandungan Obat
              </label>
              <input 
                type="text"
                className={getInputClassName('composition', 'w-full rounded-xl border-gray-200 dark:border-gray-700 bg-background-light dark:bg-background-dark p-3 text-sm focus:border-primary focus:ring-primary dark:text-white')}
                placeholder="Contoh: Paracetamol 500mg..."
                value={formData.composition || ''}
                onChange={(e) => setFormData({ ...formData, composition: e.target.value })}
                onBlur={() => handleBlur('composition')}
              />
            </div>
            <div className="col-span-2">
              <p className="text-xs text-text-secondary-light">
                Nama produk otomatis: <span className="font-bold text-text-primary-light dark:text-white">{previewProductName || formData.name || '-'}</span>
              </p>
              {errors.name && (touched.has('brand') || touched.has('composition')) && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <span className="material-icons-round text-sm">error</span>
                  {errors.name}
                </p>
              )}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary-light dark:text-white mb-2">Kategori</label>
            <select 
              className="w-full rounded-xl border-gray-200 dark:border-gray-700 bg-background-light dark:bg-background-dark p-3 text-sm focus:border-primary focus:ring-primary dark:text-white"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
            >
              {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary-light dark:text-white mb-2">Satuan</label>
            <select 
              className="w-full rounded-xl border-gray-200 dark:border-gray-700 bg-background-light dark:bg-background-dark p-3 text-sm focus:border-primary focus:ring-primary dark:text-white"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value as Unit })}
            >
              {Object.values(Unit).map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-text-primary-light dark:text-white mb-2">
              Harga Jual <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-text-secondary-light text-sm">Rp</span>
              <input 
                className={getInputClassName('sellingPrice', 'w-full rounded-xl border-gray-200 dark:border-gray-700 bg-background-light dark:bg-background-dark pl-10 pr-4 py-3 text-sm focus:border-primary focus:ring-primary dark:text-white')}
                placeholder="0" 
                type="number"
                min="0"
                value={formData.sellingPrice ?? ''}
                onChange={(e) => {
                  const sanitized = sanitizePriceInput(e.target.value);
                  setFormData({ ...formData, sellingPrice: sanitized === '' ? undefined : Number(sanitized) });
                }}
                onBlur={() => handleBlur('sellingPrice')}
              />
            </div>
            {touched.has('sellingPrice') && errors.sellingPrice && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <span className="material-icons-round text-sm">error</span>
                {errors.sellingPrice}
              </p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary-light dark:text-white mb-2">Stok Awal</label>
            <input 
              className={getInputClassName('stock', 'w-full rounded-xl border-gray-200 dark:border-gray-700 bg-background-light dark:bg-background-dark p-3 text-sm focus:border-primary focus:ring-primary dark:text-white')}
              placeholder="0" 
              type="number"
              min="0"
              value={formData.stock ?? ''}
              onChange={(e) => {
                const sanitized = sanitizePriceInput(e.target.value);
                setFormData({ ...formData, stock: sanitized === '' ? undefined : Number(sanitized) });
              }}
              onBlur={() => handleBlur('stock')}
            />
            {touched.has('stock') && errors.stock && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <span className="material-icons-round text-sm">error</span>
                {errors.stock}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary-light dark:text-white mb-2">Stok Minimum</label>
            <input 
              className={getInputClassName('minStock', 'w-full rounded-xl border-gray-200 dark:border-gray-700 bg-background-light dark:bg-background-dark p-3 text-sm focus:border-primary focus:ring-primary dark:text-white')}
              placeholder="Min. Stok" 
              type="number"
              min="0"
              value={formData.minStock ?? ''}
              onChange={(e) => {
                const sanitized = sanitizePriceInput(e.target.value);
                setFormData({ ...formData, minStock: sanitized === '' ? undefined : Number(sanitized) });
              }}
              onBlur={() => handleBlur('minStock')}
            />
            {touched.has('minStock') && errors.minStock && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <span className="material-icons-round text-sm">error</span>
                {errors.minStock}
              </p>
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-text-primary-light dark:text-white mb-2">Deskripsi / Dosis</label>
          <textarea 
            className="w-full rounded-xl border-gray-200 dark:border-gray-700 bg-background-light dark:bg-background-dark p-3 text-sm focus:border-primary focus:ring-primary dark:text-white resize-none" 
            placeholder="Tambahkan keterangan..." 
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
        
        <div className="flex gap-2 pt-2">
            {editingProduct && (
              <Button 
                onClick={onCancel}
                type="button"
                variant="outline"
                size="lg"
                className="flex-1 font-bold"
                disabled={isLoading}
              >
                Batal
              </Button>
            )}
            <Button 
              type="submit"
              size="lg"
              className="w-full font-bold shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="material-icons-round text-[18px] animate-spin mr-1">refresh</span>
                  Menyimpan...
                </>
              ) : (
                editingProduct ? 'Update Data Produk' : 'Tambah Data Produk'
              )}
            </Button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
