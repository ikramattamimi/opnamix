import React from 'react';
import { BrandTag } from '@/components/data/BrandTag';
import { CategoryIcon } from '@/components/data/CategoryIcon';
import { StatusChip } from '@/components/data/StatusChip';
import { cn } from '@/lib/utils';
import { CATEGORY_META, productMetaText } from '../catalog';
import { ingredientLabel, ingredientSummary, isCombination } from '../productDisplay';
import { Category, type Product } from '../types';

// Komponen domain produk. Dipakai di card Data Produk, dan nanti di tile POS,
// keranjang, daftar hitung opname, dan laporan.

type TitleSource = Pick<Product, 'name' | 'brand' | 'category' | 'ingredients'>;

const metaOf = (category: Category) => CATEGORY_META[category] ?? CATEGORY_META[Category.Obat];

interface ProductTitleProps {
  product: TitleSource;
  /**
   * Tampilkan merek di atas kandungan untuk obat kombinasi. Matikan bila merek
   * sudah tampil lewat ProductBrandTag (mis. di ItemCard).
   */
  showBrand?: boolean;
  /** Jumlah nama zat yang ditulis sebelum chip "+N" */
  maxIngredients?: number;
  className?: string;
}

// - Obat 1 zat: kandungan + kekuatan ("Paracetamol 500 mg")
// - Obat 2+ zat: merek, lalu kandungan kecil (maks. 2 nama) + chip "+N"
// - Kategori lain: nama produk
export const ProductTitle: React.FC<ProductTitleProps> = ({
  product,
  showBrand = true,
  maxIngredients = 2,
  className,
}) => {
  const ingredients = product.ingredients ?? [];
  const summary = ingredientSummary(ingredients) || undefined;

  if (product.category !== Category.Obat || !isCombination(product)) {
    const single = product.category === Category.Obat && ingredients[0];
    return (
      <span className={className} title={summary}>
        {single ? ingredientLabel(single) : product.name}
      </span>
    );
  }

  const rest = ingredients.length - maxIngredients;
  const names = (
    <span className="text-note font-normal text-muted-foreground" title={summary}>
      {ingredients
        .slice(0, maxIngredients)
        .map((i) => i.name)
        .join(', ')}
      {rest > 0 && (
        <>
          {' '}
          <StatusChip tone="neutral" className="h-4.5 align-middle text-foreground">
            +{rest}
          </StatusChip>
        </>
      )}
    </span>
  );

  if (!showBrand) return <span className={className}>{names}</span>;
  return (
    <span className={cn('flex min-w-0 flex-col', className)}>
      <span className="truncate">{product.brand?.trim() || product.name}</span>
      {names}
    </span>
  );
};

// Baris bawah: ikon kategori + "Obat · Sirup 60 ml" (tanpa kode barang)
export const ProductMeta: React.FC<{
  product: Pick<Product, 'category' | 'dosageForm' | 'packageSize' | 'unit'>;
  className?: string;
}> = ({ product, className }) => {
  const meta = metaOf(product.category);
  return (
    <span className={cn('flex min-w-0 items-center gap-1.5', className)}>
      <CategoryIcon icon={meta.icon} tone={meta.tone} label={meta.label} />
      <span className="truncate">{productMetaText(product)}</span>
    </span>
  );
};

// Label merek berwarna kategori; tanpa merek tampil "Generik"
export const ProductBrandTag: React.FC<{
  product: Pick<Product, 'brand' | 'category'>;
  size?: 'sm' | 'md';
  className?: string;
}> = ({ product, size, className }) => {
  const brand = product.brand?.trim();
  return (
    <BrandTag
      tone={metaOf(product.category).tone}
      generic={!brand}
      size={size}
      className={cn('min-w-0', className)}
    >
      {brand || 'Generik'}
    </BrandTag>
  );
};
