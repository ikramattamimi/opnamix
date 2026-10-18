import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useOpname, useOpnameDetailView } from './useOpname';
import { LoadingState } from '@/components/common/QueryState';
import OpnameInfoPanel from './components/detail/OpnameInfoPanel';
import AdjustmentJournal from './components/detail/AdjustmentJournal';
import { PageHeader } from '@/components/layout/PageHeader';
import { ROUTES } from '@/types/routes';

const DetailOpnamePage: React.FC = () => {
  const { opnameId } = useParams<{ opnameId: string }>();
  const detailQuery = useOpnameDetailView(opnameId);
  const opnameQuery = useOpname(opnameId);

  const details = useMemo(() => detailQuery.data ?? [], [detailQuery.data]);
  const opnameInfo = opnameQuery.data;
  const isLoading = detailQuery.isLoading || opnameQuery.isLoading;

  if (isLoading) {
    return (
      <>
        <PageHeader back={ROUTES.RIWAYAT_OPNAME} />
        <LoadingState label="Memuat data..." className="min-h-[400px]" />
      </>
    );
  }

  const totalItems = details.length;
  const discrepancies = details.filter((d) => d.selisih !== 0).length;
  const matched = totalItems - discrepancies;

  return (
    <div className="space-y-6 mx-auto">
      <PageHeader
        title={opnameInfo?.opnameNumber ? `Detail Opname ${opnameInfo.opnameNumber}` : undefined}
        back={ROUTES.RIWAYAT_OPNAME}
        stats={[{ label: 'Status', value: 'Selesai', tone: 'ok' }]}
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
    </div>
  );
};

export default DetailOpnamePage;
