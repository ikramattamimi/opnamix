import React, { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CircleCheck,
  CloudAlert,
  CloudCheck,
  ListChecks,
  ListTodo,
  Loader2,
  Receipt,
  X,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PosLayout } from '@/components/layout/PosLayout';
import { SidePanel } from '@/components/panel/SidePanel';
import { DefinitionList } from '@/components/panel/DefinitionList';
import { InfoBox } from '@/components/panel/InfoBox';
import { InlineConfirm } from '@/components/panel/InlineConfirm';
import { Totals } from '@/components/panel/Totals';
import { KpiStrip } from '@/components/data/KpiStrip';
import { Meter } from '@/components/data/Meter';
import { SignedValue } from '@/components/data/SignedValue';
import { StepBar } from '@/components/data/StepBar';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/QueryState';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { rpSigned } from '@/lib/format';
import { getErrorMessage } from '@/lib/utils';
import { ROUTES, opnamePath } from '@/types/routes';
import { runStats } from './catalog';
import {
  useAutosaveRun,
  useCancelOpname,
  useFinishOpname,
  useOpnameRun,
  useSetOpnameStep,
} from './useOpname';
import { LockInfo } from './components/OpnamePanels';
import { CountView, ReviewView, type CountFilter, type ReviewFilter } from './components/RunViews';

const clock = (d: Date) => d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

