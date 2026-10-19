import React, { useId, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, PackageCheck, PackagePlus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PosCartFooter, PosLayout } from '@/components/layout/PosLayout';
import { PosCatalog } from '@/components/layout/PosCatalog';
import { SegmentedControl } from '@/components/data/SegmentedControl';
import { FilterChips } from '@/components/data/FilterChips';
import { StatusChip } from '@/components/data/StatusChip';
import { SidePanel, PanelSection } from '@/components/panel/SidePanel';
import { CartLine, CartLines } from '@/components/panel/CartLine';
import { Field } from '@/components/form/Field';
import { CurrencyInput } from '@/components/form/CurrencyInput';
import { FileDrop } from '@/components/form/FileDrop';
import { EmptyState } from '@/components/common/QueryState';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { compressImage } from '@/lib/imageCompression';
import { rp } from '@/lib/format';
import { getErrorMessage, withErrorDetail } from '@/lib/utils';
import { ROUTES } from '@/types/routes';
import { transactionsApi } from '@/features/transactions/api';
import {
  addToCart,
  cartUnits,
  removeFromCart,
  setCartQuantity,
  updateCartLine,
} from '@/features/transactions/posCart';
import { useAllProducts, useCreateProduct } from '@/features/products/useProducts';
import {
  CATEGORIES,
  CATEGORY_META,
  STOCK_STATUS_META,
  collectIngredientNames,
  productMatches,
  sortProducts,
  stockStatus,
} from '@/features/products/catalog';
import { ProductTile } from '@/features/products/components/ProductTile';
import { useOpnameLockedProducts } from '@/features/opname/useOpname';
import { ProductTitle } from '@/features/products/components/ProductTitle';
import { ProductFormPanel } from '@/features/products/components/ProductFormPanel';
import type { Category, Product } from '@/features/products/types';
import { stockInApi } from './api';
import { useCreateStockIn, useSupplierSuggestions } from './useStockIn';
import { receiptFileSchema, stockInFormSchema, todayIsoDate } from './stockInSchema';
import { isExpiringSoon, monthToExpiryDate } from './expiry';

// POS Stok Masuk: terima barang dari supplier. Tiap produk punya batch,
// bulan kedaluwarsa (ditandai bila < 6 bulan), dan harga beli.

interface ReceiveLine {
  productId: string;
  quantity: number;
  batch: string;
  /** "YYYY-MM" dari isian bulan */
  expiryMonth: string;
  price: number;
}

type CategoryFilter = 'Semua' | Category;
type HeaderErrors = Partial<Record<'invoiceNumber' | 'date', string>>;

const ALL = 'Semua';
const needsRestock = (p: Product) => stockStatus(p) !== 'aman';

