import React, { useMemo, useState } from 'react';
import { Check, Loader2, Plus, Trash2 } from 'lucide-react';
import { SidePanel, PanelSection } from '@/components/panel/SidePanel';
import { MiniStats } from '@/components/panel/MiniStats';
import { SegmentedControl } from '@/components/data/SegmentedControl';
import { Field } from '@/components/form/Field';
import { CurrencyInput } from '@/components/form/CurrencyInput';
import { OptionSelect } from '@/components/form/OptionSelect';
import { TagInput, type TagItem } from '@/components/form/TagInput';
import { formatThousands, parseDigits } from '@/components/form/number';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { rpShort } from '@/lib/format';
import { CATEGORIES, CATEGORY_META, DOSAGE_FORMS, nextProductCode } from '../catalog';
import { ingredientLabel } from '../productDisplay';
import {
  emptyProductFormValues,
  formValuesToProduct,
  productToFormValues,
  validateProductForm,
  type ProductFormErrors,
  type ProductFormValues,
} from '../productSchema';
import { Category, Unit, type Ingredient, type Product } from '../types';

// Panel kanan Data Produk: tambah produk baru atau edit produk terpilih.

interface ProductFormPanelProps {
  /** Kosong berarti produk baru */
  product?: Product;
  /** Semua kode produk, untuk kode otomatis produk baru */
  existingCodes: readonly string[];
  /** Nama zat yang sudah ada, untuk saran dan deteksi salah ketik */
  ingredientNames: readonly string[];
  saving: boolean;
  onSave: (product: Partial<Product>) => Promise<boolean>;
  onDelete: (product: Product) => void;
  onCancel: () => void;
}

const UNIT_OPTIONS = Object.values(Unit).map((u) => ({ value: u, label: u }));
const DOSAGE_OPTIONS = DOSAGE_FORMS.map((d) => ({ value: d as string, label: d }));
const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ value: c, label: CATEGORY_META[c].short }));

const toTags = (ingredients: Ingredient[]): TagItem[] =>
  ingredients.map((i) => ({ value: i.name, secondary: i.strength }));
const fromTags = (tags: TagItem[]): Ingredient[] =>
  tags.map((t) => ({ name: t.value, strength: t.secondary }));

const numberText = (value: number | null) => (value === null ? '' : formatThousands(value));

const ingredientHint = (ingredients: Ingredient[]) => {
  if (ingredients.length === 0) return 'Belum ada kandungan.';
  if (ingredients.length === 1)
    return `Satu zat: card menampilkan judul "${ingredientLabel(ingredients[0])}".`;
  return `${ingredients.length} zat: card menampilkan merek, lalu kandungan dalam teks kecil.`;
};

