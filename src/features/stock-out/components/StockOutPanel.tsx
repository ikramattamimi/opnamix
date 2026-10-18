import React, { useState } from 'react';
import { CheckCheck, ClipboardList, Copy, NotebookPen, Pencil } from 'lucide-react';
import { SidePanel, PanelSection } from '@/components/panel/SidePanel';
import { DefinitionList, type Definition } from '@/components/panel/DefinitionList';
import { LineItems } from '@/components/panel/LineItems';
import { Totals, type TotalRow } from '@/components/panel/Totals';
import { Timeline } from '@/components/panel/Timeline';
import { InlineConfirm } from '@/components/panel/InlineConfirm';
import { StatusChip } from '@/components/data/StatusChip';
import { Field } from '@/components/form/Field';
import { CurrencyInput } from '@/components/form/CurrencyInput';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { formatDateForDisplay, formatDateTimeForDisplay, rp } from '@/lib/format';
import { withErrorDetail } from '@/lib/utils';
import type { Product } from '@/features/products/types';
import { ProductBrandTag, ProductTitle } from '@/features/products/components/ProductTitle';
import { calculateRequestTotals } from '../stockOutTotals';
import { typeLabel, visibleNote } from '../stockOutView';
import { useProcessStockOutRequest } from '../useStockOut';
import type { StockOutRequest } from '../types';

// Panel detail Stok Keluar: pasien, item, total, riwayat, dan aksi proses.
// Saat diproses, biaya layanan dan diskon bisa diubah sebelum dikonfirmasi.

interface StockOutPanelProps {
  request: StockOutRequest;
  products: ReadonlyMap<string, Product>;
  canEdit: boolean;
  canProcess: boolean;
  canCopy: boolean;
  onEdit: () => void;
  onCopy: () => void;
}

const hm = (value?: string | null) =>
  value ? new Date(value).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';

