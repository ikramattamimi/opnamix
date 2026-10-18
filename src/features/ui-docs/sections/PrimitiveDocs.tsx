import React, { useState } from 'react';
import { Archive, Boxes, Lock, Pill, ShieldCheck, Syringe, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ListWithPanel } from '@/components/layout/ListWithPanel';
import { SidePanel, PanelSection } from '@/components/panel/SidePanel';
import { MiniStats } from '@/components/panel/MiniStats';
import { DefinitionList } from '@/components/panel/DefinitionList';
import { LineItems } from '@/components/panel/LineItems';
import { Totals } from '@/components/panel/Totals';
import { Timeline } from '@/components/panel/Timeline';
import { InfoBox } from '@/components/panel/InfoBox';
import { SettingRow } from '@/components/panel/SettingRow';
import { Toolbar, ToolbarSpacer } from '@/components/data/Toolbar';
import { SearchInput } from '@/components/data/SearchInput';
import { SegmentedControl } from '@/components/data/SegmentedControl';
import { FilterChips } from '@/components/data/FilterChips';
import { ResponsiveGrid } from '@/components/data/ResponsiveGrid';
import { ItemCard } from '@/components/data/ItemCard';
import { ListRow, GroupedList } from '@/components/data/ListRow';
import { KpiStrip } from '@/components/data/KpiStrip';
import { StatusChip } from '@/components/data/StatusChip';
import { Meter } from '@/components/data/Meter';
import { Avatar } from '@/components/data/Avatar';
import { CategoryIcon } from '@/components/data/CategoryIcon';
import { ToneIcon } from '@/components/data/ToneIcon';
import { BrandTag } from '@/components/data/BrandTag';
import { Pagination } from '@/components/data/Pagination';
import { Field } from '@/components/form/Field';
import { CurrencyInput } from '@/components/form/CurrencyInput';
import { QuantityStepper } from '@/components/form/QuantityStepper';
import { Switch } from '@/components/form/Switch';
import { CheckboxCard } from '@/components/form/CheckboxCard';
import { ChoiceChips } from '@/components/form/ChoiceChips';
import { DateRangeControl } from '@/components/form/DateRangeControl';
import { PasswordInput } from '@/components/form/PasswordInput';
import { FileDrop } from '@/components/form/FileDrop';
import { generatePassword } from '@/components/form/password';
import { useGridPageSize } from '@/hooks/useGridPageSize';
import { useListSelection } from '@/hooks/useListSelection';
import { useDateRange } from '@/hooks/useDateRange';
import { rp } from '@/lib/format';
import { DocExample, DocSection } from '../components/DocSection';

// Data contoh untuk dokumentasi
const PRODUCTS = [
  {
    id: 'p1',
    name: 'Paracetamol 500 mg',
    brand: 'Sanmol',
    tone: 'obat',
    icon: Pill,
    stock: 120,
    min: 30,
    price: 3500,
  },
  {
    id: 'p2',
    name: 'Amoxicillin 500 mg',
    brand: 'Amoxsan',
    tone: 'obat',
    icon: Pill,
    stock: 8,
    min: 20,
    price: 1200,
  },
  {
    id: 'p3',
    name: 'Spuit 3 ml',
    brand: 'Terumo',
    tone: 'bhp',
    icon: Boxes,
    stock: 0,
    min: 50,
    price: 2500,
  },
  {
    id: 'p4',
    name: 'Vaksin Hepatitis B',
    brand: '',
    tone: 'imun',
    icon: Syringe,
    stock: 14,
    min: 10,
    price: 85000,
  },
  {
    id: 'p5',
    name: 'Kasa steril 16 × 16',
    brand: 'Onemed',
    tone: 'bhp',
    icon: Boxes,
    stock: 56,
    min: 40,
    price: 4000,
  },
  {
    id: 'p6',
    name: 'Ibuprofen 400 mg',
    brand: 'Proris',
    tone: 'obat',
    icon: Pill,
    stock: 44,
    min: 20,
    price: 2100,
  },
] as const;

