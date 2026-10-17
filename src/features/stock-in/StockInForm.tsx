import React, { useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus, Save, X } from 'lucide-react';
import { StockInReceipt } from './types';
import { Product } from '@/features/products/types';
import { compressImage } from '@/lib/imageCompression';
import ProductLookupModal from '@/features/products/ProductLookupModal';
import { useProducts } from '@/features/products/useProducts';
import { useAuth } from '@/features/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useToast } from '@/components/ui/toast';
import {
  emptyStockInItem,
  receiptFileSchema,
  stockInFormSchema,
  todayIsoDate,
  type StockInFormInput,
  type StockInFormValues,
} from './stockInSchema';
import { StockInItemCard } from './components/StockInItemCard';
import { ReceiptUpload } from './components/ReceiptUpload';
import { TransactionDetailsFields } from './components/TransactionDetailsFields';
import { Card } from '@/components/ui/card';

interface StockInFormProps {
  onSave: (receipt: StockInReceipt, file?: Blob) => void;
  onClose: () => void;
  isLoading?: boolean;
}

const StockInForm: React.FC<StockInFormProps> = ({ onSave, onClose, isLoading = false }) => {
  const { showToast } = useToast();
  const { userProfile } = useAuth();
  const { data: productData, isPending: isProductsPending } = useProducts({
    page: 1,
    perPage: 1000,
  });
  const products = productData?.data || [];
  const currentUserName = userProfile ? userProfile.full_name || userProfile.email : '';

  const form = useForm<StockInFormInput, unknown, StockInFormValues>({
    resolver: zodResolver(stockInFormSchema),
    defaultValues: {
      invoiceNumber: '',
      supplierName: '',
      date: todayIsoDate(),
      items: [emptyStockInItem()],
      file: null,
    },
    mode: 'onTouched',
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });
  const file = useWatch({ control: form.control, name: 'file' });
  const [isCompressing, setIsCompressing] = useState(false);

  // Baris item yang sedang memilih produk lewat lookup
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleProductSelected = (product: Product) => {
    if (activeIndex !== null) {
      const options = { shouldValidate: form.formState.isSubmitted, shouldDirty: true };
      form.setValue(`items.${activeIndex}.productId`, product.id, options);
      if (product.unit) form.setValue(`items.${activeIndex}.unit`, product.unit, options);
    }
    setActiveIndex(null);
  };

  const handleFileSelected = (selectedFile: File) => {
    const result = receiptFileSchema.safeParse(selectedFile);
    if (!result.success) {
      showToast(result.error.issues[0].message, 'error');
      return;
    }
    form.setValue('file', selectedFile);
  };

  const handleSubmit = async (values: StockInFormValues) => {
    setIsCompressing(true);
    let compressedFile: Blob | undefined;

    try {
      if (values.file) {
        compressedFile = await compressImage(values.file, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.6,
          mimeType: 'image/webp',
        });
      }

      const newReceipt: StockInReceipt = {
        id: Math.random().toString(36).substr(2, 9),
        invoiceNumber: values.invoiceNumber,
        supplierName: values.supplierName || 'No Name', // Default
        date: values.date,
        items: values.items.map((item, index) => {
          const product = products.find((p) => p.id === item.productId);
          return {
            id: fields[index]?.id ?? Math.random().toString(),
            productId: item.productId,
            productName: product?.name || 'Produk Unknown',
            category: product?.category || 'Obat',
            expiryDate: item.expiryDate,
            quantity: item.quantity,
            unit: item.unit,
          };
        }),
        status: 'Selesai',
        receivedBy: currentUserName || 'Admin',
      };

      onSave(newReceipt, compressedFile);
    } catch (error) {
      console.error('Error compressing image:', error);
      showToast('Gagal memproses gambar. Silakan coba lagi.', 'error');
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-bold text-foreground">Formulir Penerimaan Stok</h3>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            aria-label="Tutup"
            className="rounded-full hover:bg-gray-200 dark:hover:bg-white/5 [&_svg]:size-6"
          >
            <X aria-hidden />
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8" noValidate>
            <TransactionDetailsFields />

            {/* Detail Barang Section */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                  Detail Barang
                </h4>
                <Button
                  type="button"
                  onClick={() => append(emptyStockInItem())}
                  variant="ghost"
                  className="text-primary hover:text-primary/80 font-bold p-0 hover:bg-transparent [&_svg]:size-5"
                >
                  <Plus className="mr-1" aria-hidden /> Tambah Item Lain
                </Button>
              </div>

              <div className="space-y-4">
                {fields.map((item, index) => (
                  <StockInItemCard
                    key={item.id}
                    index={index}
                    products={products}
                    canRemove={fields.length > 1}
                    onRemove={() => remove(index)}
                    onOpenLookup={() => setActiveIndex(index)}
                  />
                ))}
              </div>
            </div>

            <ReceiptUpload file={file} onFileSelected={handleFileSelected} />

            <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100 dark:border-white/5">
              <Button
                type="button"
                onClick={onClose}
                variant="secondary"
                size="lg"
                className="font-bold"
                disabled={isCompressing || isLoading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="lg"
                className="font-bold shadow-lg shadow-primary/40 gap-2 [&_svg]:size-5"
                disabled={isCompressing || isLoading}
              >
                {isCompressing ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden />
                    Memproses Gambar...
                  </>
                ) : isLoading ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save aria-hidden />
                    Simpan Data
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>

        {activeIndex !== null && (
          <ProductLookupModal
            products={products}
            isLoading={isProductsPending}
            onClose={() => setActiveIndex(null)}
            onSelect={handleProductSelected}
            allowAddProduct={true}
          />
        )}
      </Card>
    </div>
  );
};

export default StockInForm;