const StockInPos: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const supplierListId = useId();
  const { data: products = [], isPending, isError, refetch } = useAllProducts();
  const lockedBy = useOpnameLockedProducts();
  const { data: suppliers = [] } = useSupplierSuggestions();
  const createStockIn = useCreateStockIn();
  const createProduct = useCreateProduct();
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>(ALL);
  const [restockOnly, setRestockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [addingProduct, setAddingProduct] = useState(false);

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [date, setDate] = useState(todayIsoDate);
  const [file, setFile] = useState<File | null>(null);
  const [lines, setLines] = useState<ReceiveLine[]>([]);
  const [headerErrors, setHeaderErrors] = useState<HeaderErrors>({});
  const [lineErrors, setLineErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const resetPage =
    <T,>(setter: (v: T) => void) =>
    (v: T) => {
      setter(v);
      setPage(1);
    };

  const restockCount = useMemo(() => products.filter(needsRestock).length, [products]);
  const ingredientNames = useMemo(() => collectIngredientNames(products), [products]);
  const existingCodes = useMemo(() => products.map((p) => p.code), [products]);

  // Produk yang perlu restok tampil lebih dulu
  const catalogItems = useMemo(() => {
    const list = sortProducts(
      products.filter(
        (p) =>
          (category === ALL || p.category === category) &&
          (!restockOnly || needsRestock(p)) &&
          productMatches(p, query),
      ),
      'nama',
    );
    return [...list.filter(needsRestock), ...list.filter((p) => !needsRestock(p))];
  }, [products, category, restockOnly, query]);

  const addProduct = (product: Product) =>
    setLines((prev) =>
      addToCart(prev, product.id, () => ({
        productId: product.id,
        quantity: 1,
        batch: '',
        expiryMonth: '',
        price: product.purchasePrice,
      })),
    );

  const addTopResult = () => {
    const first = catalogItems[0];
    if (first) addProduct(first);
    if (query) resetPage(setQuery)('');
  };

  const patchLine = (productId: string, patch: Partial<ReceiveLine>) => {
    setLines((prev) => updateCartLine(prev, productId, patch));
    if ('expiryMonth' in patch) {
      setLineErrors((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
    }
  };

  const cartItems = lines
    .map((line) => ({ line, product: productMap.get(line.productId) }))
    .filter((x): x is { line: ReceiveLine; product: Product } => !!x.product);
  const units = cartUnits(lines);
  const total = cartItems.reduce((sum, { line }) => sum + line.price * line.quantity, 0);

  const handleFile = (next: File | null) => {
    if (!next) return setFile(null);
    const result = receiptFileSchema.safeParse(next);
    if (!result.success) return showToast(result.error.issues[0].message, 'error');
    setFile(next);
  };

  // Validasi memakai skema form stok masuk yang sama dengan form lama
  const validate = () => {
    const result = stockInFormSchema.safeParse({
      invoiceNumber,
      supplierName,
      date,
      file,
      items: cartItems.map(({ line, product }) => ({
        productId: product.id,
        expiryDate: monthToExpiryDate(line.expiryMonth),
        quantity: line.quantity,
        unit: product.unit,
        batch: line.batch.trim(),
        price: line.price,
      })),
    });
    if (result.success) {
      setHeaderErrors({});
      setLineErrors({});
      return result.data;
    }
    const nextHeader: HeaderErrors = {};
    const nextLines: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const [key, index] = issue.path;
      if (key === 'invoiceNumber' || key === 'date') nextHeader[key] ??= issue.message;
      if (key === 'items' && typeof index === 'number') {
        const id = cartItems[index]?.product.id;
        if (id) nextLines[id] ??= issue.message;
      }
    }
    setHeaderErrors(nextHeader);
    setLineErrors(nextLines);
    showToast('Lengkapi isian yang ditandai.', 'error');
    return null;
  };

  const submit = async () => {
    if (saving) return;
    const values = validate();
    if (!values) return;
    setSaving(true);
    try {
      // Nomor transaksi hanya untuk nama berkas foto; nomor transaksi = nomor nota
      let imageUrl: string | undefined;
      if (values.file) {
        try {
          const compressed = await compressImage(values.file, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.6,
            mimeType: 'image/webp',
          });
          const number = await transactionsApi.generateTransactionNumber('masuk');
          imageUrl = await stockInApi.uploadReceiptImage(compressed, number);
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          showToast(`Gagal mengunggah foto nota: ${getErrorMessage(uploadError)}`, 'warning');
        }
      }

      await createStockIn.mutateAsync({
        nomor: values.invoiceNumber.trim(),
        tanggal: values.date,
        tipe: 'masuk',
        tipe_sumber: 'PEMBELIAN',
        status: 'selesai',
        nama_pasien: values.supplierName.trim() || 'No Name',
        keterangan: `Invoice: ${values.invoiceNumber.trim()}`,
        bukti: imageUrl,
        total,
        items: values.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          batch: item.batch,
          expiryDate: item.expiryDate,
        })),
        services: [],
      });
      showToast(`Penerimaan ${values.invoiceNumber.trim()} disimpan.`, 'success');
      navigate(ROUTES.STOK_MASUK);
    } catch (error) {
      console.error('Error saving stock in:', error);
      showToast(withErrorDetail('Gagal menyimpan penerimaan', error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateProduct = async (data: Partial<Product>) => {
    try {
      const created = await createProduct.mutateAsync(data);
      addProduct(created);
      setAddingProduct(false);
      showToast(`${created.name} ditambahkan ke katalog dan penerimaan.`, 'success');
      return true;
    } catch (error) {
      console.error('Failed to create product', error);
      showToast('Gagal membuat produk baru.', 'error');
      return false;
    }
  };

  const catalog = (
    <PosCatalog
      query={query}
      onQueryChange={resetPage(setQuery)}
      onEnter={addTopResult}
      searchLabel="Cari produk"
      tools={
        <Button variant="outline" onClick={() => setAddingProduct(true)}>
          <PackagePlus aria-hidden />
          Produk baru
        </Button>
      }
      filters={
        <>
          <SegmentedControl
            label="Kategori"
            options={[
              { value: ALL, label: 'Semua' },
              ...CATEGORIES.map((c) => ({ value: c, label: CATEGORY_META[c].short })),
            ]}
            value={category}
            onChange={resetPage(setCategory)}
          />
          <FilterChips
            filters={restockOnly ? [{ key: 'restock', label: 'Hanya yang perlu restok' }] : []}
            onRemove={() => resetPage(setRestockOnly)(false)}
          />
        </>
      }
      items={catalogItems}
      getKey={(p) => p.id}
      renderItem={(p) => {
        const qty = lines.find((l) => l.productId === p.id)?.quantity ?? 0;
        const status = stockStatus(p);
        const opname = lockedBy.get(p.id);
        return (
          <ProductTile
            product={p}
            price={p.purchasePrice}
            stockText={
              opname
                ? `sedang dihitung di ${opname}`
                : `stok ${p.stock.toLocaleString('id-ID')} · min ${p.minStock}`
            }
            stockTone={status === 'habis' ? 'bad' : status === 'menipis' ? 'warn' : undefined}
            disabled={!!opname}
            badge={
              opname ? (
                <StatusChip tone="warn">Diopname</StatusChip>
              ) : qty > 0 ? (
                <StatusChip tone="info" plain>
                  + {qty}
                </StatusChip>
              ) : (
                status !== 'aman' && (
                  <StatusChip tone={STOCK_STATUS_META[status].tone}>
                    {STOCK_STATUS_META[status].label}
                  </StatusChip>
                )
              )
            }
            selected={qty > 0}
            onClick={() => addProduct(p)}
          />
        );
      }}
      page={page}
      onPageChange={setPage}
      isPending={isPending}
      isError={isError}
      onRetry={() => void refetch()}
      emptyTitle="Produk tidak ditemukan"
    />
  );

  const cart = (
    <SidePanel
      title="Penerimaan barang"
      footer={
        <PosCartFooter
          totals={{
            rows: [{ label: 'Jumlah unit', value: units.toLocaleString('id-ID') }],
            grand: { label: 'Nilai pembelian', value: rp(total) },
          }}
          submitLabel="Simpan penerimaan"
          submitIcon={Check}
          onSubmit={() => void submit()}
          onClear={() => setLines([])}
          disabled={cartItems.length === 0}
          busy={saving}
        />
      }
    >
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="No. nota / faktur" required error={headerErrors.invoiceNumber}>
          <Input
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            className="font-mono"
            autoComplete="off"
          />
        </Field>
        <Field label="Tanggal terima" required error={headerErrors.date}>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Supplier" className="col-span-2">
          <Input
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            list={supplierListId}
            autoComplete="off"
          />
        </Field>
        <datalist id={supplierListId}>
          {suppliers.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <FileDrop
          file={file}
          onFileChange={handleFile}
          accept="image/*"
          label="Unggah foto nota"
          hint="JPG atau PNG, maksimal 5 MB"
          className="col-span-2"
        />
      </div>

      {cartItems.length === 0 ? (
        <EmptyState
          icon={PackagePlus}
          title="Belum ada produk"
          description="Klik produk di katalog atau scan barcode."
        />
      ) : (
        <PanelSection title={`Produk diterima · ${cartItems.length}`}>
          <CartLines>
            {cartItems.map(({ line, product }) => {
              const warn = isExpiringSoon(line.expiryMonth);
              return (
                <CartLine
                  key={product.id}
                  label={product.name}
                  title={<ProductTitle product={product} />}
                  subtitle={`${product.brand?.trim() ? `${product.brand.trim()} · ` : ''}stok ${product.stock} → ${product.stock + line.quantity} ${product.unit.toLowerCase()}`}
                  amount={rp(line.price * line.quantity)}
                  quantity={{
                    value: line.quantity,
                    onChange: (q) => setLines((prev) => setCartQuantity(prev, product.id, q)),
                  }}
                  onRemove={() => setLines((prev) => removeFromCart(prev, product.id))}
                >
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    <Field label="Batch">
                      <Input
                        value={line.batch}
                        onChange={(e) => patchLine(product.id, { batch: e.target.value })}
                        placeholder="No. batch"
                        className="font-mono"
                      />
                    </Field>
                    <Field
                      label={
                        <span className="inline-flex items-center gap-1">
                          Kedaluwarsa
                          {warn && <StatusChip tone="warn">&lt; 6 bln</StatusChip>}
                        </span>
                      }
                      required
                      error={lineErrors[product.id]}
                    >
                      <Input
                        type="month"
                        value={line.expiryMonth}
                        onChange={(e) => patchLine(product.id, { expiryMonth: e.target.value })}
                      />
                    </Field>
                    <Field label="Harga beli" className="col-span-2 sm:col-span-1">
                      <CurrencyInput
                        value={line.price}
                        onValueChange={(v) => patchLine(product.id, { price: v ?? 0 })}
                      />
                    </Field>
                  </div>
                </CartLine>
              );
            })}
          </CartLines>
        </PanelSection>
      )}
    </SidePanel>
  );

  return (
    <>
      <PageHeader
        title="Terima barang"
        back={ROUTES.STOK_MASUK}
        stats={[
          {
            id: 'restock',
            label: 'Perlu restok',
            value: `${restockCount} produk`,
            tone: 'warn',
            onClick: () => resetPage(setRestockOnly)(!restockOnly),
            pressed: restockOnly,
          },
        ]}
      />
      <PosLayout
        catalog={catalog}
        cart={cart}
        cartLabel="Daftar penerimaan"
        bar={{
          summary: `${cartItems.length} produk · ${units.toLocaleString('id-ID')} unit`,
          value: rp(total),
          actionLabel: 'Lihat penerimaan',
          icon: PackageCheck,
        }}
      />

      <Dialog open={addingProduct} onOpenChange={setAddingProduct}>
        <DialogContent className="block max-w-xl p-0" aria-describedby={undefined}>
          <DialogTitle className="sr-only">Produk baru</DialogTitle>
          <ProductFormPanel
            existingCodes={existingCodes}
            ingredientNames={ingredientNames}
            saving={createProduct.isPending}
            onSave={handleCreateProduct}
            onDelete={() => undefined}
            onCancel={() => setAddingProduct(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StockInPos;
