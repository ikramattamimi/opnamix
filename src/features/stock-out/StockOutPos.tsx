import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Plus, Send, ShoppingBasket } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PosCartFooter, PosLayout } from '@/components/layout/PosLayout';
import { PosCatalog } from '@/components/layout/PosCatalog';
import { SegmentedControl } from '@/components/data/SegmentedControl';
import { ItemCard } from '@/components/data/ItemCard';
import { StatusChip } from '@/components/data/StatusChip';
import { ToneIcon } from '@/components/data/ToneIcon';
import { SidePanel, PanelSection } from '@/components/panel/SidePanel';
import { CartLine, CartLines } from '@/components/panel/CartLine';
import { InfoBox } from '@/components/panel/InfoBox';
import type { TotalRow } from '@/components/panel/Totals';
import { Field } from '@/components/form/Field';
import { OptionSelect } from '@/components/form/OptionSelect';
import { EmptyState } from '@/components/common/QueryState';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { rp } from '@/lib/format';
import { withErrorDetail } from '@/lib/utils';
import { ROUTES } from '@/types/routes';
import { getUserRoles } from '@/app/routeUtils';
import { useAuth } from '@/features/auth/useAuth';
import { useAllProducts } from '@/features/products/useProducts';
import { useAllServices } from '@/features/services/useServices';
import {
  CATEGORIES,
  CATEGORY_META,
  productMatches,
  sortProducts,
  stockStatus,
} from '@/features/products/catalog';
import { ProductTile } from '@/features/products/components/ProductTile';
import { ProductTitle } from '@/features/products/components/ProductTitle';
import { Category, type Product } from '@/features/products/types';
import { NO_CATEGORY, serviceCategoryMeta, serviceMatches } from '@/features/services/catalog';
import type { Service } from '@/features/services/types';
import {
  addToCart,
  removeFromCart,
  setCartQuantity,
  toggleId,
  type CartLineBase,
} from '@/features/transactions/posCart';
import {
  useCreateStockOutRequest,
  useNakesProfiles,
  useUpdateStockOutRequest,
} from './useStockOut';
import { stockOutManualSchema, stockOutRequestSchema } from './schemas';
import type { PosOutMode, PosOutState } from './navigation';

// POS Stok Keluar: permintaan pasien (diajukan nakes, diproses farmasi) atau
// pengeluaran manual (langsung mengurangi stok). Juga dipakai untuk mengedit
// permintaan yang masih menunggu dan menyalin transaksi lama.

type Tab = 'produk' | 'jasa';
type ProductCategoryFilter = 'Semua' | Category;
type FieldErrors = Partial<Record<'patientName' | 'date', string>>;

const ALL = 'Semua';
const today = () => new Date().toISOString().split('T')[0];

// Nilai select nakes; profil tanpa nama memakai id karena item select tidak boleh kosong
const nakesValue = (n: { id: string; full_name: string | null }) => n.full_name || n.id;

