import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CircleCheck } from 'lucide-react';
import { useOpname, useOpnameDetailView } from './useOpname';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/common/QueryState';
import OpnameInfoPanel from './components/detail/OpnameInfoPanel';
import AdjustmentJournal from './components/detail/AdjustmentJournal';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';

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
    <PageLayout>
      <PageHeader
        title="Detail Opname"
        description={opnameInfo?.opnameNumber || undefined}
        leading={
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/audit/stok-opname/riwayat')}
            aria-label="Kembali ke riwayat opname"
            className="shrink-0 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors bg-card shadow-soft text-muted-foreground [&_svg]:size-6"
          >
            <ArrowLeft aria-hidden />
          </Button>
        }
        actions={
          <Badge variant="success">
            <CircleCheck className="size-3" aria-hidden />
            Selesai
          </Badge>
        }
      />

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
    </PageLayout>
  );
};

export default DetailOpnamePage;
