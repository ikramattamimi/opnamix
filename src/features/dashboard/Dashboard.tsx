import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarX,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  Timer,
  TriangleAlert,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { GlassTile } from '@/components/layout/GlassTile';
import { Button } from '@/components/ui/button';
import { agoShort, rp } from '@/lib/format';
import { ROUTES, opnamePath } from '@/types/routes';
import { STAFF_ROLES } from '@/app/routes';
import { getUserRoles } from '@/app/routeUtils';
import { useAuth } from '@/features/auth/useAuth';
import { useAllProducts } from '@/features/products/useProducts';
import { stockStatus } from '@/features/products/catalog';
import { useStockOutRequests } from '@/features/stock-out/useStockOut';
import { useActiveOpnames, useOpnameSchedules } from '@/features/opname/useOpname';
import { nextRun, runStats, timeLabel } from '@/features/opname/catalog';
import { useExpiringBatches, useStockMutations } from '@/features/reports/useReports';
import { mutationBuckets } from '@/features/reports/reportView';
import {
  ExpiringCard,
  MovementCard,
  StockHealthCard,
  TasksCard,
  TodayCard,
  type DashTask,
  type TodayEvent,
} from './components/DashboardSections';

const greet = (d = new Date()) => {
  const h = d.getHours();
  return h < 11
    ? 'Selamat pagi'
    : h < 15
      ? 'Selamat siang'
      : h < 18
        ? 'Selamat sore'
        : 'Selamat malam';
};

const isToday = (iso?: string | null) =>
  !!iso && new Date(iso).toDateString() === new Date().toDateString();

