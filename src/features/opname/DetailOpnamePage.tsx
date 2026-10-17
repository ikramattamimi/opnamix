import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CircleCheck } from 'lucide-react';
import { useOpname, useOpnameDetailView } from './useOpname';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/common/QueryState';
import OpnameInfoPanel from './components/detail/OpnameInfoPanel';
import AdjustmentJournal from './components/detail/AdjustmentJournal';

const DetailOpnamePage: React.FC = () => {
  const { opnameId } = useParams<{ opnameId: string }>();
  const navigate = useNavigate();
  const detailQuery = useOpnameDetailView(opnameId);
  const opnameQuery = useOpname(opnameId);

  const details = useMemo(() => detailQuery.data ?? [], [detailQuery.data]);
  const opnameInfo = opnameQuery.data;
  const isLoading = detailQuery.isLoading || opnameQuery.isLoading;

  if (isLoading) {
    return <LoadingState label="Memuat data..." className="min-h-[400px]" />;
  }

  const totalItems = details.length;
  const discrepancies = details.filter((d) => d.selisih !== 0).length;
  const matched = totalItems - discrepancies;

  return (
    <div className="space-y-6 mx-auto">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/audit/stok-opname/riwayat')}
          aria-label="Kembali ke riwayat opname"
          className="h-auto w-auto p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors bg-card shadow-soft text-muted-foreground [&_svg]:size-6"
        >
          <ArrowLeft aria-hidden />
        </Button>
        <div>
          <h2 className="text-xl font-bold">Detail Opname</h2>
          <p className="text-sm text-muted-foreground">{opnameInfo?.opnameNumber || ''}</p>
        </div>
        <span className="ml-auto text-xs font-bold px-3 py-1.5 bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-xl flex items-center gap-1">
          <CircleCheck className="size-3" aria-hidden />
          Selesai
        </span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-[30%] space-y-4">
          <OpnameInfoPanel
            opname={opnameInfo}
            totalItems={totalItems}
            matched={matched}
            discrepancies={discrepancies}
          />
        </div>
        <div className="lg:w-[70%]">
          <AdjustmentJournal
            rows={details}
            isError={detailQuery.isError}
            onRetry={() => void detailQuery.refetch()}
          />
        </div>
      </div>
    </div>
  );
};

export default DetailOpnamePage;
