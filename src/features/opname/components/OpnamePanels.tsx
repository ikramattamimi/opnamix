import React, { useState } from 'react';
import {
  ArrowRight,
  CalendarClock,
  CalendarCog,
  Check,
  CircleCheck,
  ClipboardCheck,
  Loader2,
  Lock,
  Pencil,
  Play,
  Plus,
  Trash2,
} from 'lucide-react';
import { SidePanel, PanelSection } from '@/components/panel/SidePanel';
import { DefinitionList } from '@/components/panel/DefinitionList';
import { MiniStats } from '@/components/panel/MiniStats';
import { LineItems } from '@/components/panel/LineItems';
import { InfoBox } from '@/components/panel/InfoBox';
import { InlineConfirm } from '@/components/panel/InlineConfirm';
import { SettingRow } from '@/components/panel/SettingRow';
import { SegmentedControl } from '@/components/data/SegmentedControl';
import { SignedValue } from '@/components/data/SignedValue';
import { EmptyState } from '@/components/common/QueryState';
import { Field } from '@/components/form/Field';
import { OptionSelect } from '@/components/form/OptionSelect';
import { ChoiceChips } from '@/components/form/ChoiceChips';
import { Switch } from '@/components/form/Switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDateTimeForDisplay } from '@/lib/format';
import { CATEGORIES, CATEGORY_META } from '@/features/products/catalog';
import type { Category, Product } from '@/features/products/types';
import {
  FREQUENCY_LABEL,
  diffOf,
  longDate,
  nextRun,
  reasonLabel,
  runStats,
  scheduleScope,
  scopeLabel,
  scopeProductIds,
  timeLabel,
  valueOf,
  type ScheduleScope,
} from '../catalog';
import type { OpnameRun, OpnameSchedule, OpnameScheduleConfig, PengulanganOpname } from '../types';
import { ProductPicker } from './ProductPicker';

const categoryLabel = (c: Category) => CATEGORY_META[c]?.short ?? c;

export const LockInfo: React.FC<{ count: number }> = ({ count }) => (
  <InfoBox icon={Lock}>
    Selama opname berjalan, <b>{count} produk</b> ini dikunci dari stok masuk dan keluar. Produk
    lain tetap bisa dipakai seperti biasa.
  </InfoBox>
);

// ---- Detail opname selesai ----

export const HistoryPanel: React.FC<{ run: OpnameRun; onReport: () => void }> = ({
  run,
  onReport,
}) => {
  const s = runStats(run.items);
  const diffs = run.items
    .filter((i) => (diffOf(i) ?? 0) !== 0)
    .sort((a, b) => valueOf(a) - valueOf(b));
  return (
    <SidePanel
      icon={ClipboardCheck}
      tone={s.diff ? 'warn' : 'ok'}
      eyebrow={`${run.code} · selesai`}
      title={run.name}
      footer={
        <Button className="sm:ml-auto" onClick={onReport}>
          Laporan lengkap
          <ArrowRight aria-hidden />
        </Button>
      }
    >
      <MiniStats
        items={[
          { label: 'Dihitung', value: `${s.n} produk` },
          { label: 'Selisih', value: `${s.diff} produk` },
          {
            label: 'Nilai selisih',
            value: <SignedValue value={s.net} currency zero="Rp 0" />,
          },
        ]}
      />
      <DefinitionList
        items={[
          { label: 'Selesai', value: formatDateTimeForDisplay(run.completedAt ?? undefined) },
          { label: 'Petugas', value: run.auditor },
          { label: 'Jadwal', value: run.scheduleName ?? 'Opname cepat' },
        ]}
      />
      <PanelSection title={`Produk selisih · ${s.diff}`}>
        {diffs.length ? (
          <LineItems
            items={diffs.map((i) => ({
              id: i.detailId,
              title: i.product.name,
              subtitle: `${i.product.brand || 'Generik'} · sistem ${i.systemStock} → ${
                i.finalStock ?? i.physicalStock
              } ${i.product.unit.toLowerCase()}${reasonLabel(i) ? ` · ${reasonLabel(i)}` : ''}`,
              amount: <SignedValue value={valueOf(i)} currency />,
            }))}
          />
        ) : (
          <InfoBox icon={CircleCheck}>Semua produk sesuai dengan stok sistem.</InfoBox>
        )}
      </PanelSection>
    </SidePanel>
  );
};

