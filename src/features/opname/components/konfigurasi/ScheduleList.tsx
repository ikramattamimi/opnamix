import React from 'react';
import { Archive, CalendarDays, CalendarX, Pencil, Trash2 } from 'lucide-react';
import { OpnameSchedule } from '../../types';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/QueryState';
import { cn } from '@/lib/utils';

const pengulanganLabel: Record<string, string> = {
  BULANAN: 'Setiap Bulan',
  TRIWULAN: 'Setiap 3 Bulan',
  TAHUNAN: 'Setiap Tahun',
};

const obatCount = (schedule: OpnameSchedule) =>
  Array.isArray(schedule.obatIds) ? schedule.obatIds.length : 0;

interface ScheduleListProps {
  schedules: OpnameSchedule[];
  onEdit: (schedule: OpnameSchedule) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, currentStatus: boolean | null) => void;
}

// Sakelar aktif/nonaktif jadwal. Belum ada komponen switch di components/ui.
const ActiveSwitch: React.FC<{
  schedule: OpnameSchedule;
  onToggle: ScheduleListProps['onToggle'];
  large?: boolean;
}> = ({ schedule, onToggle, large = false }) => (
  <button
    type="button"
    role="switch"
    aria-checked={!!schedule.isActive}
    aria-label={`Jadwal ${schedule.nama} aktif`}
    onClick={() => onToggle(schedule.id, schedule.isActive)}
    className={cn(
      'relative rounded-full transition-colors',
      large ? 'w-11 h-6 flex-shrink-0' : 'w-10 h-5',
      schedule.isActive ? 'bg-emerald-500' : 'bg-gray-300',
    )}
  >
    <div
      className={cn(
        'absolute top-0.5 bg-white rounded-full transition-all shadow',
        large ? 'w-5 h-5' : 'w-4 h-4',
      )}
      style={{ left: schedule.isActive ? (large ? '23px' : '22px') : '2px' }}
    ></div>
  </button>
);

// Tabel jadwal (desktop)
export const ScheduleTable: React.FC<ScheduleListProps> = ({
  schedules,
  onEdit,
  onDelete,
  onToggle,
}) => (
  <div className="hidden lg:block bg-card rounded-3xl p-6 shadow-soft">
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="border-b border-gray-100 dark:border-gray-800">
          <tr className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
            <th className="px-4 py-4">Nama Jadwal</th>
            <th className="px-4 py-4 text-center">Tanggal Audit</th>
            <th className="px-4 py-4 text-center">Jumlah Obat</th>
            <th className="px-4 py-4 text-center">Status</th>
            <th className="px-4 py-4 text-center">Pengulangan</th>
            <th className="px-4 py-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {schedules.length > 0 ? (
            schedules.map((schedule) => (
              <tr
                key={schedule.id}
                className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <td className="px-4 py-4 font-bold text-foreground">{schedule.nama}</td>
                <td className="px-4 py-4 text-center text-sm">Tanggal {schedule.tanggalAudit}</td>
                <td className="px-4 py-4 text-center text-sm">
                  {schedule.obatIds === null ? (
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-bold">
                      Semua Obat
                    </span>
                  ) : (
                    <span>{obatCount(schedule)} obat</span>
                  )}
                </td>
                <td className="px-4 py-4 text-center">
                  <ActiveSwitch schedule={schedule} onToggle={onToggle} />
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="px-2 py-1 bg-background rounded-lg text-xs font-bold">
                    {pengulanganLabel[schedule.pengulangan] || schedule.pengulangan}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(schedule)}
                      aria-label={`Edit ${schedule.nama}`}
                      className="h-auto w-auto p-2 hover:bg-primary/10 dark:hover:bg-primary/10 rounded-lg transition-colors text-muted-foreground hover:text-primary [&_svg]:size-5"
                    >
                      <Pencil aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(schedule.id)}
                      aria-label={`Hapus ${schedule.nama}`}
                      className="h-auto w-auto p-2 hover:bg-red-500/10 dark:hover:bg-red-500/10 rounded-lg transition-colors text-muted-foreground hover:text-red-500 [&_svg]:size-5"
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6}>
                <EmptyState
                  icon={CalendarX}
                  title="Belum ada jadwal opname."
                  description='Klik "Tambah Jadwal" untuk membuat jadwal baru.'
                />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// Kartu jadwal (mobile dan tablet)
export const ScheduleCards: React.FC<ScheduleListProps> = ({
  schedules,
  onEdit,
  onDelete,
  onToggle,
}) => (
  <div className="lg:hidden space-y-3">
    {schedules.length > 0 ? (
      schedules.map((schedule) => (
        <div key={schedule.id} className="bg-card rounded-2xl p-4 shadow-soft">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base truncate mb-1">{schedule.nama}</h3>
            </div>
            <ActiveSwitch schedule={schedule} onToggle={onToggle} large />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <CalendarDays className="size-3" aria-hidden />
              Tanggal {schedule.tanggalAudit}
            </span>
            <span>•</span>
            <span className="px-2 py-0.5 bg-background rounded-lg font-bold">
              {pengulanganLabel[schedule.pengulangan] || schedule.pengulangan}
            </span>
            <span>•</span>
            {schedule.obatIds === null ? (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold">
                <Archive className="size-3" aria-hidden />
                Semua Obat
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-background rounded-lg text-xs font-bold">
                <Archive className="size-3" aria-hidden />
                {obatCount(schedule)} obat
              </span>
            )}
          </div>

          <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
            <Button
              variant="ghost"
              onClick={() => onEdit(schedule)}
              className="flex-1 h-auto flex items-center justify-center gap-2 py-2.5 px-4 bg-primary/10 hover:bg-primary/20 dark:hover:bg-primary/20 text-primary hover:text-primary rounded-xl transition-colors font-bold text-sm active:scale-95 [&_svg]:size-5"
            >
              <Pencil aria-hidden />
              Edit
            </Button>
            <Button
              variant="ghost"
              onClick={() => onDelete(schedule.id)}
              className="flex-1 h-auto flex items-center justify-center gap-2 py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-400 hover:text-red-500 rounded-xl transition-colors font-bold text-sm active:scale-95 [&_svg]:size-5"
            >
              <Trash2 aria-hidden />
              Hapus
            </Button>
          </div>
        </div>
      ))
    ) : (
      <div className="bg-card rounded-2xl shadow-soft">
        <EmptyState
          icon={CalendarX}
          title="Belum ada jadwal opname."
          description='Klik tombol "Tambah Jadwal" untuk membuat jadwal baru.'
        />
      </div>
    )}
  </div>
);
