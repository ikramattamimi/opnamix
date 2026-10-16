import React from 'react';
import {
  Archive,
  BadgeCheck,
  Bookmark,
  CalendarDays,
  CircleCheck,
  Info,
  Tag,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import type { OpnameDetail } from '../../api';

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('id-ID', { dateStyle: 'long' });

const InfoRow: React.FC<{
  icon: LucideIcon;
  iconClassName: string;
  label: string;
  value: string;
}> = ({ icon: Icon, iconClassName, label, value }) => (
  <div>
    <p className="text-xs font-bold text-text-secondary-light uppercase tracking-wider mb-1 flex items-center gap-1.5">
      <Icon className={`size-4 ${iconClassName}`} aria-hidden />
      {label}
    </p>
    <p className="font-bold text-sm">{value}</p>
  </div>
);

const StatRow: React.FC<{
  icon: LucideIcon;
  colorClassName: string;
  label: string;
  value: number;
}> = ({ icon: Icon, colorClassName, label, value }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-text-secondary-light flex items-center gap-2">
      <Icon className={`size-4 ${colorClassName}`} aria-hidden />
      {label}
    </span>
    <span className={`text-lg font-bold ${colorClassName}`}>{value}</span>
  </div>
);

interface OpnameInfoPanelProps {
  opname: OpnameDetail | undefined;
  totalItems: number;
  matched: number;
  discrepancies: number;
}

// Informasi opname dan ringkasan hasil di kolom kiri
const OpnameInfoPanel: React.FC<OpnameInfoPanelProps> = ({
  opname,
  totalItems,
  matched,
  discrepancies,
}) => (
  <div className="bg-card-light dark:bg-card-dark rounded-3xl p-6 shadow-soft sticky top-6">
    <h3 className="text-base font-bold mb-5 flex items-center gap-2">
      <Info className="size-5 text-primary" aria-hidden />
      Informasi Opname
    </h3>

    <div className="space-y-4">
      <InfoRow
        icon={Tag}
        iconClassName="text-primary"
        label="Kode Opname"
        value={opname?.opnameNumber || '-'}
      />
      <InfoRow
        icon={Bookmark}
        iconClassName="text-indigo-500"
        label="Referensi Jadwal"
        value={opname?.scheduleName || '-'}
      />
      <InfoRow
        icon={CalendarDays}
        iconClassName="text-amber-500"
        label="Tanggal Jadwal"
        value={opname?.scheduleDate ? formatDate(opname.scheduleDate) : '-'}
      />
      <InfoRow
        icon={CircleCheck}
        iconClassName="text-emerald-500"
        label="Tanggal Dilaksanakan"
        value={opname?.completedAt ? formatDate(opname.completedAt) : '-'}
      />
    </div>

    <div className="border-t border-gray-100 dark:border-gray-800 mt-5 pt-5 space-y-3">
      <StatRow icon={Archive} colorClassName="text-primary" label="Total Item" value={totalItems} />
      <StatRow icon={BadgeCheck} colorClassName="text-emerald-500" label="Sesuai" value={matched} />
      <StatRow
        icon={TriangleAlert}
        colorClassName="text-amber-500"
        label="Selisih"
        value={discrepancies}
      />
    </div>
  </div>
);

export default OpnameInfoPanel;