export const ProductFormPanel: React.FC<ProductFormPanelProps> = ({
  product,
  existingCodes,
  ingredientNames,
  saving,
  onSave,
  onDelete,
  onCancel,
}) => {
  const isNew = !product;
  const [values, setValues] = useState<ProductFormValues>(() =>
    product ? productToFormValues(product) : emptyProductFormValues,
  );
  const [submitted, setSubmitted] = useState(false);

  const errors: ProductFormErrors = useMemo(
    () => (submitted ? validateProductForm(values, { isNew }) : {}),
    [submitted, values, isNew],
  );

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const meta = CATEGORY_META[values.category];
  const isMedicine = values.category === Category.Obat;
  const code = product?.code ?? nextProductCode(meta.prefix, existingCodes);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(validateProductForm(values, { isNew })).length > 0) return;
    const saved = await onSave({ ...formValuesToProduct(values, product), code });
    if (saved && isNew) {
      setValues({ ...emptyProductFormValues, category: values.category });
      setSubmitted(false);
    }
  };

  const formId = 'product-form';

  return (
    <SidePanel
      icon={isNew ? Plus : meta.icon}
      tone={meta.tone}
      eyebrow={isNew ? `Produk baru · ${code}` : `Edit produk · ${code}`}
      title={isNew ? 'Tambah produk' : product.name}
      footer={
        <>
          {!isNew && (
            <Button
              type="button"
              variant="ghost-danger"
              onClick={() => onDelete(product)}
              disabled={saving}
            >
              <Trash2 aria-hidden />
              Hapus
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            className="sm:ml-auto"
            onClick={onCancel}
            disabled={saving}
          >
            Batal
          </Button>
          <Button type="submit" form={formId} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
            Simpan
          </Button>
        </>
      }
    >
      {!isNew && (
        <MiniStats
          items={[
            { label: 'Stok', value: `${product.stock} ${product.unit.toLowerCase()}` },
            { label: 'Minimum', value: product.minStock },
            { label: 'Nilai stok', value: rpShort(product.stock * product.sellingPrice) },
          ]}
        />
      )}

      <form
        id={formId}
        noValidate
        onSubmit={(event) => void handleSubmit(event)}
        className="flex flex-col gap-3"
      >
        <PanelSection title="Kategori">
          <SegmentedControl
            label="Kategori produk"
            full
            options={CATEGORY_OPTIONS}
            value={values.category}
            onChange={(category) => {
              set('category', category);
              if (category === Category.Obat && !values.dosageForm) set('dosageForm', 'Tablet');
            }}
          />
        </PanelSection>

        {isMedicine ? (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Merek">
                <Input
                  value={values.brand}
                  onChange={(e) => set('brand', e.target.value)}
                  placeholder="Kosongkan bila generik"
                />
              </Field>
              <Field label="Sediaan">
                <OptionSelect
                  value={values.dosageForm}
                  onValueChange={(v) => set('dosageForm', v)}
                  options={DOSAGE_OPTIONS}
                />
              </Field>
            </div>
            <Field
              label="Kandungan · kekuatan opsional"
              required
              error={errors.ingredients}
              hint={ingredientHint(values.ingredients)}
            >
              <TagInput
                value={toTags(values.ingredients)}
                onChange={(tags) => set('ingredients', fromTags(tags))}
                suggestions={ingredientNames}
                placeholder="Ketik zat lalu Enter, atau tempel daftar dipisah koma"
                secondaryPlaceholder="Kekuatan"
              />
            </Field>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Nama produk" required error={errors.name}>
              <Input
                value={values.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Mis. Spuit 3 ml"
              />
            </Field>
            <Field label="Merek">
              <Input
                value={values.brand}
                onChange={(e) => set('brand', e.target.value)}
                placeholder="Kosongkan bila generik"
              />
            </Field>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          {isMedicine && (
            <Field label="Isi kemasan">
              <Input
                value={values.packageSize}
                onChange={(e) => set('packageSize', e.target.value)}
                placeholder="Opsional, mis. 60 ml"
              />
            </Field>
          )}
          <Field label="Satuan stok">
            <OptionSelect
              value={values.unit}
              onValueChange={(v) => set('unit', v)}
              options={UNIT_OPTIONS}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Harga beli">
            <CurrencyInput
              value={values.purchasePrice}
              onValueChange={(v) => set('purchasePrice', v)}
            />
          </Field>
          <Field label="Harga jual" required error={errors.sellingPrice}>
            <CurrencyInput
              value={values.sellingPrice}
              onValueChange={(v) => set('sellingPrice', v)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Field
            label={isNew ? 'Stok awal' : 'Stok saat ini'}
            required={isNew}
            error={errors.stock}
            hint={isNew ? undefined : 'Berubah lewat Stok Masuk, Stok Keluar, atau Opname.'}
          >
            <Input
              inputMode="numeric"
              className="tabular-nums"
              value={numberText(values.stock)}
              onChange={(e) => set('stock', parseDigits(e.target.value))}
              readOnly={!isNew}
            />
          </Field>
          <Field label="Stok minimum" required error={errors.minStock}>
            <Input
              inputMode="numeric"
              className="tabular-nums"
              value={numberText(values.minStock)}
              onChange={(e) => set('minStock', parseDigits(e.target.value))}
            />
          </Field>
        </div>
      </form>
    </SidePanel>
  );
};
