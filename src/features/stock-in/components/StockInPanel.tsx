import React from 'react';
import { PackageCheck, Receipt } from 'lucide-react';
import { SidePanel, PanelSection } from '@/components/panel/SidePanel';
import { DefinitionList } from '@/components/panel/DefinitionList';
import { LineItems } from '@/components/panel/LineItems';
import { Totals } from '@/components/panel/Totals';
import { StatusChip } from '@/components/data/StatusChip';
import { ImageThumb } from '@/components/data/ImageThumb';
import { formatDateForDisplay, rp } from '@/lib/format';
import type { Product } from '@/features/products/types';
import { ProductBrandTag, ProductTitle } from '@/features/products/components/ProductTitle';
import { formatExpiry, isExpiringSoon } from '../expiry';
import { expiringItems, receiptTime, totalUnits } from '../stockInView';
import type { StockInReceipt } from '../types';

// Panel detail penerimaan: nota, foto nota, item dengan batch dan kedaluwarsa.

interface StockInPanelProps {
  receipt: StockInReceipt;
  products: ReadonlyMap<string, Product>;
}

export const StockInPanel: React.FC<StockInPanelProps> = ({ receipt, products }) => {
  const soon = expiringItems(receipt).length;
  return (
    <SidePanel
      icon={PackageCheck}
      tone={soon ? 'warn' : 'ok'}
      eyebrow={`Penerimaan · ${formatDateForDisplay(receipt.date)}`}
      title={receipt.supplierName}
      badge={soon > 0 && <StatusChip tone="warn">{soon} exp dekat</StatusChip>}
    >
      <DefinitionList
        items={[
          { label: 'No. nota', value: <span className="font-mono">{receipt.invoiceNumber}</span> },
          { label: 'Diterima oleh', value: receipt.receivedBy },
          {
            label: 'Jam',
            value: receiptTime(receipt).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          },
        ]}
      />

      <ImageThumb
        src={receipt.evidenceUrl}
        alt={`Foto nota ${receipt.invoiceNumber}`}
        emptyLabel="Foto nota tidak diunggah"
        emptyIcon={Receipt}
      />

      <PanelSection title={`Produk · ${receipt.items.length}`}>
        <LineItems
          items={receipt.items.map((item) => {
            const product = products.get(item.productId);
            const warn = isExpiringSoon(item.expiryDate);
            return {
              id: item.id,
              title: product ? <ProductTitle product={product} /> : item.productName,
              subtitle: (
                <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                  {product && <ProductBrandTag product={product} size="sm" />}
                  <span>
                    {item.quantity} {item.unit.toLowerCase()}
                    {item.batch && (
                      <>
                        {' · batch '}
                        <span className="font-mono">{item.batch}</span>
                      </>
                    )}
                  </span>
                  {warn ? (
                    <StatusChip tone="warn">exp {formatExpiry(item.expiryDate)}</StatusChip>
                  ) : (
                    <span>exp {formatExpiry(item.expiryDate)}</span>
                  )}
                </span>
              ),
              amount: rp(item.price * item.quantity),
            };
          })}
        />
      </PanelSection>

      <Totals
        rows={[{ label: 'Jumlah unit', value: totalUnits(receipt).toLocaleString('id-ID') }]}
        grand={{ label: 'Nilai pembelian', value: rp(receipt.total) }}
      />
    </SidePanel>
  );
};