// ---- Jadwal yang akan datang ----

export const UpcomingPanel: React.FC<{
  schedule: OpnameSchedule;
  date: Date;
  productIds: string[];
  clash: OpnameRun | undefined;
  starting: boolean;
  onEdit: () => void;
  onStart: () => void;
}> = ({ schedule, date, productIds, clash, starting, onEdit, onStart }) => (
  <SidePanel
    icon={CalendarClock}
    tone="obat"
    eyebrow="Terjadwal"
    title={schedule.nama}
    footer={
      <>
        <Button variant="outline" onClick={onEdit}>
          <Pencil aria-hidden />
          Atur jadwal
        </Button>
        <Button
          className="sm:ml-auto"
          onClick={onStart}
          disabled={!!clash || starting || productIds.length === 0}
        >
          {starting ? <Loader2 className="animate-spin" aria-hidden /> : <Play aria-hidden />}
          Mulai sekarang
        </Button>
      </>
    }
  >
    <DefinitionList
      items={[
        { label: 'Tanggal', value: longDate(date) },
        { label: 'Jam', value: timeLabel(schedule) },
        { label: 'Berulang', value: FREQUENCY_LABEL[schedule.pengulangan] },
        ...(schedule.durasiPengerjaan
          ? [{ label: 'Perkiraan durasi', value: `${schedule.durasiPengerjaan} jam` }]
          : []),
        { label: 'Cakupan', value: scopeLabel(scheduleScope(schedule), categoryLabel) },
        { label: 'Jumlah produk', value: productIds.length },
      ]}
    />
    {clash ? (
      <InfoBox tone="warn">
        Sebagian produk sedang dihitung di <b>{clash.name}</b>. Selesaikan opname itu dulu sebelum
        memulai yang ini.
      </InfoBox>
    ) : (
      <LockInfo count={productIds.length} />
    )}
  </SidePanel>
);

// ---- Daftar jadwal ----

