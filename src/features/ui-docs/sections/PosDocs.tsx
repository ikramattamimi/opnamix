import React, { useState } from 'react';
import { CheckCheck, Receipt, ShoppingBasket } from 'lucide-react';
import { CartBar, PosCartFooter } from '@/components/layout/PosLayout';
import { PosCatalog } from '@/components/layout/PosCatalog';
import { CartLine, CartLines } from '@/components/panel/CartLine';
import { InlineConfirm } from '@/components/panel/InlineConfirm';
import { ImageThumb } from '@/components/data/ImageThumb';
import { KeyboardHints, Kbd } from '@/components/data/Kbd';
import { StatusChip } from '@/components/data/StatusChip';
import { Field } from '@/components/form/Field';
import { CurrencyInput } from '@/components/form/CurrencyInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { rp } from '@/lib/format';
import { productMatches } from '@/features/products/catalog';
import { ProductTile } from '@/features/products/components/ProductTile';
import { ProductTitle } from '@/features/products/components/ProductTitle';
import { addToCart, setCartQuantity, type CartLineBase } from '@/features/transactions/posCart';
import { DocExample, DocSection } from '../components/DocSection';
import { SAMPLES } from './sampleProducts';

export const PosDocs: React.FC = () => {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [lines, setLines] = useState<CartLineBase[]>([{ productId: SAMPLES[0].id, quantity: 2 }]);
  const [price, setPrice] = useState<number | null>(16500);
  const [confirming, setConfirming] = useState(false);

  const items = SAMPLES.filter((p) => productMatches(p, query));
  const qty = (id: string) => lines.find((l) => l.productId === id)?.quantity ?? 0;
  const add = (id: string) =>
    setLines((prev) => addToCart(prev, id, () => ({ productId: id, quantity: 1 })));
  const total = lines.reduce(
    (sum, l) => sum + (SAMPLES.find((p) => p.id === l.productId)?.sellingPrice ?? 0) * l.quantity,
    0,
  );

  return (
    <DocSection
      id="pos"
      title="PosLayout dan komponen POS"
      description="Layar kerja ala kasir untuk POS Stok Keluar, POS Stok Masuk, dan layar kerja opname. PosLayout: katalog di kiri, keranjang (biasanya SidePanel) di kanan yang menempel di bawah header; di bawah 1024px keranjang menjadi sheet dari bawah yang dibuka lewat CartBar, dan tombol tutup SidePanel muncul otomatis. PosCatalog: kotak cari/scan (pintasan “/”, Enter menjalankan onEnter), baris filter, grid tile kolom × baris, dan pagination. ProductTile (domain) menyusun ItemCard untuk produk. Operasi keranjang ada di features/transactions/posCart.ts."
      importPath="import { PosLayout, PosCartFooter, CartBar } from '@/components/layout/PosLayout'; import { PosCatalog } from '@/components/layout/PosCatalog';"
    >
      <DocExample
        title="PosLayout"
        note="Tidak ditampilkan hidup di sini karena CartBar menempel di bawah layar pada layar sempit. Lihat /transaksi/stok-keluar/baru dan /transaksi/stok-masuk/baru."
        code={`
<PageHeader title="Permintaan baru" back={ROUTES.STOK_KELUAR} />
<PosLayout
  catalog={<PosCatalog … />}
  cart={
    <SidePanel title="Permintaan pasien" badge={<SegmentedControl … />} footer={<PosCartFooter … />}>
      {fields}
      <CartLines>{lines.map((l) => <CartLine … />)}</CartLines>
    </SidePanel>
  }
  cartLabel="Keranjang"
  bar={{ summary: '3 item', value: rp(total), actionLabel: 'Lihat keranjang', icon: ShoppingBasket }}
/>`}
      >
        <p className="text-sm text-muted-foreground">
          Lebar ≥ 1024px: dua kolom, keranjang 24rem menempel. Di bawahnya: satu kolom + CartBar.
        </p>
      </DocExample>

      <DocExample
        title="PosCatalog + ProductTile"
        note="Klik tile atau ketik lalu tekan Enter untuk menambah hasil teratas. Tile terpilih bergaris primer dengan jumlah di kanan atas; stok habis dimatikan."
        code={`
<PosCatalog
  query={query} onQueryChange={setQuery} onEnter={addTopResult} searchLabel="Cari produk"
  tools={<SegmentedControl … />}
  filters={<SegmentedControl label="Kategori" … />}
  items={productList} getKey={(p) => p.id} page={page} onPageChange={setPage}
  renderItem={(p) => (
    <ProductTile
      product={p} price={p.sellingPrice}
      stockText={\`sisa \${p.stock} \${p.unit.toLowerCase()}\`}
      stockTone={status === 'menipis' ? 'warn' : undefined}
      badge={qty > 0 && <StatusChip tone="info" plain>× {qty}</StatusChip>}
      selected={qty > 0} disabled={p.stock <= 0} onClick={() => add(p)}
    />
  )}
/>`}
      >
        <div className="w-full">
          <PosCatalog
            query={query}
            onQueryChange={(v) => {
              setQuery(v);
              setPage(1);
            }}
            onEnter={() => {
              const first = items.find((p) => p.stock > 0);
              if (first) add(first.id);
              setQuery('');
            }}
            searchLabel="Cari produk contoh"
            items={items}
            getKey={(p) => p.id}
            page={page}
            onPageChange={setPage}
            renderItem={(p) => (
              <ProductTile
                product={p}
                price={p.sellingPrice}
                stockText={p.stock <= 0 ? 'stok habis' : `sisa ${p.stock} ${p.unit.toLowerCase()}`}
                stockTone={p.stock <= 0 ? 'bad' : p.stock <= p.minStock ? 'warn' : undefined}
                badge={
                  qty(p.id) > 0 ? (
                    <StatusChip tone="info" plain>
                      × {qty(p.id)}
                    </StatusChip>
                  ) : (
                    p.stock <= 0 && <StatusChip tone="bad">Habis</StatusChip>
                  )
                }
                selected={qty(p.id) > 0}
                disabled={p.stock <= 0}
                onClick={() => add(p.id)}
              />
            )}
          />
        </div>
      </DocExample>

      <DocExample
        title="CartLine, CartLines, dan PosCartFooter"
        note="Satu komponen baris untuk keranjang keluar dan penerimaan masuk. Stepper ke 0 menghapus baris; children untuk isian tambahan (batch, kedaluwarsa, harga beli)."
        code={`
<CartLines>
  <CartLine
    label={p.name} title={<ProductTitle product={p} />} subtitle="Sanmol · Rp 18.000 / botol"
    amount={rp(p.sellingPrice * qty)}
    quantity={{ value: qty, max: p.stock, onChange: (q) => setLines(setCartQuantity(lines, p.id, q)) }}
    onRemove={() => …}
  >
    <Field label="Harga beli"><CurrencyInput value={price} onValueChange={setPrice} /></Field>
  </CartLine>
  <CartLine label="Konsultasi" title="Konsultasi umum" amount="Rp 45.000" onRemove={…} />
</CartLines>
<PosCartFooter
  totals={{ rows: [{ label: 'Obat & BHP', value: rp(total) }], grand: { label: 'Total', value: rp(total) } }}
  submitLabel="Ajukan permintaan" submitIcon={Send} onSubmit={submit} onClear={clear} disabled={!lines.length}
/>`}
      >
        <div className="flex w-full max-w-sm flex-col gap-3 rounded-card border bg-card p-3.5">
          <CartLines>
            {lines.map((line) => {
              const p = SAMPLES.find((s) => s.id === line.productId)!;
              return (
                <CartLine
                  key={p.id}
                  label={p.name}
                  title={<ProductTitle product={p} />}
                  subtitle={`${p.brand ? `${p.brand} · ` : ''}${rp(p.sellingPrice)} / ${p.unit.toLowerCase()}`}
                  amount={rp(p.sellingPrice * line.quantity)}
                  quantity={{
                    value: line.quantity,
                    max: p.stock,
                    onChange: (q) => setLines((prev) => setCartQuantity(prev, p.id, q)),
                  }}
                  onRemove={() => setLines((prev) => setCartQuantity(prev, p.id, 0))}
                >
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Batch">
                      <Input placeholder="No. batch" className="font-mono" />
                    </Field>
                    <Field label="Harga beli">
                      <CurrencyInput value={price} onValueChange={setPrice} />
                    </Field>
                  </div>
                </CartLine>
              );
            })}
            <CartLine
              label="Konsultasi umum"
              title="Konsultasi umum"
              subtitle="Konsultasi"
              amount={rp(45000)}
              onRemove={() => undefined}
            />
          </CartLines>
          <PosCartFooter
            totals={{
              rows: [{ label: 'Obat & BHP', value: rp(total) }],
              grand: { label: 'Total', value: rp(total + 45000) },
            }}
            submitLabel="Ajukan permintaan"
            onSubmit={() => undefined}
            onClear={() => setLines([])}
            disabled={lines.length === 0}
          />
        </div>
      </DocExample>

      <DocExample
        title="CartBar"
        note="Di PosLayout CartBar menempel di bawah layar (di samping rail sidebar) dan membuka sheet keranjang."
        code={`<CartBar summary="3 item" value={rp(57300)} actionLabel="Lihat keranjang" icon={ShoppingBasket} onOpen={open} />`}
      >
        <CartBar
          summary="3 item"
          value={rp(57300)}
          actionLabel="Lihat keranjang"
          icon={ShoppingBasket}
          onOpen={() => undefined}
          className="w-full max-w-sm rounded-xl border"
        />
      </DocExample>

      <DocExample
        title="InlineConfirm"
        note="Konfirmasi di kaki SidePanel, menggantikan tombol aksi tanpa membuka dialog."
        code={`
footer={processing
  ? <InlineConfirm message="Stok 2 obat akan dikurangi. Lanjutkan?" confirmLabel="Ya, proses"
      confirmIcon={CheckCheck} onConfirm={process} onCancel={() => setProcessing(false)} busy={isPending} />
  : <Button onClick={() => setProcessing(true)}>Proses & kurangi stok</Button>}`}
      >
        <div className="w-full max-w-sm rounded-card border bg-card px-3.5 py-2.5">
          {confirming ? (
            <InlineConfirm
              message="Stok 2 obat/BHP akan dikurangi. Lanjutkan?"
              confirmLabel="Ya, proses"
              confirmIcon={CheckCheck}
              onConfirm={() => setConfirming(false)}
              onCancel={() => setConfirming(false)}
            />
          ) : (
            <Button onClick={() => setConfirming(true)}>
              <CheckCheck aria-hidden />
              Proses & kurangi stok
            </Button>
          )}
        </div>
      </DocExample>

      <DocExample
        title="ImageThumb, Kbd, dan KeyboardHints"
        note="ImageThumb membuka gambar ukuran penuh di tab baru; tanpa gambar (atau gagal dimuat) tampil kotak keterangan. KeyboardHints disembunyikan di layar sentuh kecil."
        code={`
<ImageThumb src={receipt.evidenceUrl} alt="Foto nota" emptyLabel="Foto nota tidak diunggah" emptyIcon={Receipt} />
<Kbd>/</Kbd>
<KeyboardHints hints={[{ keys: '/', label: 'cari' }, { keys: 'Enter', label: 'tambah hasil teratas' }]} />`}
      >
        <ImageThumb
          alt="Foto nota"
          emptyLabel="Foto nota tidak diunggah"
          emptyIcon={Receipt}
          className="w-full max-w-xs"
        />
        <Kbd>/</Kbd>
        <KeyboardHints
          hints={[
            { keys: '/', label: 'cari' },
            { keys: 'Enter', label: 'tambah hasil teratas' },
          ]}
        />
      </DocExample>
    </DocSection>
  );
};
