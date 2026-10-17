import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, Clock, Play, Trash2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState } from '@/components/common/QueryState';
import { filterOpnames, formatDate, OpnameCard, stepLabel } from './format';
import { ListStateCard, OpnameSearchInput, SectionHeader } from './shared';

interface UpcomingOpnameListProps {
  drafts: OpnameCard[];
  upcoming: OpnameCard[];
  isError: boolean;
  onRetry: () => void;
  onDelete: (id: string) => void;
}

// Opname yang sedang dilaksanakan (draft) dan yang belum dilaksanakan
const UpcomingOpnameList: React.FC<UpcomingOpnameListProps> = ({
  drafts,
  upcoming,
  isError,
  onRetry,
  onDelete,
}) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const filteredDrafts = useMemo(() => filterOpnames(drafts, search), [drafts, search]);
  const filteredUpcoming = useMemo(() => filterOpnames(upcoming, search), [upcoming, search]);
  const openPelaksanaan = (id: string) => navigate(`/audit/stok-opname/pelaksanaan/${id}`);

  return (
    <div>
      <SectionHeader
        icon={Clock}
        iconClassName="bg-amber-500/10 text-amber-500"
        title="Opname Mendatang"
      />
      <OpnameSearchInput
        value={search}
        onChange={setSearch}
        placeholder="Cari opname mendatang..."
      />

      {filteredDrafts.length > 0 && (
        <div className="space-y-3 mb-4">
          {filteredDrafts.map((opname) => (
            <div
              key={opname.id}
              className="bg-card rounded-2xl p-5 shadow-soft border-l-4 border-blue-500"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold px-2.5 py-1 bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 rounded-lg">
                      Sedang Dilaksanakan
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Tahap {opname.currentStep}: {stepLabel[opname.currentStep || 1]}
                    </span>
                  </div>
                  <p className="font-bold text-foreground">{opname.scheduleName}</p>
                  <p className="text-xs text-muted-foreground">
                    Jadwal: {formatDate(opname.scheduleDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => openPelaksanaan(opname.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6 h-auto py-2.5 shadow-lg shadow-blue-600/20"
                  >
                    <Play className="mr-1.5" aria-hidden />
                    Lanjutkan
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => onDelete(opname.id)}
                    className="px-4 p-2.5 font-bold h-auto text-sm rounded-xl text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    title="Hapus Opname"
                  >
                    <Trash2 className="mr-1.5" aria-hidden />
                    Hapus
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredUpcoming.length > 0 ? (
        <div className="space-y-3">
          {filteredUpcoming.map((opname) => (
            <div
              key={opname.id}
              className="bg-card rounded-2xl p-5 shadow-soft border-l-4 border-amber-400"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 rounded-lg">
                    Belum Dilaksanakan
                  </span>
                  <p className="font-bold text-foreground">{opname.scheduleName}</p>
                  <p className="text-xs text-muted-foreground">
                    Target: {formatDate(opname.scheduleDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => openPelaksanaan(opname.id)}
                    className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl px-6 h-auto py-2.5 shadow-lg shadow-primary/20"
                  >
                    <Zap className="mr-1.5" aria-hidden />
                    Mulai Opname
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(opname.id)}
                    className="h-auto w-auto p-2.5 rounded-xl text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    title="Hapus Opname"
                    aria-label="Hapus Opname"
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <ListStateCard>
          <ErrorState title="Gagal memuat opname mendatang" onRetry={onRetry} />
        </ListStateCard>
      ) : (
        !filteredDrafts.length && (
          <ListStateCard>
            <EmptyState
              icon={CalendarCheck}
              title={search ? 'Tidak ada hasil yang cocok.' : 'Tidak ada opname mendatang.'}
            />
          </ListStateCard>
        )
      )}
    </div>
  );
};

export default UpcomingOpnameList;