export const SchedulesPanel: React.FC<{
  schedules: OpnameSchedule[];
  products: readonly Product[];
  onEdit: (schedule: OpnameSchedule) => void;
  onNew: () => void;
  onToggle: (schedule: OpnameSchedule, active: boolean) => void;
  onClose: () => void;
}> = ({ schedules, products, onEdit, onNew, onToggle, onClose }) => (
  <SidePanel
    icon={CalendarCog}
    tone="obat"
    eyebrow="Stok opname"
    title="Jadwal opname"
    onClose={onClose}
    footer={
      <>
        <Button variant="ghost" onClick={onClose}>
          Tutup
        </Button>
        <Button className="sm:ml-auto" onClick={onNew}>
          <Plus aria-hidden />
          Jadwal baru
        </Button>
      </>
    }
  >
    {schedules.length === 0 ? (
      <EmptyState icon={CalendarClock} title="Belum ada jadwal" />
    ) : (
      <div>
        {schedules.map((s) => {
          const scope = scheduleScope(s);
          const next = nextRun(s);
          return (
            <SettingRow
              key={s.id}
              title={s.nama}
              description={
                <>
                  {FREQUENCY_LABEL[s.pengulangan]} · tanggal {s.tanggalAudit} · {timeLabel(s)}
                  <br />
                  {scopeLabel(scope, categoryLabel)} · {scopeProductIds(scope, products).length}{' '}
                  produk
                  <br />
                  {next ? `Berikutnya ${longDate(next)}` : 'Nonaktif'}
                </>
              }
              control={
                <span className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Atur ${s.nama}`}
                    onClick={() => onEdit(s)}
                  >
                    <Pencil aria-hidden />
                  </Button>
                  <Switch
                    label={`Aktifkan ${s.nama}`}
                    checked={!!s.isActive}
                    onCheckedChange={(on) => onToggle(s, on)}
                  />
                </span>
              }
            />
          );
        })}
      </div>
    )}
    <p className="text-note text-muted-foreground">
      Opname terjadwal muncul di daftar dan bisa dimulai saat harinya tiba. Nonaktifkan jadwal untuk
      menghentikannya tanpa menghapus.
    </p>
  </SidePanel>
);

// ---- Form jadwal ----

type ScopeType = ScheduleScope['type'];

interface ScheduleDraft {
  nama: string;
  pengulangan: PengulanganOpname;
  day: string;
  time: string;
  durasi: string;
  scope: ScopeType;
  categories: Category[];
  productIds: Set<string>;
}

const draftFrom = (s?: OpnameSchedule): ScheduleDraft => {
  const scope = s ? scheduleScope(s) : ({ type: 'semua' } as ScheduleScope);
  return {
    nama: s?.nama ?? '',
    pengulangan: s?.pengulangan ?? 'BULANAN',
    day: String(s?.tanggalAudit ?? 1),
    time: s ? timeLabel(s).replace('.', ':') : '08:00',
    durasi: s?.durasiPengerjaan ? String(s.durasiPengerjaan) : '',
    scope: scope.type,
    categories: scope.type === 'kategori' ? scope.categories : [],
    productIds: new Set(scope.type === 'manual' ? scope.productIds : []),
  };
};

export const ScheduleFormPanel: React.FC<{
  schedule?: OpnameSchedule;
  products: readonly Product[];
  saving: boolean;
  deleting: boolean;
  onSave: (config: OpnameScheduleConfig) => void;
  onDelete: (schedule: OpnameSchedule) => void;
  onCancel: () => void;
}> = ({ schedule, products, saving, deleting, onSave, onDelete, onCancel }) => {
  const [d, setD] = useState(() => draftFrom(schedule));
  const [submitted, setSubmitted] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = <K extends keyof ScheduleDraft>(k: K, v: ScheduleDraft[K]) =>
    setD((prev) => ({ ...prev, [k]: v }));

  const [hh, mm] = d.time.split(':').map(Number);
  const scope: ScheduleScope =
    d.scope === 'kategori'
      ? { type: 'kategori', categories: d.categories }
      : d.scope === 'manual'
        ? { type: 'manual', productIds: [...d.productIds] }
        : { type: 'semua' };
  const count = scopeProductIds(scope, products).length;
  const next = nextRun({
    tanggalAudit: Number(d.day),
    waktuJam: hh,
    waktuMenit: mm,
    pengulangan: d.pengulangan,
    isActive: true,
  });

  const errors = {
    nama: !d.nama.trim() ? 'Nama jadwal wajib diisi.' : undefined,
    time: Number.isNaN(hh) ? 'Jam mulai wajib diisi.' : undefined,
    scope:
      d.scope === 'kategori' && d.categories.length === 0
        ? 'Pilih minimal satu kategori.'
        : d.scope === 'manual' && d.productIds.size === 0
          ? 'Pilih minimal satu produk.'
          : undefined,
  };
  const shown: Partial<typeof errors> = submitted ? errors : {};

  const submit = () => {
    setSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;
    onSave({
      nama: d.nama,
      pengulangan: d.pengulangan,
      dayOfMonth: Number(d.day),
      waktuJam: hh,
      waktuMenit: mm || 0,
      durasiPengerjaan: d.durasi ? Number(d.durasi) : null,
      kategori: d.scope === 'kategori' ? d.categories : null,
      obatIds: d.scope === 'manual' ? [...d.productIds] : null,
    });
  };

  return (
    <SidePanel
      icon={schedule ? CalendarCog : Plus}
      tone="obat"
      eyebrow={schedule ? 'Atur jadwal' : 'Jadwal baru'}
      title={schedule ? schedule.nama : 'Jadwal baru'}
      onClose={onCancel}
      footer={
        confirmDelete && schedule ? (
          <InlineConfirm
            tone="danger"
            message="Hapus jadwal ini? Riwayat opname dari jadwal ini tetap tersimpan."
            confirmLabel="Ya, hapus"
            confirmIcon={Trash2}
            busy={deleting}
            onConfirm={() => onDelete(schedule)}
            onCancel={() => setConfirmDelete(false)}
          />
        ) : (
          <>
            {schedule && (
              <Button variant="ghost-danger" onClick={() => setConfirmDelete(true)}>
                <Trash2 aria-hidden />
                Hapus
              </Button>
            )}
            <Button variant="outline" className="sm:ml-auto" onClick={onCancel} disabled={saving}>
              Batal
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
              Simpan
            </Button>
          </>
        )
      }
    >
      <Field label="Nama jadwal" required error={shown.nama}>
        <Input
          value={d.nama}
          onChange={(e) => set('nama', e.target.value)}
          placeholder="Opname bulanan obat oral"
        />
      </Field>
      <Field label="Berulang">
        <SegmentedControl<PengulanganOpname>
          label="Berulang"
          full
          value={d.pengulangan}
          onChange={(v) => set('pengulangan', v)}
          options={(['BULANAN', 'TRIWULAN', 'TAHUNAN'] as const).map((v) => ({
            value: v,
            label: FREQUENCY_LABEL[v],
          }))}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Tanggal" hint="1–28 supaya ada di setiap bulan.">
          <OptionSelect
            value={d.day}
            onValueChange={(v) => set('day', v)}
            options={Array.from({ length: 28 }, (_, i) => ({
              value: String(i + 1),
              label: String(i + 1),
            }))}
          />
        </Field>
        <Field label="Jam mulai" error={shown.time}>
          <Input type="time" value={d.time} onChange={(e) => set('time', e.target.value)} />
        </Field>
      </div>
      <Field label="Perkiraan durasi (jam)">
        <Input
          inputMode="numeric"
          value={d.durasi}
          onChange={(e) => set('durasi', e.target.value.replace(/\D/g, ''))}
          placeholder="Opsional"
        />
      </Field>
      <Field label="Cakupan produk" error={shown.scope}>
        <SegmentedControl<ScopeType>
          label="Cakupan produk"
          full
          value={d.scope}
          onChange={(v) => set('scope', v)}
          options={[
            { value: 'semua', label: 'Semua' },
            { value: 'kategori', label: 'Per kategori' },
            { value: 'manual', label: 'Pilih manual' },
          ]}
        />
      </Field>
      {d.scope === 'kategori' && (
        <ChoiceChips<Category>
          multiple
          label="Kategori cakupan"
          value={d.categories}
          onChange={(v) => set('categories', v)}
          options={CATEGORIES.map((c) => ({ value: c, label: categoryLabel(c) }))}
        />
      )}
      {d.scope === 'manual' && (
        <ProductPicker
          products={products}
          selected={d.productIds}
          onChange={(ids) => set('productIds', ids)}
        />
      )}
      <InfoBox icon={CalendarClock}>
        {next ? (
          <>
            Berikutnya <b>{longDate(next)}</b> pukul <b>{d.time.replace(':', '.')}</b> ·{' '}
            <b>{count} produk</b>
          </>
        ) : (
          'Lengkapi jadwal untuk melihat tanggal berikutnya.'
        )}
      </InfoBox>
    </SidePanel>
  );
};

// ---- Mulai opname ----

type Source = 'jadwal' | 'cepat';

export const StartPanel: React.FC<{
  schedules: OpnameSchedule[];
  products: readonly Product[];
  locked: ReadonlyMap<string, string>;
  lastOpnamed: ReadonlyMap<string, Date>;
  initialScheduleId?: string;
  starting: boolean;
  onStart: (input: { name: string; scheduleId: string | null; productIds: string[] }) => void;
  onCancel: () => void;
}> = ({
  schedules,
  products,
  locked,
  lastOpnamed,
  initialScheduleId,
  starting,
  onStart,
  onCancel,
}) => {
  const active = schedules.filter((s) => s.isActive);
  const [source, setSource] = useState<Source>(active.length ? 'jadwal' : 'cepat');
  const [scheduleId, setScheduleId] = useState(initialScheduleId ?? active[0]?.id ?? '');
  const [name, setName] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const schedule = active.find((s) => s.id === scheduleId);
  const scheduleIds = schedule ? scopeProductIds(scheduleScope(schedule), products) : [];
  const clashName = scheduleIds.map((id) => locked.get(id)).find(Boolean);

  const ids = source === 'jadwal' ? scheduleIds : [...picked];
  const canStart = ids.length > 0 && !(source === 'jadwal' && clashName) && !starting;
  const today = new Date();
  const defaultName = `Opname cepat ${today.getDate()} ${today.toLocaleDateString('id-ID', { month: 'short' })}`;

  return (
    <SidePanel
      icon={Play}
      tone="obat"
      eyebrow="Stok opname"
      title="Mulai opname"
      onClose={onCancel}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={starting}>
            Batal
          </Button>
          <Button
            className="sm:ml-auto"
            disabled={!canStart}
            onClick={() =>
              onStart({
                name: source === 'jadwal' ? '' : name.trim() || defaultName,
                scheduleId: source === 'jadwal' ? scheduleId : null,
                productIds: ids,
              })
            }
          >
            {starting ? <Loader2 className="animate-spin" aria-hidden /> : <Play aria-hidden />}
            {ids.length ? `Mulai opname · ${ids.length} produk` : 'Mulai opname'}
          </Button>
        </>
      }
    >
      <SegmentedControl<Source>
        label="Sumber"
        full
        value={source}
        onChange={setSource}
        options={[
          { value: 'jadwal', label: 'Dari jadwal' },
          { value: 'cepat', label: 'Opname cepat' },
        ]}
      />
      {source === 'jadwal' ? (
        active.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="Belum ada jadwal aktif"
            description="Pakai opname cepat, atau buat jadwal lewat tombol Jadwal."
          />
        ) : (
          <>
            <Field label="Jadwal">
              <OptionSelect
                value={scheduleId}
                onValueChange={setScheduleId}
                options={active.map((s) => ({ value: s.id, label: s.nama }))}
              />
            </Field>
            {schedule && (
              <DefinitionList
                items={[
                  { label: 'Cakupan', value: scopeLabel(scheduleScope(schedule), categoryLabel) },
                  { label: 'Jumlah produk', value: scheduleIds.length },
                  {
                    label: 'Jadwal berikutnya',
                    value: nextRun(schedule) ? longDate(nextRun(schedule)!) : '-',
                  },
                ]}
              />
            )}
            {clashName ? (
              <InfoBox tone="warn">
                Sebagian produk sedang dihitung di <b>{clashName}</b>. Selesaikan opname itu dulu.
              </InfoBox>
            ) : (
              <LockInfo count={scheduleIds.length} />
            )}
          </>
        )
      ) : (
        <>
          <Field label="Nama · opsional">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={defaultName}
            />
          </Field>
          <ProductPicker
            products={products}
            selected={picked}
            onChange={setPicked}
            locked={locked}
            lastOpnamed={lastOpnamed}
          />
          <LockInfo count={picked.size} />
        </>
      )}
    </SidePanel>
  );
};
