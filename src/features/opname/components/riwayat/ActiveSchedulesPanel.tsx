import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, CalendarX, ChevronDown, CirclePlus, Plus, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDate, pengulanganLabel, ScheduleInfo } from './format';

const KONFIGURASI_PATH = '/audit/stok-opname/konfigurasi';

const repeatLabel = (s: ScheduleInfo) => pengulanganLabel[String(s.pengulangan)] || s.pengulangan;

// Strip jadwal aktif yang bisa dibuka-tutup di atas halaman (mobile)
export const ActiveSchedulesStrip: React.FC<{ schedules: ScheduleInfo[] }> = ({ schedules }) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  if (schedules.length === 0) {
    return (
      <div className="bg-gradient-to-r from-primary to-indigo-700 rounded-2xl shadow-lg px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <CalendarX className="size-5 text-white/60" aria-hidden />
          <span className="text-sm font-bold">Belum ada jadwal aktif</span>
        </div>
        <Button
          onClick={() => navigate(KONFIGURASI_PATH)}
          className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-xl px-3 py-2 h-auto [&_svg]:size-3"
        >
          <Plus className="mr-1" aria-hidden />
          Buat Jadwal
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-primary to-indigo-700 rounded-2xl shadow-lg overflow-hidden">
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        className="w-full h-auto flex items-center justify-between px-4 py-3 text-white hover:text-white hover:bg-transparent dark:hover:bg-transparent rounded-none active:scale-100 [&_svg]:size-6"
      >
        <div className="flex items-center gap-2">
          <CalendarDays className="!size-5 text-white/80" aria-hidden />
          <span className="text-sm font-bold">{schedules.length} Jadwal Aktif</span>
        </div>
        <ChevronDown
          className={cn('text-white/60 transition-transform', isExpanded && 'rotate-180')}
          aria-hidden
        />
      </Button>
      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          {schedules.map((s) => (
            <div key={s.scheduleId} className="bg-white/15 rounded-xl px-4 py-2.5">
              <p className="text-sm font-bold text-white">{s.nama}</p>
              <p className="text-xs text-white/60">
                {repeatLabel(s)} · Berikutnya: {formatDate(s.nextDate)}
              </p>
            </div>
          ))}
          <Button
            onClick={() => navigate(KONFIGURASI_PATH)}
            className="w-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-xl px-3 py-2.5 h-auto mt-1 [&_svg]:size-3"
          >
            <Settings className="mr-1" aria-hidden />
            Ubah Konfigurasi
          </Button>
        </div>
      )}
    </div>
  );
};

// Panel jadwal aktif dan tombol tambah opname di kolom kanan (desktop)
export const ActiveSchedulesSidebar: React.FC<{
  schedules: ScheduleInfo[];
  onAddOpname: () => void;
}> = ({ schedules, onAddOpname }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-b from-primary to-indigo-700 rounded-2xl shadow-lg p-5 space-y-3">
      <div className="flex items-center gap-2">
        <CalendarDays className="size-5 text-white/80" aria-hidden />
        <span className="text-sm font-bold text-white/80">Jadwal Aktif</span>
      </div>

      {schedules.length > 0 ? (
        <div className="space-y-2">
          {schedules.map((s) => (
            <div key={s.scheduleId} className="bg-white/15 rounded-xl px-4 py-3">
              <p className="text-sm font-bold text-white">{s.nama}</p>
              <p className="text-[11px] text-white/60 mt-0.5">{repeatLabel(s)}</p>
              <p className="text-[11px] text-white/60">Berikutnya: {formatDate(s.nextDate)}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/10 rounded-xl px-4 py-5 text-center">
          <CalendarX className="size-6 text-white/40 mx-auto mb-1" aria-hidden />
          <p className="text-xs text-white/60">Belum ada jadwal aktif</p>
        </div>
      )}

      <Button
        onClick={() => navigate(KONFIGURASI_PATH)}
        className="w-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-xl px-3 py-2.5 h-auto [&_svg]:size-3"
      >
        <Settings className="mr-1" aria-hidden />
        Konfigurasi Jadwal
      </Button>

      <Button
        onClick={onAddOpname}
        className="w-full bg-white hover:bg-primary/90 text-primary font-bold rounded-xl px-4 h-auto py-3 text-sm shadow-lg shadow-primary/20"
      >
        <CirclePlus className="mr-1.5" aria-hidden />
        Tambah Opname
      </Button>
    </div>
  );
};