type Product = (typeof PRODUCTS)[number];

const status = (p: Product) =>
  p.stock === 0
    ? ({ tone: 'bad', label: 'Habis' } as const)
    : p.stock < p.min
      ? ({ tone: 'warn', label: 'Menipis' } as const)
      : ({ tone: 'ok', label: 'Aman' } as const);

const TRANSACTIONS = [
  {
    id: 't1',
    at: new Date(2026, 9, 18, 10, 12),
    who: 'Siti Rahmawati',
    by: 'dr. Laila',
    no: 'SK-2026-00128',
    total: 42500,
    st: 'Menunggu',
  },
  {
    id: 't2',
    at: new Date(2026, 9, 18, 8, 40),
    who: 'Budi Santoso',
    by: 'Rina K.',
    no: 'SK-2026-00127',
    total: 18000,
    st: 'Selesai',
  },
  {
    id: 't3',
    at: new Date(2026, 9, 17, 15, 5),
    who: 'Ahmad Fauzi',
    by: 'dr. Laila',
    no: 'SK-2026-00126',
    total: 96000,
    st: 'Selesai',
  },
];

export const ListPanelDocs: React.FC = () => {
  const { selectedId, select, panelOpen, closePanel } = useListSelection<string>('p2');
  const product = PRODUCTS.find((p) => p.id === selectedId) ?? PRODUCTS[0];
  const st = status(product);
  return (
    <DocSection
      id="list-panel"
      title="ListWithPanel dan SidePanel"
      description="Daftar di kiri dan panel kanan. Panel menempel di bawah header pada layar lebar dan menjadi laci dari kanan di bawah 1180px. Isi panel disusun dari MiniStats, DefinitionList, LineItems, Totals, Timeline, InfoBox, dan SettingRow."
      importPath="import { ListWithPanel } from '@/components/layout/ListWithPanel'; import { SidePanel, PanelSection } from '@/components/panel/SidePanel';"
    >
      <DocExample
        title="Daftar + panel detail"
        note="useListSelection menyimpan item terpilih dan membuka laci di layar sempit."
        code={`
const { selectedId, select, panelOpen, closePanel } = useListSelection<string>();

<ListWithPanel
  list={<ItemList onSelect={select} />}
  panelOpen={panelOpen}
  onPanelClose={closePanel}
  panel={
    <SidePanel icon={Pill} tone="obat" eyebrow="Obat" title={p.name}
      badge={<StatusChip tone="warn">Menipis</StatusChip>}
      footer={<Button>Simpan</Button>}>
      <MiniStats items={[...]} />
      <DefinitionList items={[...]} />
    </SidePanel>
  }
/>`}
      >
        <ListWithPanel
          className="w-full"
          panelOpen={panelOpen}
          onPanelClose={closePanel}
          list={
            <div className="flex flex-col gap-0.5 rounded-card border bg-card p-2">
              {PRODUCTS.slice(0, 4).map((p) => (
                <ListRow
                  key={p.id}
                  lead={<ToneIcon icon={p.icon} tone={p.tone} />}
                  title={p.name}
                  subtitle={p.brand || 'Generik'}
                  middle={`${p.stock} tersedia`}
                  middleSub={`Minimum ${p.min}`}
                  value={rp(p.price)}
                  status={<StatusChip tone={status(p).tone}>{status(p).label}</StatusChip>}
                  selected={p.id === selectedId}
                  onClick={() => select(p.id)}
                />
              ))}
            </div>
          }
          panel={
            <SidePanel
              icon={product.icon}
              tone={product.tone}
              eyebrow={
                product.tone === 'imun' ? 'Imunisasi' : product.tone === 'bhp' ? 'BHP' : 'Obat'
              }
              title={product.name}
              badge={<StatusChip tone={st.tone}>{st.label}</StatusChip>}
              footer={
                <>
                  <Button variant="ghost" className="text-bad hover:bg-bad-soft hover:text-bad">
                    <Trash2 aria-hidden /> Hapus
                  </Button>
                  <span className="hidden flex-1 sm:block" />
                  <Button>Simpan</Button>
                </>
              }
            >
              <MiniStats
                items={[
                  { label: 'Stok', value: product.stock },
                  { label: 'Minimum', value: product.min },
                  { label: 'Harga', value: rp(product.price) },
                ]}
              />
              <PanelSection title="Rincian">
                <DefinitionList
                  items={[
                    { label: 'Merek', value: product.brand || 'Generik' },
                    { label: 'Kode', value: <span className="font-mono text-xs">OBT-0042</span> },
                    { label: 'Terakhir masuk', value: '12 Okt 2026' },
                  ]}
                />
              </PanelSection>
              {st.tone !== 'ok' && (
                <InfoBox tone="warn">Stok di bawah minimum. Buat penerimaan barang.</InfoBox>
              )}
            </SidePanel>
          }
        />
      </DocExample>

      <DocExample
        title="Isi panel transaksi"
        code={`
<LineItems items={[{ id, title, subtitle, amount }]} />
<Totals rows={[{ label: 'Produk', value: rp(30000) }]} grand={{ label: 'Total', value: rp(42500) }} />
<Timeline items={[{ id, title, subtitle, tone: 'ok' | 'warn' }]} />
<InfoBox tone="info" icon={Lock}>…</InfoBox>`}
      >
        <div className="grid w-full gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <LineItems
              items={[
                {
                  id: 1,
                  title: 'Paracetamol 500 mg',
                  subtitle: 'Sanmol · 10 tablet × Rp 3.500',
                  amount: rp(35000),
                },
                { id: 2, title: 'Jasa injeksi', subtitle: 'Tindakan', amount: rp(7500) },
              ]}
            />
            <Totals
              rows={[
                { label: 'Produk', value: rp(35000) },
                { label: 'Jasa', value: rp(7500) },
              ]}
              grand={{ label: 'Total', value: rp(42500) }}
            />
          </div>
          <div className="flex flex-col gap-3">
            <Timeline
              items={[
                { id: 1, title: 'Permintaan dibuat', subtitle: 'dr. Laila · 10.12' },
                { id: 2, title: 'Diproses farmasi', subtitle: 'Rina K. · 10.20' },
                { id: 3, title: 'Menunggu diambil', subtitle: 'Belum selesai', tone: 'warn' },
              ]}
            />
            <InfoBox icon={Lock}>
              3 produk sedang diopname dan sementara tidak bisa dipilih.
            </InfoBox>
          </div>
        </div>
      </DocExample>

      <DocExample
        title="SettingRow"
        code={`<SettingRow title="Stok menipis" description="…" control={<Switch … />} />`}
      >
        <SettingRowDemo />
      </DocExample>
    </DocSection>
  );
};

