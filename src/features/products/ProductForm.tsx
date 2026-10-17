import React, { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, X } from 'lucide-react';
import { Product, Category, Unit } from './types';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getProductDisplayName } from './productDisplay';
import { emptyProductFormValues, productFormSchema, type ProductFormValues } from './productSchema';
import { NumberInputField } from './components/NumberInputField';
import { ProductNameFields } from './components/ProductNameFields';
import { productInputClassName, productLabelClassName } from './components/productFormStyles';

interface ProductFormProps {
  onSave: (product: Product) => void;
  editingProduct?: Product;
  onCancel: () => void;
  isLoading?: boolean;
}

const toFormValues = (product: Product): ProductFormValues => ({
  name: product.name ?? '',
  brand: product.brand ?? '',
  composition: product.composition ?? '',
  category: product.category,
  unit: product.unit,
  purchasePrice: product.purchasePrice,
  sellingPrice: product.sellingPrice,
  stock: product.stock,
  minStock: product.minStock,
  description: product.description ?? '',
});

const ProductForm: React.FC<ProductFormProps> = ({
  onSave,
  editingProduct,
  onCancel,
  isLoading = false,
}) => {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: emptyProductFormValues,
    mode: 'onTouched',
  });

  useEffect(() => {
    form.reset(editingProduct ? toFormValues(editingProduct) : emptyProductFormValues);
  }, [editingProduct, form]);

  const handleReset = () => form.reset(emptyProductFormValues);

  // Seperti validasi lama: setiap blur memeriksa ulang seluruh form, supaya
  // pesan yang bergantung pada field lain (stok minimum) ikut diperbarui
  const revalidate = () => void form.trigger();

  const category = useWatch({ control: form.control, name: 'category' });
  const isMedicine = category === Category.Obat;

  const handleSubmit = (values: ProductFormValues) => {
    const finalProduct: Product = {
      id: editingProduct?.id || Math.random().toString(36).substr(2, 9),
      code: editingProduct?.code || `ID-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      name: getProductDisplayName(values),
      category: values.category,
      unit: values.unit,
      purchasePrice: Number(values.purchasePrice),
      sellingPrice: Number(values.sellingPrice),
      stock: Number(values.stock),
      minStock: Number(values.minStock),
      description: values.description,
      color: editingProduct?.color || 'bg-primary',
      brand: values.brand,
      composition: values.composition,
    };

    onSave(finalProduct);
    handleReset();
  };

  return (
    <div className="h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-foreground">
          {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            className="text-primary hover:text-primary bg-primary/10 hover:bg-primary/20 px-3 transition-colors text-sm font-medium"
          >
            Reset
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onCancel}
            aria-label="Tutup"
            className="w-auto p-2 text-current hover:text-current bg-background dark:bg-white/5 rounded-full hover:bg-gray-200 transition-colors [&_svg]:size-6"
          >
            <X aria-hidden />
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" noValidate>
          <ProductNameFields
            control={form.control}
            isMedicine={isMedicine}
            onFieldBlur={revalidate}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="space-y-0">
                  <FormLabel className={productLabelClassName}>Kategori</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className={productInputClassName}>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-[100]">
                      {Object.values(Category).map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem className="space-y-0">
                  <FormLabel className={productLabelClassName}>Satuan</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className={productInputClassName}>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-[100]">
                      {Object.values(Unit).map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <NumberInputField
              control={form.control}
              name="sellingPrice"
              className="col-span-2"
              label={
                <>
                  Harga Jual <span className="text-red-500">*</span>
                </>
              }
              labelClassName={productLabelClassName}
              inputClassName={`${productInputClassName} pl-10 pr-4`}
              prefix="Rp"
              onBlur={revalidate}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <NumberInputField
              control={form.control}
              name="stock"
              label="Stok Awal"
              labelClassName={productLabelClassName}
              inputClassName={productInputClassName}
              onBlur={revalidate}
            />
            <NumberInputField
              control={form.control}
              name="minStock"
              label="Stok Minimum"
              placeholder="Min. Stok"
              labelClassName={productLabelClassName}
              inputClassName={productInputClassName}
              onBlur={revalidate}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormLabel className={productLabelClassName}>Deskripsi / Dosis</FormLabel>
                <FormControl>
                  <Textarea
                    className={`${productInputClassName} py-3 resize-none shadow-none`}
                    placeholder="Tambahkan keterangan..."
                    rows={3}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

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
              className="w-full font-bold shadow-lg [&_svg]:size-[18px]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin mr-1" aria-hidden />
                  Menyimpan...
                </>
              ) : editingProduct ? (
                'Update Data Produk'
              ) : (
                'Tambah Data Produk'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ProductForm;