const StockOutPos: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const { userProfile } = useAuth();
  const roles = getUserRoles(userProfile);
  const isAdmin = roles.includes('admin');
  const isFarmasi = roles.includes('apoteker') || roles.includes('farmasi');
  const canRequest = isAdmin || roles.includes('nakes');
  const canManual = isAdmin || isFarmasi;

  // Isi awal dari daftar (edit/salin) dibaca sekali saat halaman dibuka
  const [initial] = useState(() => (location.state as PosOutState | null) ?? null);
  const editing = initial?.intent === 'edit' ? initial.request : null;

  const requestedMode: PosOutMode = searchParams.get('mode') === 'manual' ? 'manual' : 'permintaan';
  const mode: PosOutMode = editing
    ? 'permintaan'
    : requestedMode === 'manual'
      ? canManual || !canRequest
        ? 'manual'
        : 'permintaan'
      : canRequest || !canManual
        ? 'permintaan'
        : 'manual';
  const manual = mode === 'manual';

  const { data: products = [], isPending, isError, refetch } = useAllProducts();
  const { data: allServices = [] } = useAllServices();
  const services = useMemo(() => allServices.filter((s) => s.isActive !== false), [allServices]);
  const { data: nakesList = [], isPending: nakesPending } = useNakesProfiles();
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const createMutation = useCreateStockOutRequest();
  const updateMutation = useUpdateStockOutRequest();
  const busy = createMutation.isPending || updateMutation.isPending;

  // --- Katalog ---
  const [tab, setTab] = useState<Tab>('produk');
  const [category, setCategory] = useState<ProductCategoryFilter>(ALL);
  const [serviceCategory, setServiceCategory] = useState(ALL);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const showServices = !manual && tab === 'jasa';

  // --- Keranjang dan data pasien ---
  const [lines, setLines] = useState<CartLineBase[]>(
    () =>
      initial?.request.drugs.map((d) => ({ productId: d.productId, quantity: d.quantity })) ?? [],
  );
  const [serviceIds, setServiceIds] = useState<string[]>(
    () => initial?.request.services.map((s) => s.id) ?? [],
  );
  const [patientName, setPatientName] = useState(initial?.request.patient.fullName ?? '');
  const [birthDate, setBirthDate] = useState(initial?.request.patient.birthDate ?? '');
  const [nakesName, setNakesName] = useState(initial?.request.requestedBy ?? '');
  const [date, setDate] = useState(today);
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  // Nakes default: pengguna sendiri kalau ada di daftar, selain itu nakes pertama
  const nakesDefaulted = useRef(!!initial);
  useEffect(() => {
    if (nakesDefaulted.current || nakesList.length === 0) return;
    nakesDefaulted.current = true;
    const own = nakesList.find((n) => n.id === userProfile?.id);
    setNakesName(nakesValue(own ?? nakesList[0]));
  }, [nakesList, userProfile?.id]);

  const resetPage =
    <T,>(setter: (v: T) => void) =>
    (v: T) => {
      setter(v);
      setPage(1);
    };

  const productList = useMemo(
    () =>
      sortProducts(
        products.filter(
          (p) => (category === ALL || p.category === category) && productMatches(p, query),
        ),
        'nama',
      ),
    [products, category, query],
  );
  const serviceList = useMemo(
    () =>
      services.filter(
        (s) =>
          (serviceCategory === ALL || (s.categoryName ?? NO_CATEGORY) === serviceCategory) &&
          serviceMatches(s, query),
      ),
    [services, serviceCategory, query],
  );
  const serviceCategories = useMemo(
    () => [...new Set(services.map((s) => s.categoryName ?? NO_CATEGORY))],
    [services],
  );

  const quantityOf = (id: string) => lines.find((l) => l.productId === id)?.quantity ?? 0;

  const addProduct = (product: Product) => {
    if (product.stock <= 0) return;
    if (quantityOf(product.id) >= product.stock) {
      showToast(`Stok ${product.name} hanya ${product.stock}.`, 'warning');
      return;
    }
    setLines((prev) =>
      addToCart(prev, product.id, () => ({ productId: product.id, quantity: 1 }), product.stock),
    );
  };

  const addTopResult = () => {
    if (showServices) {
      const first = serviceList[0];
      if (first) setServiceIds((prev) => (prev.includes(first.id) ? prev : [...prev, first.id]));
    } else {
      const first = productList.find((p) => p.stock > 0);
      if (first) addProduct(first);
    }
    if (query) resetPage(setQuery)('');
  };

  // --- Total ---
  const cartProducts = lines
    .map((line) => ({ line, product: productMap.get(line.productId) }))
    .filter((x): x is { line: CartLineBase; product: Product } => !!x.product);
  const cartServices = manual
    ? []
    : serviceIds
        .map((id) => services.find((s) => s.id === id) ?? allServices.find((s) => s.id === id))
        .filter((s): s is Service => !!s);
  const totalDrugs = cartProducts.reduce(
    (sum, x) => sum + x.product.sellingPrice * x.line.quantity,
    0,
  );
  const totalServices = cartServices.reduce((sum, s) => sum + s.price, 0);
  const serviceFee = editing?.serviceFee ?? 0;
  const discount = editing?.discount ?? 0;
  const grandTotal = Math.max(0, totalDrugs + totalServices + serviceFee - discount);
  const itemCount = cartProducts.length + cartServices.length;
  // Item edit/salin yang produknya sudah tidak aktif tidak bisa ikut disimpan
  const missingCount = isPending || isError ? 0 : lines.length - cartProducts.length;

  const totalRows: TotalRow[] = [
    { label: 'Obat & BHP', value: rp(totalDrugs) },
    ...(manual ? [] : [{ label: 'Jasa', value: rp(totalServices) }]),
    ...(serviceFee ? [{ label: 'Biaya layanan', value: rp(serviceFee) }] : []),
    ...(discount ? [{ label: 'Diskon', value: `−${rp(discount)}` }] : []),
  ];

  const clearCart = () => {
    setLines([]);
    setServiceIds([]);
  };

  const drugValues = cartProducts.map(({ line, product }) => ({
    productId: product.id,
    productName: product.name,
    unit: product.unit,
    instructions: '-',
    quantity: line.quantity,
  }));
  const itemsPayload = cartProducts.map(({ line, product }) => ({
    productId: product.id,
    quantity: line.quantity,
    price: product.sellingPrice,
  }));
  const servicesPayload = cartServices.map((s) => ({ serviceId: s.id, price: s.price }));

  // Validasi memakai skema form yang sama dengan form lama
  const validate = (): boolean => {
    const result = manual
      ? stockOutManualSchema.safeParse({
          formNumber: `OUT-${Date.now()}`,
          date,
          patientName,
          patientBirthDate: birthDate,
          reason,
          items: drugValues,
        })
      : stockOutRequestSchema.safeParse({
          formNumber: editing?.requestId ?? `#REQ-${new Date().getFullYear()}`,
          patientName,
          patientBirthDate: birthDate,
          nakesName,
          drugs: drugValues,
          serviceIds: cartServices.map((s) => s.id),
          serviceFee,
          discount,
        });
    if (result.success) {
      setErrors({});
      return true;
    }
    const next: FieldErrors = {};
    let other: string | undefined;
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (key === 'patientName' || key === 'date') next[key] ??= issue.message;
      else other ??= issue.message;
    }
    setErrors(next);
    if (other) showToast(manual ? 'Tambahkan minimal 1 obat atau BHP.' : other, 'error');
    return false;
  };

  const submit = async () => {
    if (busy || !validate()) return;
    try {
      if (editing) {
        await updateMutation.mutateAsync({
          number: editing.id,
          payload: {
            tanggal: editing.date,
            nama_pasien: patientName.trim(),
            tanggal_lahir_pasien: birthDate,
            nama_nakes: nakesName,
            total: grandTotal,
            diskon: discount,
            serviceFee,
            items: itemsPayload,
            services: servicesPayload,
          },
        });
        showToast('Permintaan diperbarui.', 'success');
      } else if (manual) {
        await createMutation.mutateAsync({
          tanggal: date,
          tipe: 'keluar',
          tipe_sumber: 'KASIR_LANGSUNG',
          status: 'selesai',
          nama_pasien: patientName.trim(),
          tanggal_lahir_pasien: birthDate,
          keterangan: reason.trim() || '-',
          total: grandTotal,
          items: itemsPayload,
          services: [],
          requestedBy: isAdmin ? 'Admin' : 'Farmasi',
        });
        showToast(`Stok keluar untuk ${patientName.trim()} dicatat.`, 'success');
      } else {
        await createMutation.mutateAsync({
          tanggal: today(),
          tipe: 'keluar',
          tipe_sumber: 'PENGAJUAN_NAKES',
          status: 'diajukan',
          nama_pasien: patientName.trim(),
          tanggal_lahir_pasien: birthDate,
          keterangan: '',
          total: grandTotal,
          diskon: 0,
          serviceFee: 0,
          items: itemsPayload,
          services: servicesPayload,
          requestedBy: nakesName,
        });
        showToast(`Permintaan untuk ${patientName.trim()} diajukan.`, 'success');
      }
      navigate(ROUTES.STOK_KELUAR);
    } catch (error) {
      console.error('Error saving stock out:', error);
      showToast(withErrorDetail('Gagal menyimpan transaksi', error), 'error');
    }
  };

  // --- Tampilan ---
  const title = editing ? 'Edit permintaan' : manual ? 'Keluar manual' : 'Permintaan baru';

  const categoryFilter = showServices ? (
    <SegmentedControl
      label="Kategori jasa"
      options={[ALL, ...serviceCategories].map((c) => ({ value: c, label: c }))}
      value={serviceCategories.includes(serviceCategory) ? serviceCategory : ALL}
      onChange={resetPage(setServiceCategory)}
    />
  ) : (
    <SegmentedControl
      label="Kategori"
      options={[
        { value: ALL, label: 'Semua' },
        ...CATEGORIES.map((c) => ({ value: c, label: CATEGORY_META[c].short })),
      ]}
      value={category}
      onChange={resetPage(setCategory)}
    />
  );

  const renderProduct = (p: Product) => {
    const qty = quantityOf(p.id);
    const status = stockStatus(p);
    return (
      <ProductTile
        product={p}
        price={p.sellingPrice}
        stockText={
          status === 'habis'
            ? 'stok habis'
            : `sisa ${p.stock.toLocaleString('id-ID')} ${p.unit.toLowerCase()}`
        }
        stockTone={status === 'habis' ? 'bad' : status === 'menipis' ? 'warn' : undefined}
        badge={
          qty > 0 ? (
            <StatusChip tone="info" plain>
              × {qty}
            </StatusChip>
          ) : (
            status === 'habis' && <StatusChip tone="bad">Habis</StatusChip>
          )
        }
        selected={qty > 0}
        disabled={status === 'habis'}
        onClick={() => addProduct(p)}
      />
    );
  };

  const renderService = (s: Service) => {
    const meta = serviceCategoryMeta(s.categoryName);
    const picked = serviceIds.includes(s.id);
    return (
      <ItemCard
        topStart={<ToneIcon icon={meta.icon} tone={meta.tone} size="sm" />}
        topEnd={
          picked && (
            <StatusChip tone="info" plain>
              Dipilih
            </StatusChip>
          )
        }
        title={s.name}
        subtitle={s.categoryName ?? NO_CATEGORY}
        footer={
          <>
            <b>{rp(s.price)}</b>
            <ToneIcon icon={picked ? Check : Plus} size="sm" />
          </>
        }
        selected={picked}
        onClick={() => setServiceIds((prev) => toggleId(prev, s.id))}
      />
    );
  };

  const catalog = showServices ? (
    <PosCatalog
      query={query}
      onQueryChange={resetPage(setQuery)}
      onEnter={addTopResult}
      searchLabel="Cari jasa"
      placeholder="Cari jasa, Enter untuk memilih"
      tools={<CatalogTabs tab={tab} onChange={resetPage(setTab)} />}
      filters={categoryFilter}
      items={serviceList}
      getKey={(s) => s.id}
      renderItem={renderService}
      page={page}
      onPageChange={setPage}
      emptyTitle="Jasa tidak ditemukan"
    />
  ) : (
    <PosCatalog
      query={query}
      onQueryChange={resetPage(setQuery)}
      onEnter={addTopResult}
      searchLabel="Cari produk"
      tools={!manual && <CatalogTabs tab={tab} onChange={resetPage(setTab)} />}
      filters={categoryFilter}
      items={productList}
      getKey={(p) => p.id}
      renderItem={renderProduct}
      page={page}
      onPageChange={setPage}
      isPending={isPending}
      isError={isError}
      onRetry={() => void refetch()}
      emptyTitle="Produk tidak ditemukan"
    />
  );

  const fields = (
    <div className="grid grid-cols-2 gap-2.5">
      <Field label="Nama pasien" required error={errors.patientName} className="col-span-2">
        <Input
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
          placeholder="Nama lengkap pasien"
          autoComplete="off"
        />
      </Field>
      <Field label="Tanggal lahir" className={manual ? undefined : 'col-span-2 sm:col-span-1'}>
        <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
      </Field>
      {manual ? (
        <>
          <Field label="Tanggal keluar" required error={errors.date}>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Keterangan" className="col-span-2">
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Rusak, sampel, dll."
            />
          </Field>
        </>
      ) : (
        <Field label="Diajukan oleh" className="col-span-2 sm:col-span-1">
          <OptionSelect
            value={nakesName}
            onValueChange={setNakesName}
            placeholder={
              nakesPending
                ? 'Memuat data nakes...'
                : nakesList.length
                  ? 'Pilih nakes'
                  : 'Belum ada akun nakes'
            }
            options={[
              ...nakesList.map((n) => ({ value: nakesValue(n), label: n.full_name || n.id })),
              // Nama lama yang tidak ada di daftar tetap bisa dipilih saat edit
              ...(nakesName && !nakesList.some((n) => nakesValue(n) === nakesName)
                ? [{ value: nakesName, label: nakesName }]
                : []),
            ]}
          />
        </Field>
      )}
    </div>
  );

  const cart = (
    <SidePanel
      title={manual ? 'Pengeluaran manual' : 'Permintaan pasien'}
      eyebrow={editing ? `Edit · ${editing.requestId}` : undefined}
      badge={
        canRequest &&
        canManual &&
        !editing && (
          <SegmentedControl
            label="Mode"
            options={[
              { value: 'permintaan', label: 'Permintaan' },
              { value: 'manual', label: 'Manual' },
            ]}
            value={mode}
            onChange={(next: PosOutMode) => {
              setSearchParams(next === 'manual' ? { mode: 'manual' } : {}, { replace: true });
              setTab('produk');
              setPage(1);
            }}
          />
        )
      }
      footer={
        <PosCartFooter
          totals={{ rows: totalRows, grand: { label: 'Total', value: rp(grandTotal) } }}
          submitLabel={
            editing ? 'Simpan perubahan' : manual ? 'Keluarkan stok' : 'Ajukan permintaan'
          }
          submitIcon={editing ? Check : Send}
          onSubmit={() => void submit()}
          onClear={clearCart}
          disabled={itemCount === 0}
          busy={busy}
        />
      }
    >
      {fields}
      {missingCount > 0 && (
        <InfoBox tone="warn">
          {missingCount} obat/BHP dari transaksi asal sudah tidak aktif di Data Produk dan tidak
          ikut disimpan.
        </InfoBox>
      )}
      {itemCount === 0 ? (
        <EmptyState
          icon={ShoppingBasket}
          title="Belum ada item"
          description="Klik item di katalog, atau ketik nama lalu tekan Enter."
        />
      ) : (
        <>
          {cartProducts.length > 0 && (
            <PanelSection title={`Obat & BHP · ${cartProducts.length}`}>
              <CartLines>
                {cartProducts.map(({ line, product }) => (
                  <CartLine
                    key={product.id}
                    label={product.name}
                    title={<ProductTitle product={product} />}
                    subtitle={`${product.brand?.trim() ? `${product.brand.trim()} · ` : ''}${rp(product.sellingPrice)} / ${product.unit.toLowerCase()} · sisa ${product.stock}`}
                    amount={rp(product.sellingPrice * line.quantity)}
                    quantity={{
                      value: line.quantity,
                      max: Math.max(product.stock, line.quantity),
                      onChange: (q) => setLines((prev) => setCartQuantity(prev, product.id, q)),
                    }}
                    onRemove={() => setLines((prev) => removeFromCart(prev, product.id))}
                  />
                ))}
              </CartLines>
            </PanelSection>
          )}
          {cartServices.length > 0 && (
            <PanelSection title={`Jasa · ${cartServices.length}`}>
              <CartLines>
                {cartServices.map((s) => (
                  <CartLine
                    key={s.id}
                    label={s.name}
                    title={s.name}
                    subtitle={s.categoryName ?? NO_CATEGORY}
                    amount={rp(s.price)}
                    onRemove={() => setServiceIds((prev) => toggleId(prev, s.id))}
                  />
                ))}
              </CartLines>
            </PanelSection>
          )}
        </>
      )}
    </SidePanel>
  );

  return (
    <>
      <PageHeader title={title} back={ROUTES.STOK_KELUAR} />
      <PosLayout
        catalog={catalog}
        cart={cart}
        cartLabel="Keranjang"
        bar={{
          summary: `${itemCount} item`,
          value: rp(grandTotal),
          actionLabel: 'Lihat keranjang',
          icon: ShoppingBasket,
        }}
      />
    </>
  );
};

const CatalogTabs: React.FC<{ tab: Tab; onChange: (tab: Tab) => void }> = ({ tab, onChange }) => (
  <SegmentedControl
    label="Jenis item"
    options={[
      { value: 'produk', label: 'Obat & BHP' },
      { value: 'jasa', label: 'Jasa' },
    ]}
    value={tab}
    onChange={onChange}
  />
);

export default StockOutPos;