export const StockOutPanel: React.FC<StockOutPanelProps> = ({
  request,
  products,
  canEdit,
  canProcess,
  canCopy,
  onEdit,
  onCopy,
}) => {
  const { showToast } = useToast();
  const processMutation = useProcessStockOutRequest();
  const [processing, setProcessing] = useState(false);
  const [serviceFee, setServiceFee] = useState(request.serviceFee || 0);
  const [discount, setDiscount] = useState(request.discount || 0);

  const waiting = request.status === 'Menunggu';
  const manual = typeLabel(request) === 'Manual';
  const totals = calculateRequestTotals(request, processing ? { serviceFee, discount } : {});
  // Total tersimpan dipakai untuk transaksi selesai (bisa berbeda dari hitungan ulang)
  const grandTotal = waiting ? totals.grandTotal : request.totalAmount;

  const definitions: Definition[] = [
    ...(request.patient.birthDate
      ? [{ label: 'Tanggal lahir', value: formatDateForDisplay(request.patient.birthDate) }]
      : []),
    { label: manual ? 'Dicatat oleh' : 'Diajukan oleh', value: request.requestedBy },
    { label: 'Waktu', value: formatDateTimeForDisplay(request.createdAt || request.date) },
    ...(visibleNote(request.note)
      ? [{ label: 'Keterangan', value: visibleNote(request.note) }]
      : []),
  ];

  const rows: TotalRow[] = [
    { label: 'Obat & BHP', value: rp(totals.totalDrugs) },
    ...(request.services.length ? [{ label: 'Jasa', value: rp(totals.totalServices) }] : []),
    ...(totals.serviceFee ? [{ label: 'Biaya layanan', value: rp(totals.serviceFee) }] : []),
    ...(totals.discount ? [{ label: 'Diskon', value: `−${rp(totals.discount)}` }] : []),
  ];

  const confirmProcess = async () => {
    try {
      await processMutation.mutateAsync({
        number: request.id,
        status: 'selesai',
        diskon: discount,
        serviceFee,
        total: totals.grandTotal,
      });
      showToast(
        `Permintaan ${request.patient.fullName} diproses. Stok sudah dikurangi.`,
        'success',
      );
      setProcessing(false);
    } catch (error) {
      console.error('Error processing request:', error);
      showToast(withErrorDetail('Gagal memproses permintaan', error), 'error');
    }
  };

  const footer = processing ? (
    <InlineConfirm
      message={
        request.drugs.length
          ? `Stok ${request.drugs.length} obat/BHP akan dikurangi. Lanjutkan?`
          : 'Permintaan ini hanya berisi jasa. Tandai selesai?'
      }
      confirmLabel="Ya, proses"
      confirmIcon={CheckCheck}
      onConfirm={() => void confirmProcess()}
      onCancel={() => setProcessing(false)}
      busy={processMutation.isPending}
    />
  ) : waiting ? (
    (canEdit || canProcess) && (
      <>
        {canEdit && (
          <Button variant="outline" onClick={onEdit}>
            <Pencil aria-hidden />
            Edit
          </Button>
        )}
        {canProcess && (
          <Button className="sm:ml-auto" onClick={() => setProcessing(true)}>
            <CheckCheck aria-hidden />
            Proses & kurangi stok
          </Button>
        )}
      </>
    )
  ) : (
    canCopy && (
      <>
        <Button variant="outline" className="sm:ml-auto" onClick={onCopy}>
          <Copy aria-hidden />
          Salin ke permintaan baru
        </Button>
      </>
    )
  );

  return (
    <SidePanel
      icon={manual ? NotebookPen : ClipboardList}
      tone={waiting ? 'warn' : 'ok'}
      eyebrow={`${typeLabel(request)} · ${request.requestId}`}
      title={request.patient.fullName || 'Tanpa nama'}
      badge={
        <StatusChip tone={waiting ? 'warn' : 'ok'}>{waiting ? 'Menunggu' : 'Selesai'}</StatusChip>
      }
      footer={footer || undefined}
    >
      <DefinitionList items={definitions} />

      {request.drugs.length > 0 && (
        <PanelSection title={`Obat & BHP · ${request.drugs.length}`}>
          <LineItems
            items={request.drugs.map((drug) => {
              const product = products.get(drug.productId);
              const price = drug.price || 0;
              return {
                id: drug.id,
                title: product ? <ProductTitle product={product} /> : drug.productName,
                subtitle: (
                  <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                    {product && <ProductBrandTag product={product} size="sm" />}
                    <span>
                      {drug.quantity} {drug.unit.toLowerCase()} × {rp(price)}
                    </span>
                  </span>
                ),
                amount: rp(price * drug.quantity),
              };
            })}
          />
        </PanelSection>
      )}

      {request.services.length > 0 && (
        <PanelSection title={`Jasa · ${request.services.length}`}>
          <LineItems
            items={request.services.map((service) => ({
              id: service.id,
              title: service.name,
              amount: rp(service.price),
            }))}
          />
        </PanelSection>
      )}

      {processing && (
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Biaya layanan">
            <CurrencyInput value={serviceFee} onValueChange={(v) => setServiceFee(v ?? 0)} />
          </Field>
          <Field label="Diskon">
            <CurrencyInput value={discount} onValueChange={(v) => setDiscount(v ?? 0)} />
          </Field>
        </div>
      )}

      <Totals rows={rows} grand={{ label: 'Total', value: rp(grandTotal) }} />

      <PanelSection title="Riwayat">
        <Timeline
          items={[
            {
              id: 'created',
              title: manual ? 'Dicatat dan stok dikurangi' : 'Diajukan',
              subtitle: `${request.requestedBy} · ${hm(request.createdAt || request.date)}`,
            },
            ...(manual
              ? []
              : [
                  waiting
                    ? {
                        id: 'wait',
                        title: 'Menunggu diproses farmasi',
                        subtitle: 'Stok belum berkurang',
                        tone: 'warn' as const,
                      }
                    : {
                        id: 'done',
                        title: 'Diproses, stok dikurangi',
                        subtitle:
                          [request.processedBy, formatDateTimeForDisplay(request.processedAt ?? '')]
                            .filter((v) => v && v !== '-')
                            .join(' · ') || undefined,
                      },
                ]),
          ]}
        />
      </PanelSection>
    </SidePanel>
  );
};