const EXPIRY_URGENT_MONTHS = 3;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const roles = getUserRoles(userProfile);
  const isStaff = roles.some((r) => (STAFF_ROLES as readonly string[]).includes(r));
  const isNakes = roles.includes('nakes') && !isStaff;

  const { data: products = [] } = useAllProducts();
  // Parameter sama dengan halaman Stok Keluar, jadi cache-nya dibagi
  const { data: requestData } = useStockOutRequests({
    page: 1,
    perPage: 1000,
    createdBy: isNakes && user?.id ? user.id : undefined,
    nakesName: isNakes && userProfile?.full_name ? userProfile.full_name : undefined,
  });
  const { data: activeRuns = [] } = useActiveOpnames();
  const { data: schedules = [] } = useOpnameSchedules();
  const { data: expiring = [] } = useExpiringBatches(6);

  const range = useMemo(() => {
    const now = new Date();
    return {
      from: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6),
      to: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999),
    };
  }, []);
  const { data: mutations = [] } = useStockMutations(range.from, range.to);

  const requests = useMemo(() => requestData?.data ?? [], [requestData]);
  const pending = requests
    .filter((r) => r.status === 'Menunggu')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const habis = products.filter((p) => stockStatus(p) === 'habis');
  const menipis = products.filter((p) => stockStatus(p) === 'menipis');
  const urgentExpiry = expiring.filter(
    (b) => new Date(b.expireDate).getTime() - Date.now() < EXPIRY_URGENT_MONTHS * 30.4 * 864e5,
  );
  const openRequest = (nomor: string) =>
    navigate(`${ROUTES.STOK_KELUAR}?sel=${encodeURIComponent(nomor)}`);
  const names = (list: { name: string }[], max = 4) =>
    list
      .slice(0, max)
      .map((p) => p.name)
      .join(', ') + (list.length > max ? `, +${list.length - max} lainnya` : '');

  const tasks: DashTask[] = [];
  if (isStaff && habis.length)
    tasks.push({
      key: 'habis',
      icon: CircleAlert,
      tone: 'bad',
      title: `${habis.length} produk stok habis`,
      subtitle: names(habis),
      meta: 'Kritis',
      action: 'Terima barang',
      primary: true,
      onAction: () => navigate(ROUTES.STOK_MASUK_BARU),
    });
  for (const r of pending)
    tasks.push({
      key: `req-${r.id}`,
      icon: ClipboardList,
      tone: 'obat',
      title: `Permintaan ${r.patient.fullName || 'tanpa nama'}`,
      subtitle: `${r.requestedBy} · ${r.drugs.length} produk${r.services.length ? ` · ${r.services.length} jasa` : ''} · ${rp(r.totalAmount)}`,
      meta: agoShort(new Date(r.createdAt)),
      action: isStaff ? 'Proses' : 'Lihat',
      primary: isStaff,
      onAction: () => openRequest(r.id),
    });
  if (isStaff) {
    for (const run of activeRuns) {
      const s = runStats(run.items);
      tasks.push({
        key: `opn-${run.id}`,
        icon: Timer,
        tone: 'warn',
        title: `Opname berjalan: ${run.name}`,
        subtitle: `${s.counted} dari ${s.n} produk dihitung · ${s.n} produk dikunci`,
        meta: `sejak ${new Date(run.startedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
        action: 'Lanjutkan',
        onAction: () => navigate(opnamePath(run.id, 'hitung')),
      });
    }
    if (urgentExpiry.length)
      tasks.push({
        key: 'exp',
        icon: CalendarX,
        tone: 'warn',
        title: `${urgentExpiry.length} batch kedaluwarsa kurang dari ${EXPIRY_URGENT_MONTHS} bulan`,
        subtitle: names(
          urgentExpiry.map((b) => ({ name: b.product.name })),
          3,
        ),
        action: 'Lihat',
        onAction: () => navigate(ROUTES.STOK_MASUK),
      });
    if (menipis.length)
      tasks.push({
        key: 'low',
        icon: TriangleAlert,
        tone: 'warn',
        title: `${menipis.length} produk stok menipis`,
        subtitle: names(menipis),
        action: 'Lihat',
        onAction: () => navigate(ROUTES.MASTER_DATA_PRODUK),
      });
  }

  // Aktivitas hari ini dari permintaan, penerimaan, dan opname
  const events: TodayEvent[] = [];
  for (const r of requests) {
    if (isToday(r.createdAt))
      events.push({
        id: `c-${r.id}`,
        time: new Date(r.createdAt),
        title: `Permintaan ${r.patient.fullName || 'tanpa nama'}`,
        subtitle: `${r.requestedBy} · ${rp(r.totalAmount)}`,
        tone: 'neutral',
      });
    if (r.status === 'Selesai' && isToday(r.processedAt))
      events.push({
        id: `p-${r.id}`,
        time: new Date(r.processedAt!),
        title: `${r.requestId} diproses`,
        subtitle: `${r.processedBy ?? '-'} · stok dikurangi`,
        tone: 'ok',
      });
  }
  const receipts = new Map<string, TodayEvent & { count: number }>();
  for (const m of mutations) {
    if (m.type !== 'Masuk' || !isToday(m.date)) continue;
    const prev = receipts.get(m.code);
    receipts.set(m.code, {
      id: `in-${m.code}`,
      time: new Date(m.date),
      title: `Penerimaan ${m.code}`,
      subtitle: m.note.split(' · ')[0],
      tone: 'ok',
      count: (prev?.count ?? 0) + 1,
    });
  }
  for (const r of receipts.values())
    events.push({ ...r, subtitle: `${r.subtitle} · ${r.count} produk` });
  if (isStaff)
    for (const run of activeRuns)
      if (isToday(run.startedAt))
        events.push({
          id: `opn-${run.id}`,
          time: new Date(run.startedAt),
          title: `${run.name} dimulai`,
          subtitle: `${run.auditor} · ${run.items.length} produk dikunci`,
          tone: 'warn',
        });
  events.sort((a, b) => b.time.getTime() - a.time.getTime());
  const shownEvents = events.slice(0, 6);

  const upcoming = isStaff
    ? schedules
        .map((s) => ({ s, d: nextRun(s) }))
        .filter((x): x is { s: (typeof schedules)[number]; d: Date } => !!x.d)
        .sort((a, b) => a.d.getTime() - b.d.getTime())
        .slice(0, 2)
        .map(({ s, d }) => ({
          id: s.id,
          title: `${d.getDate()} ${d.toLocaleDateString('id-ID', { month: 'short' })} · ${s.nama}`,
          subtitle: `Pukul ${timeLabel(s)}`,
        }))
    : [];

  const buckets = mutationBuckets(mutations, range.from, range.to);
  const inCount = new Set(mutations.filter((m) => m.type === 'Masuk').map((m) => m.code)).size;
  const outCount = new Set(mutations.filter((m) => m.type === 'Keluar').map((m) => m.code)).size;
  const todayCount = requests.filter((r) => isToday(r.createdAt)).length + receipts.size;
  const firstName = (userProfile?.full_name || '').trim().split(/\s+/)[0];
  const run = isStaff ? activeRuns[0] : undefined;

  return (
    <>
      <PageHeader title={`${greet()}${firstName ? `, ${firstName}` : ''}`}>
        <p className="text-meta text-on-grad-2">
          <b className="text-on-grad">{todayCount} transaksi hari ini.</b> {tasks.length} hal
          menunggu tindakan Anda.
        </p>
        {(pending.length > 0 || run || (isStaff && habis.length > 0)) && (
          <div className="grid gap-2 md:grid-cols-3">
            {pending.length > 0 && (
              <GlassTile
                icon={ClipboardList}
                title={`${pending.length} permintaan menunggu`}
                subtitle={`Paling lama ${agoShort(new Date(pending[0].createdAt))} · ${pending[0].patient.fullName || '-'}`}
                action={
                  <Button
                    variant="glass"
                    size="icon"
                    aria-label="Buka permintaan"
                    onClick={() => openRequest(pending[0].id)}
                  >
                    <ChevronRight aria-hidden />
                  </Button>
                }
              />
            )}
            {run && (
              <GlassTile
                icon={Timer}
                title={`Opname berjalan ${runStats(run.items).counted}/${run.items.length}`}
                subtitle={`${run.name} · ${run.auditor}`}
                action={
                  <Button
                    variant="glass"
                    size="icon"
                    aria-label="Lanjutkan opname"
                    onClick={() => navigate(opnamePath(run.id, 'hitung'))}
                  >
                    <ChevronRight aria-hidden />
                  </Button>
                }
              />
            )}
            {isStaff && habis.length > 0 && (
              <GlassTile
                icon={CircleAlert}
                title={`${habis.length} produk stok habis`}
                subtitle={names(habis, 3)}
                action={
                  <Button
                    variant="glass"
                    size="icon"
                    aria-label="Terima barang"
                    onClick={() => navigate(ROUTES.STOK_MASUK_BARU)}
                  >
                    <ChevronRight aria-hidden />
                  </Button>
                }
              />
            )}
          </div>
        )}
      </PageHeader>

      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-3">
          <TasksCard tasks={tasks} />
          {isStaff && <MovementCard buckets={buckets} inCount={inCount} outCount={outCount} />}
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <TodayCard
            events={shownEvents}
            upcoming={upcoming}
            moreLabel={
              events.length > shownEvents.length && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto self-start px-0"
                  onClick={() => navigate(ROUTES.NOTIFICATIONS)}
                >
                  Lihat {events.length - shownEvents.length} aktivitas lain di Notifikasi
                </Button>
              )
            }
          />
          <StockHealthCard
            products={products}
            onOpenReport={isStaff ? () => navigate(ROUTES.LAPORAN_STOK) : undefined}
          />
          {isStaff && <ExpiringCard batches={expiring} />}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
