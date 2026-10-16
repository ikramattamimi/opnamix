import React, { useState, useEffect } from 'react';
import { StockInReceipt, StockInItem, Product } from '../types';
import { compressImage, formatFileSize } from '../lib/imageCompression';
import ProductLookupModal from './ProductLookupModal';
import { useProducts } from '../hooks/useProducts';
import { Button } from './ui/button';
import { useToast } from './ui/toast';
import { getUserProfile } from '../lib/auth';
import { api } from '../lib/api';

interface StockInFormProps {
  onSave: (receipt: StockInReceipt, file?: Blob) => void;
  onClose: () => void;
  isLoading?: boolean;
}

const StockInForm: React.FC<StockInFormProps> = ({ onSave, onClose, isLoading = false }) => {
  const { showToast } = useToast();
  const { data: productData } = useProducts({ page: 1, perPage: 1000 });
  const products = productData?.data || [];

  const [currentUserName, setCurrentUserName] = useState('');
  const [supplierSuggestions, setSupplierSuggestions] = useState<string[]>([]);

  useEffect(() => {
    getUserProfile().then((profile) => {
      if (profile) setCurrentUserName(profile.full_name || profile.email);
    });
    api
      .getDistinctSuppliers()
      .then(setSupplierSuggestions)
      .catch(() => {});
  }, []);

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<Partial<StockInItem>[]>([
    { id: Math.random().toString(), productId: '', quantity: 0, expiryDate: '', unit: 'Box' },
  ]);
  const [file, setFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // New State for Lookup
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [isLookupOpen, setIsLookupOpen] = useState(false);

  const addItem = () => {
    setItems([
      ...items,
      { id: Math.random().toString(), productId: '', quantity: 0, expiryDate: '', unit: 'Box' },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const handleItemChange = <K extends keyof StockInItem>(
    id: string,
    field: K,
    value: StockInItem[K] | undefined, // input angka yang dikosongkan mengirim undefined
  ) => {
    setItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const handleOpenLookup = (rowId: string) => {
    setActiveRowId(rowId);
    setIsLookupOpen(true);
  };

  const handleProductSelected = (product: Product) => {
    if (activeRowId) {
      setItems((prevItems) =>
        prevItems.map((item) => {
          if (item.id === activeRowId) {
            return {
              ...item,
              productId: product.id,
              unit: product.unit || item.unit, // Auto-fill unit
            };
          }
          return item;
        }),
      );
    }
    setIsLookupOpen(false);
    setActiveRowId(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      if (selectedFile.size > MAX_SIZE) {
        showToast('Ukuran file maksimal 5MB', 'error');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber) return; // Supplier is now optional

    setIsCompressing(true);
    let compressedFile: Blob | undefined;

    try {
      // Compress image if file is selected
      if (file) {
        compressedFile = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.6,
          mimeType: 'image/webp',
        });
      }

      const newReceipt: StockInReceipt = {
        id: Math.random().toString(36).substr(2, 9),
        invoiceNumber,
        supplierName: supplierName || 'No Name', // Default
        date,
        items: items.map((item) => {
          const product = products.find((p) => p.id === item.productId);
          return {
            id: item.id!,
            productId: item.productId!,
            productName: product?.name || 'Produk Unknown',
            category: product?.category || 'Obat',
            expiryDate: item.expiryDate!,
            quantity: item.quantity!,
            unit: item.unit!,
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
      <div className="bg-white dark:bg-card-dark w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[32px] shadow-soft p-8">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-bold text-text-primary-light dark:text-white">
            Formulir Penerimaan Stok
          </h3>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-gray-200 dark:hover:bg-white/5"
          >
            <span className="material-icons-round">close</span>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Detail Transaksi Section */}
          <div>
            <h4 className="text-sm font-bold text-text-secondary-light uppercase tracking-wider mb-6">
              Detail Transaksi
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-primary-light dark:text-white ml-1">
                  Nomor Nota / Faktur
                </label>
                <div className="relative">
                  <input
                    className="w-full bg-transparent border border-gray-200 dark:border-white/10 rounded-2xl pl-4 pr-10 py-3.5 text-sm font-medium text-text-primary-light dark:text-white focus:ring-0 focus:border-primary placeholder:text-text-secondary-light transition-all"
                    placeholder="Contoh: INV-2023-001"
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    required
                  />
                  <span className="material-icons-round absolute right-4 top-3.5 text-text-secondary-light text-[20px]">
                    tag
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-primary-light dark:text-white ml-1">
                  Nama Supplier{' '}
                  <span className="text-xs font-normal text-text-secondary-light">(Opsional)</span>
                </label>
                <div className="relative">
                  <input
                    className="w-full bg-transparent border border-gray-200 dark:border-white/10 rounded-2xl pl-4 pr-10 py-3.5 text-sm font-medium text-text-primary-light dark:text-white focus:ring-0 focus:border-primary transition-all"
                    placeholder="Ketik nama supplier..."
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    list="suppliers"
                  />
                  <datalist id="suppliers">
                    {supplierSuggestions.map((name, idx) => (
                      <option key={idx} value={name} />
                    ))}
                  </datalist>
                  <span className="material-icons-round absolute right-4 top-3.5 text-text-secondary-light pointer-events-none text-[20px]">
                    local_shipping
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-primary-light dark:text-white ml-1">
                  Tanggal Penerimaan
                </label>
                <div className="relative">
                  <input
                    className="w-full bg-transparent border border-gray-200 dark:border-white/10 rounded-2xl pl-4 pr-10 py-3.5 text-sm font-medium text-text-primary-light dark:text-white focus:ring-0 focus:border-primary transition-all"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                  <span className="material-icons-round absolute right-4 top-3.5 text-text-secondary-light text-[20px]">
                    calendar_today
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Detail Barang Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-sm font-bold text-text-secondary-light uppercase tracking-wider">
                Detail Barang
              </h4>
              <Button
                type="button"
                onClick={addItem}
                variant="ghost"
                className="text-primary hover:text-primary/80 font-bold p-0 h-auto hover:bg-transparent"
              >
                <span className="material-icons-round text-[20px] mr-1">add</span> Tambah Item Lain
              </Button>
            </div>

            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-background-light dark:bg-background-dark rounded-2xl p-6 relative"
                >
                  {items.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeItem(item.id!)}
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg"
                    >
                      <span className="material-icons-round text-xs">close</span>
                    </Button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-sm font-bold text-text-primary-light dark:text-white ml-1">
                        Pilih Produk
                      </label>
                      <div
                        onClick={() => handleOpenLookup(item.id!)}
                        className="relative cursor-pointer group"
                      >
                        <div
                          className={`w-full bg-white dark:bg-card-dark border-none rounded-2xl px-4 py-3.5 text-sm font-medium shadow-sm transition-all flex items-center justify-between ${!item.productId ? 'text-text-secondary-light dark:text-text-secondary-dark' : 'text-text-primary-light dark:text-white'}`}
                        >
                          <span>
                            {item.productId
                              ? products.find((p) => p.id === item.productId)?.name ||
                                'Produk Terpilih'
                              : 'Cari Obat / Alkes...'}
                          </span>
                          <span className="material-icons-round text-primary group-hover:scale-110 transition-transform">
                            search
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-text-primary-light dark:text-white ml-1">
                        Tanggal Kedaluwarsa
                      </label>
                      <input
                        className="w-full bg-white dark:bg-card-dark border-none rounded-2xl px-4 py-3.5 text-sm font-medium text-text-primary-light dark:text-white shadow-sm focus:ring-2 focus:ring-primary/20"
                        type="date"
                        value={item.expiryDate}
                        onChange={(e) => handleItemChange(item.id!, 'expiryDate', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-text-primary-light dark:text-white ml-1">
                        Jumlah
                      </label>
                      <div className="flex items-center bg-white dark:bg-card-dark rounded-2xl p-1 shadow-sm">
                        <input
                          className="flex-1 w-full border-none bg-transparent text-center text-sm font-bold text-text-primary-light dark:text-white focus:ring-0 p-0"
                          type="number"
                          value={item.quantity ?? ''}
                          onChange={(e) =>
                            handleItemChange(
                              item.id!,
                              'quantity',
                              e.target.value === '' ? undefined : Number(e.target.value),
                            )
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bukti Fisik Section */}
          <div>
            <h4 className="text-sm font-bold text-text-secondary-light uppercase tracking-wider mb-6">
              Bukti Fisik (Opsional)
            </h4>
            <div
              onClick={() => document.getElementById('receipt-upload')?.click()}
              className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-background-light dark:hover:bg-white/5 transition-colors group bg-background-light/30"
            >
              <div className="bg-primary/10 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-200">
                <span className="material-icons-round text-primary text-3xl">cloud_upload</span>
              </div>
              <p className="text-text-primary-light dark:text-white font-bold text-lg mb-1">
                {file ? file.name : 'Upload Bukti Nota'}
              </p>
              {file && (
                <p className="text-xs text-text-secondary-light font-medium mb-2">
                  Ukuran asli: {formatFileSize(file.size)}
                </p>
              )}
              <p className="text-xs text-text-secondary-light font-medium">
                File PNG, JPG, dan GIF diizinkan
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-2">
                Gambar akan otomatis dikompres untuk menghemat storage
              </p>
              <input
                id="receipt-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100 dark:border-white/5">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              size="lg"
              className="rounded-2xl font-bold"
              disabled={isCompressing || isLoading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="lg"
              className="rounded-2xl font-bold shadow-lg shadow-primary/40 gap-2"
              disabled={isCompressing || isLoading}
            >
              {isCompressing ? (
                <>
                  <span className="material-icons-round text-[20px] animate-spin">refresh</span>
                  Memproses Gambar...
                </>
              ) : isLoading ? (
                <>
                  <span className="material-icons-round text-[20px] animate-spin">refresh</span>
                  Menyimpan...
                </>
              ) : (
                <>
                  <span className="material-icons-round text-[20px]">save</span>
                  Simpan Data
                </>
              )}
            </Button>
          </div>
        </form>

        {isLookupOpen && (
          <ProductLookupModal
            products={products}
            onClose={() => setIsLookupOpen(false)}
            onSelect={handleProductSelected}
            allowAddProduct={true}
          />
        )}
      </div>
    </div>
  );
};

export default StockInForm;