const SettingRowDemo: React.FC = () => {
  const [low, setLow] = useState(true);
  const [daily, setDaily] = useState(false);
  return (
    <div className="w-full max-w-lg">
      <SettingRow
        title="Stok menipis"
        description="Kabari saat stok di bawah minimum."
        control={<Switch checked={low} onCheckedChange={setLow} label="Stok menipis" />}
      />
      <SettingRow
        title="Ringkasan harian"
        description="Kirim ringkasan transaksi setiap pagi."
        control={<Switch checked={daily} onCheckedChange={setDaily} label="Ringkasan harian" />}
      />
    </div>
  );
};

export const DataPrimitiveDocs: React.FC = () => {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('semua');
  const [filters, setFilters] = useState([
    { key: 'menipis', label: 'Menipis' },
    { key: 'obat', label: 'Kategori: Obat' },
  ]);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string>('p1');
  const grid = useGridPageSize(208, 1);
  const items = PRODUCTS.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <DocSection
      id="data"
      title="Primitif daftar"
      description="Toolbar, SearchInput, FilterChips, ResponsiveGrid + useGridPageSize, ItemCard, ListRow + GroupedList, KpiStrip, StatusChip, Meter, Avatar, CategoryIcon, BrandTag. Halaman menyusun daftar hanya dari komponen ini."
      importPath="@/components/data/* · useGridPageSize dari '@/hooks/useGridPageSize'"
    >
      <DocExample
        title="Toolbar, SearchInput, FilterChips"
        note="Tekan / untuk memfokuskan kotak cari."
        code={`
<Toolbar>
  <SearchInput value={q} onChange={setQ} placeholder="Cari produk…" />
  <SegmentedControl … />
  <ToolbarSpacer />
  <Button variant="outline">Ekspor</Button>
</Toolbar>
<FilterChips filters={filters} onRemove={remove} onClear={clear} />`}
      >
        <div className="flex w-full flex-col gap-2.5">
          <Toolbar>
            <SearchInput value={q} onChange={setQ} placeholder="Cari produk…" />
            <SegmentedControl
              label="Kategori"
              value={cat}
              onChange={setCat}
              options={[
                { value: 'semua', label: 'Semua', count: 6 },
                { value: 'obat', label: 'Obat', count: 3 },
                { value: 'bhp', label: 'BHP', count: 2 },
              ]}
            />
            <ToolbarSpacer />
            <Button variant="outline">Ekspor</Button>
          </Toolbar>
          <FilterChips
            filters={filters}
            onRemove={(key) => setFilters((f) => f.filter((x) => x.key !== key))}
            onClear={() => setFilters([])}
          />
        </div>
      </DocExample>

      <DocExample
        title="ResponsiveGrid + ItemCard"
        note="useGridPageSize(lebarMinimum, baris) menghitung kolom dari lebar wadah; ukuran halaman = kolom × baris."
        code={`
const grid = useGridPageSize(208, 3);
<ResponsiveGrid ref={grid.ref} cols={grid.cols}>
  {page.map((p) => (
    <ItemCard
      key={p.id}
      topStart={<BrandTag tone="obat">{p.brand}</BrandTag>}
      topEnd={<StatusChip tone="warn">Menipis</StatusChip>}
      title={p.name}
      meter={<Meter value={p.stock / (p.min * 2)} tone="warn" />}
      footer={<><span><b>{p.stock}</b> tersedia</span><b>{rp(p.price)}</b></>}
      selected={p.id === selected}
      onClick={() => select(p.id)}
    />
  ))}
</ResponsiveGrid>`}
      >
        <div className="w-full">
          <ResponsiveGrid ref={grid.ref} cols={grid.cols}>
            {items.slice(0, Math.max(grid.cols, 1) * 2).map((p) => {
              const s = status(p);
              return (
                <ItemCard
                  key={p.id}
                  topStart={
                    <BrandTag tone={p.tone} generic={!p.brand}>
                      {p.brand || 'Generik'}
                    </BrandTag>
                  }
                  topEnd={<StatusChip tone={s.tone}>{s.label}</StatusChip>}
                  title={p.name}
                  subtitle={
                    <span className="flex items-center gap-1.5">
                      <CategoryIcon icon={p.icon} tone={p.tone} />
                      <span className="font-mono text-2xs">OBT-00{p.id.slice(1)}</span>
                    </span>
                  }
                  meter={<Meter value={p.stock / (p.min * 2)} tone={s.tone} label="Sisa stok" />}
                  footer={
                    <>
                      <span>
                        <b>{p.stock}</b> tersedia
                      </span>
                      <b>{rp(p.price)}</b>
                    </>
                  }
                  selected={p.id === selected}
                  onClick={() => setSelected(p.id)}
                />
              );
            })}
          </ResponsiveGrid>
        </div>
      </DocExample>

      <DocExample
        title="ListRow + GroupedList"
        note="Baris transaksi dikelompokkan per hari dengan groupByDay (listGroups.ts) dan dayLabel (lib/format)."
        code={`
<GroupedList
  groups={groupByDay(rows, (r) => r.at, (d) => dayLabel(d))}
  getKey={(r) => r.id}
  renderItem={(r) => (
    <ListRow lead={<Avatar name={r.who} />} title={r.who} subtitle={r.no}
      middle={r.by} value={rp(r.total)} status={<StatusChip tone="ok">Selesai</StatusChip>}
      selected={r.id === sel} onClick={() => select(r.id)} />
  )}
/>`}
      >
        <div className="w-full">
          <GroupedList
            groups={[
              { key: 'a', label: 'Hari ini · Minggu, 18 Oktober', items: TRANSACTIONS.slice(0, 2) },
              { key: 'b', label: 'Kemarin · Sabtu, 17 Oktober', items: TRANSACTIONS.slice(2) },
            ]}
            getKey={(t) => t.id}
            renderItem={(t) => (
              <ListRow
                lead={<Avatar name={t.who} />}
                title={t.who}
                subtitle={<span className="font-mono">{t.no}</span>}
                middle={t.by}
                middleSub="Permintaan"
                value={rp(t.total)}
                status={<StatusChip tone={t.st === 'Selesai' ? 'ok' : 'warn'}>{t.st}</StatusChip>}
                onClick={() => undefined}
              />
            )}
          />
          <Pagination
            page={page}
            pageSize={10}
            total={46}
            onPageChange={setPage}
            className="mt-2"
          />
        </div>
      </DocExample>

      <DocExample
        title="KpiStrip, StatusChip, Meter, Avatar, CategoryIcon, BrandTag"
        code={`
<KpiStrip items={[{ label: 'Kurang', value: '−Rp 84.000', note: '6 produk', swatch: 'bg-chart-minus' }]} />
<StatusChip tone="ok">Aman</StatusChip>
<Meter value={0.4} tone="warn" />
<Avatar name="Rina Kartika" tone="imun" />
<CategoryIcon icon={Pill} tone="obat" />
<BrandTag tone="bhp">Terumo</BrandTag>`}
      >
        <div className="flex w-full flex-col gap-3">
          <KpiStrip
            items={[
              { label: 'Nilai bersih', value: '−Rp 62.500', note: '9 produk selisih' },
              { label: 'Kurang', value: '−Rp 84.000', note: '6 produk', swatch: 'bg-chart-minus' },
              { label: 'Lebih', value: '+Rp 21.500', note: '3 produk', swatch: 'bg-chart-plus' },
              { label: 'Akurasi hitung', value: '94%', note: '141 dari 150 cocok' },
            ]}
          />
          <div className="flex flex-wrap items-center gap-3">
            <StatusChip tone="ok">Aman</StatusChip>
            <StatusChip tone="warn">Menipis</StatusChip>
            <StatusChip tone="bad">Habis</StatusChip>
            <StatusChip tone="info">Dijadwalkan</StatusChip>
            <StatusChip tone="neutral">Draft</StatusChip>
            <Meter value={0.4} tone="warn" className="w-24" label="Contoh meter" />
            <Avatar name="Rina Kartika" />
            <Avatar name="Laila Kurnia" tone="imun" size="lg" />
            <CategoryIcon icon={Pill} tone="obat" />
            <CategoryIcon icon={Boxes} tone="bhp" />
            <CategoryIcon icon={Syringe} tone="imun" />
            <CategoryIcon icon={Archive} tone="alkes" />
            <BrandTag tone="obat">Sanmol</BrandTag>
            <BrandTag tone="bhp" size="sm">
              Terumo
            </BrandTag>
            <BrandTag generic>Generik</BrandTag>
          </div>
        </div>
      </DocExample>
    </DocSection>
  );
};