const OpnameRunPage: React.FC = () => {
  const { opnameId } = useParams<{ opnameId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data: run, isPending, isError, refetch } = useOpnameRun(opnameId);
  const autosave = useAutosaveRun(opnameId);
  const setStep = useSetOpnameStep();
  const finish = useFinishOpname();
  const cancel = useCancelOpname();

  const [view, setView] = useState<'hitung' | 'tinjau' | null>(null);
  const [countFilter, setCountFilter] = useState<CountFilter>('Semua');
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('Selisih');
  const [confirm, setConfirm] = useState<'finish' | 'cancel' | null>(null);

  if (isPending) {
    return (
      <>
        <PageHeader back={ROUTES.STOK_OPNAME} />
        <LoadingState label="Memuat opname..." />
      </>
    );
  }
  if (isError || !run) {
    return (
      <>
        <PageHeader title="Opname tidak ditemukan" back={ROUTES.STOK_OPNAME} />
        {isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : (
          <EmptyState title="Opname ini sudah dibatalkan atau tidak ada." />
        )}
      </>
    );
  }
  if (run.status === 'selesai') return <Navigate to={opnamePath(run.id, 'laporan')} replace />;

  const s = runStats(run.items);
  const remaining = s.n - s.counted;
  const current = view ?? (run.step >= 3 && remaining === 0 ? 'tinjau' : 'hitung');

  const goTo = (next: 'hitung' | 'tinjau') => {
    setView(next);
    setConfirm(null);
    setStep.mutate({ id: run.id, step: next === 'tinjau' ? 3 : 2 });
  };

  const doFinish = async () => {
    try {
      await autosave.flush();
      await finish.mutateAsync(run);
      showToast(`${run.name} selesai. Stok ${s.n} produk sudah disesuaikan.`, 'success');
      navigate(opnamePath(run.id, 'laporan'), { replace: true });
    } catch (err) {
      showToast('Gagal menyelesaikan opname: ' + getErrorMessage(err), 'error');
    }
  };

  const doCancel = async () => {
    try {
      await cancel.mutateAsync(run.id);
      showToast('Opname dibatalkan. Kunci produk dibuka.', 'success');
      navigate(ROUTES.STOK_OPNAME, { replace: true });
    } catch (err) {
      showToast('Gagal membatalkan opname: ' + getErrorMessage(err), 'error');
    }
  };

  const saveState = autosave.error ? (
    <>
      <CloudAlert className="size-3.5 text-bad" aria-hidden />
      <span className="text-bad">Gagal menyimpan, dicoba lagi saat ada perubahan</span>
    </>
  ) : autosave.saving ? (
    <>
      <Loader2 className="size-3.5 animate-spin" aria-hidden />
      Menyimpan…
    </>
  ) : (
    <>
      <CloudCheck className="size-3.5" aria-hidden />
      {autosave.savedAt ? `Tersimpan otomatis ${clock(autosave.savedAt)}` : 'Tersimpan otomatis'}
    </>
  );

  const side =
    current === 'hitung' ? (
      <SidePanel
        icon={ListChecks}
        eyebrow={run.code}
        title="Progres hitung"
        footer={
          confirm === 'cancel' ? (
            <InlineConfirm
              tone="danger"
              message="Batalkan opname? Hitungan dibuang dan kunci produk dibuka."
              confirmLabel="Ya, batalkan"
              confirmIcon={X}
              busy={cancel.isPending}
              onConfirm={() => void doCancel()}
              onCancel={() => setConfirm(null)}
            />
          ) : (
            <div className="flex w-full flex-col gap-2">
              <Button size="lg" disabled={remaining > 0} onClick={() => goTo('tinjau')}>
                Lanjut ke tinjau selisih
                <ArrowRight aria-hidden />
              </Button>
              {remaining > 0 && (
                <p className="text-note text-muted-foreground">
                  {remaining} produk belum dihitung. Opname tidak bisa dilanjutkan selama ada yang
                  kosong.
                </p>
              )}
              <Button variant="ghost" onClick={() => setConfirm('cancel')}>
                Batalkan opname
              </Button>
            </div>
          )
        }
      >
        <KpiStrip items={[{ label: 'Dihitung', value: `${s.counted} / ${s.n}`, note: 'produk' }]} />
        <Meter value={s.n ? s.counted / s.n : 0} tone="primary" label="Progres hitung" />
        {remaining > 0 ? (
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => setCountFilter('Belum')}
          >
            <ListTodo aria-hidden />
            Tampilkan {remaining} yang belum dihitung
          </Button>
        ) : (
          <InfoBox icon={CircleCheck}>
            Semua produk sudah dihitung. Lanjut ke tinjau selisih.
          </InfoBox>
        )}
        <DefinitionList
          items={[
            { label: 'Petugas', value: run.auditor },
            { label: 'Dimulai', value: clock(new Date(run.startedAt)) },
            { label: 'Jadwal', value: run.scheduleName ?? 'Opname cepat' },
          ]}
        />
        <LockInfo count={s.n} />
      </SidePanel>
    ) : (
      <SidePanel
        icon={Receipt}
        eyebrow={run.code}
        title="Ringkasan selisih"
        footer={
          confirm === 'finish' ? (
            <InlineConfirm
              message={`Stok ${s.n} produk disesuaikan ke hasil hitung dan kuncinya dibuka. Langkah ini tidak bisa dibatalkan.`}
              confirmLabel="Ya, selesaikan"
              confirmIcon={BadgeCheck}
              busy={finish.isPending}
              onConfirm={() => void doFinish()}
              onCancel={() => setConfirm(null)}
            />
          ) : (
            <div className="flex w-full flex-col gap-2">
              <Button size="lg" disabled={s.reasoned < s.diff} onClick={() => setConfirm('finish')}>
                <BadgeCheck aria-hidden />
                Selesaikan opname
              </Button>
              {s.reasoned < s.diff && (
                <p className="text-note text-muted-foreground">
                  {s.diff - s.reasoned} produk selisih belum diberi alasan.
                </p>
              )}
              <Button variant="outline" onClick={() => goTo('hitung')}>
                <ArrowLeft aria-hidden />
                Kembali ke hitung
              </Button>
            </div>
          )
        }
      >
        <Totals
          rows={[
            { label: 'Produk dihitung', value: s.n },
            { label: 'Sesuai', value: s.ok },
            { label: 'Selisih', value: s.diff },
            { label: 'Kurang', value: <SignedValue value={s.minus} currency /> },
            { label: 'Lebih', value: <SignedValue value={s.plus} currency /> },
          ]}
          grand={{
            label: 'Nilai bersih',
            value: <SignedValue value={s.net} currency zero="Rp 0" />,
          }}
        />
        <div className="flex flex-col gap-1">
          <span className="flex justify-between text-xs text-muted-foreground">
            <span>Alasan terisi</span>
            <b className="tabular-nums text-foreground">
              {s.reasoned} / {s.diff}
            </b>
          </span>
          <Meter
            value={s.diff ? s.reasoned / s.diff : 1}
            tone={s.reasoned < s.diff ? 'warn' : 'ok'}
            label="Alasan terisi"
          />
        </div>
      </SidePanel>
    );

  return (
    <>
      <PageHeader
        title={run.name}
        back={ROUTES.STOK_OPNAME}
        stats={[
          { id: 'code', label: 'Kode', value: run.code },
          {
            id: 'start',
            label: 'Mulai',
            value: `${clock(new Date(run.startedAt))} · ${run.auditor}`,
          },
          { id: 'lock', label: 'Dikunci', value: `${s.n} produk`, tone: 'warn' },
        ]}
      />
      <div className="flex flex-col gap-3">
        <StepBar
          steps={[
            { key: 'cakupan', label: `Cakupan · ${s.n} produk`, state: 'done' },
            {
              key: 'hitung',
              label: `Hitung · ${s.counted}/${s.n}`,
              state: current === 'hitung' ? 'current' : 'done',
              onClick: current === 'hitung' ? undefined : () => goTo('hitung'),
            },
            {
              key: 'tinjau',
              label: 'Tinjau selisih',
              state: current === 'tinjau' ? 'current' : 'todo',
              onClick: current === 'tinjau' ? undefined : () => goTo('tinjau'),
              disabled: remaining > 0,
              hint: 'Hitung semua produk dulu',
            },
          ]}
          aside={saveState}
        />
        <PosLayout
          cartLabel={current === 'hitung' ? 'Progres hitung' : 'Ringkasan selisih'}
          bar={
            current === 'hitung'
              ? {
                  summary: 'Dihitung',
                  value: `${s.counted} / ${s.n}`,
                  actionLabel: 'Progres',
                  icon: ListChecks,
                }
              : {
                  summary: 'Nilai bersih',
                  value: rpSigned(s.net),
                  actionLabel: 'Ringkasan',
                  icon: Receipt,
                }
          }
          catalog={
            current === 'hitung' ? (
              <CountView
                items={run.items}
                filter={countFilter}
                onFilterChange={setCountFilter}
                onChange={autosave.queue}
              />
            ) : (
              <ReviewView
                items={run.items}
                filter={reviewFilter}
                onFilterChange={setReviewFilter}
                onChange={autosave.queue}
              />
            )
          }
          cart={side}
        />
      </div>
    </>
  );
};

export default OpnameRunPage;
