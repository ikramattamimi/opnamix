import React from 'react';
import { Plus } from 'lucide-react';
import { CategoryIcon } from '@/components/data/CategoryIcon';
import { ItemCard } from '@/components/data/ItemCard';
import { ToneIcon } from '@/components/data/ToneIcon';
import { rp } from '@/lib/format';
import { cn } from '@/lib/utils';
import { CATEGORY_META } from '../catalog';
import { Category, type Product } from '../types';
import { ProductBrandTag, ProductTitle } from './ProductTitle';

// Tile katalog POS: merek, nama/kandungan, ikon kategori + keterangan stok,
// harga, dan tanda tambah. Dipakai POS Stok Keluar, POS Stok Masuk, dan nanti
// layar kerja opname.

interface ProductTileProps {
  product: Product;
  /** Harga yang relevan: jual (keluar) atau beli (masuk) */
  price: number;
  /** Keterangan di baris bawah, mis. "sisa 12 tablet" atau "stok 4 · min 10" */
  stockText: React.ReactNode;
  stockTone?: 'warn' | 'bad';
  /** Chip di kanan atas: jumlah di keranjang atau status stok */
  badge?: React.ReactNode;
  selected?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

const TONE_TEXT = { warn: 'text-warn', bad: 'text-bad' } as const;

export const ProductTile: React.FC<ProductTileProps> = ({
  product,
  price,
  stockText,
  stockTone,
  badge,
  selected,
  disabled,
  onClick,
}) => {
  const meta = CATEGORY_META[product.category] ?? CATEGORY_META[Category.Obat];
  return (
    <ItemCard
      topStart={<ProductBrandTag product={product} size="sm" />}
      topEnd={badge}
      title={<ProductTitle product={product} showBrand={false} />}
      subtitle={
        <span className="flex min-w-0 items-center gap-1.5">
          <CategoryIcon icon={meta.icon} tone={meta.tone} label={meta.label} />
          <span className={cn('truncate', stockTone && TONE_TEXT[stockTone])}>{stockText}</span>
        </span>
      }
      footer={
        <>
          <b>{rp(price)}</b>
          <ToneIcon icon={Plus} size="sm" />
        </>
      }
      selected={selected}
      disabled={disabled}
      onClick={onClick}
    />
  );
};