export const FormPrimitiveDocs: React.FC = () => {
  const [price, setPrice] = useState<number | null>(12500);
  const [qty, setQty] = useState(2);
  const [roles, setRoles] = useState({ admin: true, farmasi: false });
  const [reasons, setReasons] = useState<string[]>(['rusak']);
  const [single, setSingle] = useState<string | null>('obat');
  const [password, setPassword] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const range = useDateRange('7');
  return (
    <DocSection
      id="form-primitives"
      title="Primitif form"
      description="Field membungkus satu isian dengan label, petunjuk, dan galat (id dan aria otomatis). Untuk form react-hook-form tetap pakai FormField dari ui/form."
      importPath="@/components/form/* · useDateRange dari '@/hooks/useDateRange'"
    >
      <DocExample
        title="Field, CurrencyInput, QuantityStepper, PasswordInput"
        code={`
<Field label="Harga jual" hint="Per satuan terkecil" required>
  <CurrencyInput value={price} onValueChange={setPrice} />
</Field>
<QuantityStepper value={qty} onChange={setQty} min={1} max={20} label="Paracetamol" />
<Field label="Password" error={error}>
  <PasswordInput value={pw} onChange={…} onGenerate={() => setPw(generatePassword())} />
</Field>`}
      >
        <div className="grid w-full gap-3 sm:grid-cols-2">
          <Field label="Harga jual" hint="Per satuan terkecil" required>
            <CurrencyInput value={price} onValueChange={setPrice} />
          </Field>
          <Field label="Nama produk" error="Nama wajib diisi">
            <Input placeholder="Mis. Paracetamol 500 mg" />
          </Field>
          <Field label="Password baru" hint="Minimal 6 karakter">
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onGenerate={() => setPassword(generatePassword())}
            />
          </Field>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Jumlah</span>
            <QuantityStepper value={qty} onChange={setQty} min={1} max={20} label="Paracetamol" />
          </div>
        </div>
      </DocExample>

      <DocExample
        title="CheckboxCard, ChoiceChips"
        code={`
<CheckboxCard checked={on} onCheckedChange={setOn} title="Admin" description="…" />
<ChoiceChips multiple label="Alasan" options={…} value={reasons} onChange={setReasons} />
<ChoiceChips label="Kategori" options={…} value={cat} onChange={setCat} />`}
      >
        <div className="flex w-full flex-col gap-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <CheckboxCard
              checked={roles.admin}
              onCheckedChange={(v) => setRoles((r) => ({ ...r, admin: v }))}
              icon={<ShieldCheck className="size-4 text-cat-imun" aria-hidden />}
              title="Admin"
              description="Kelola pengguna dan semua data."
            />
            <CheckboxCard
              checked={roles.farmasi}
              onCheckedChange={(v) => setRoles((r) => ({ ...r, farmasi: v }))}
              icon={<Pill className="size-4 text-primary" aria-hidden />}
              title="Farmasi"
              description="Master data, stok masuk/keluar, opname."
            />
          </div>
          <ChoiceChips
            multiple
            label="Alasan selisih"
            value={reasons}
            onChange={setReasons}
            options={[
              { value: 'rusak', label: 'Rusak' },
              { value: 'kedaluwarsa', label: 'Kedaluwarsa' },
              { value: 'salah-catat', label: 'Salah catat' },
              { value: 'hilang', label: 'Hilang' },
            ]}
          />
          <ChoiceChips
            label="Kategori"
            value={single}
            onChange={setSingle}
            options={[
              { value: 'obat', label: 'Obat' },
              { value: 'bhp', label: 'BHP' },
              { value: 'imun', label: 'Imunisasi' },
            ]}
          />
        </div>
      </DocExample>

      <DocExample
        title="DateRangeControl, FileDrop"
        note="Pilih Atur… untuk tanggal kustom. Varian glass untuk dipakai di header."
        code={`
const range = useDateRange('7');
<DateRangeControl state={range} />
// range.range = { from, to, label }
<FileDrop file={file} onFileChange={setFile} accept="image/*,.pdf" hint="JPG, PNG, atau PDF" />`}
      >
        <div className="flex w-full flex-col gap-3">
          <DateRangeControl state={range} />
          <p className="text-xs text-muted-foreground">Periode: {range.range.label}</p>
          <div className="rounded-xl bg-grad-hero p-3">
            <DateRangeControl state={range} variant="glass" />
          </div>
          <FileDrop
            file={file}
            onFileChange={setFile}
            accept="image/*,.pdf"
            label="Unggah foto nota"
            hint="JPG, PNG, atau PDF, maks. 2 MB"
          />
        </div>
      </DocExample>
    </DocSection>
  );
};
