import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleCheck, Eye, History, Package, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState } from '@/components/common/QueryState';
import { filterOpnames, formatDate, OpnameCard } from './format';
import { ListStateCard, OpnameSearchInput, SectionHeader } from './shared';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface OpnameHistoryListProps {
  history: OpnameCard[];
  isError: boolean;
  onRetry: () => void;
  onDelete: (id: string) => void;
}

// Opname yang sudah selesai
const OpnameHistoryList: React.FC<OpnameHistoryListProps> = ({
  history,
  isError,
  onRetry,
  onDelete,
}) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const filteredHistory = useMemo(() => filterOpnames(history, search), [history, search]);

  return (
    <div>
      <SectionHeader
        icon={History}
        iconClassName="bg-emerald-500/10 text-emerald-500"
        title="Riwayat Opname"
      />
      <OpnameSearchInput value={search} onChange={setSearch} placeholder="Cari riwayat opname..." />

      {filteredHistory.length > 0 ? (
        <div className="space-y-3">
          {filteredHistory.map((opname) => (
            <Card key={opname.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="ok">
                      <CircleCheck className="size-3" aria-hidden />
                      Selesai
                    </Badge>
                    {(opname.discrepancyCount || 0) > 0 && (
                      <Badge variant="bad">{opname.discrepancyCount} Selisih</Badge>
                    )}
                  </div>
                  <p className="font-bold text-foreground">{opname.scheduleName}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span>Dilaksanakan: {formatDate(opname.date || opname.scheduleDate)}</span>
                    <span className="hidden sm:inline">
                      Jadwal: {formatDate(opname.scheduleDate)}
                    </span>
                    <span>{opname.itemsCount} item</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => navigate(`/audit/stok-opname/detail/${opname.id}`)}
                    className="text-primary font-bold px-4 hover:bg-primary/10"
                  >
                    <Eye className="mr-1.5" aria-hidden />
                    Lihat Detail
                  </Button>
                  <Button
                    onClick={() => onDelete(opname.id)}
                    variant="ghost"
                    className="font-bold px-4 text-sm text-red-700 hover:text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    title="Hapus Opname"
                  >
                    <Trash2 className="mr-1.5" aria-hidden />
                    Hapus
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <ListStateCard>
          <ErrorState title="Gagal memuat riwayat opname" onRetry={onRetry} />
        </ListStateCard>
      ) : (
        <ListStateCard>
          <EmptyState
            icon={Package}
            title={search ? 'Tidak ada hasil yang cocok.' : 'Belum ada riwayat opname.'}
          />
        </ListStateCard>
      )}
    </div>
  );
};

export default OpnameHistoryList;
