import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { LoadingState } from '@/components/common/QueryState';
import OpnameStepper from './components/pelaksanaan/OpnameStepper';
import { OpnameActionsBar, OpnameActionsSidebar } from './components/pelaksanaan/OpnameActions';
import { useOpnameExecution } from './components/pelaksanaan/useOpnameExecution';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/layout/PageHeader';

const PelaksanaanOpnamePage: React.FC = () => {
  const { opnameId } = useParams<{ opnameId: string }>();
  const execution = useOpnameExecution(opnameId);
  const { currentStep, isSaving } = execution;
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  // Peringatan mundur, hanya dari langkah 2 ke langkah 1
  const [showBackwardWarning, setShowBackwardWarning] = useState(false);

  if (execution.isLoading) {
    return <LoadingState label="Memuat data opname..." className="min-h-[400px]" />;
  }

  const handleFinish = () => {
    if (opnameId && execution.validateReasons()) setShowFinishConfirm(true);
  };

  const handleBackward = () => {
    if (currentStep === 2) setShowBackwardWarning(true);
  };

  const actionProps = {
    currentStep,
    isSaving,
    canContinue: currentStep !== 1 || execution.selectedIds.size > 0,
    onNext: execution.handleNextStep,
    onFinish: handleFinish,
    onSaveDraft: execution.handleSaveDraft,
    onBackward: handleBackward,
    onExit: execution.exit,
  };

  return (
    <>
      <PageLayout>
        <PageHeader
          title={`Opname — ${execution.opnameData?.scheduleName || 'Opname'}`}
          description={execution.opnameData?.opnameNumber}
        />

        <div className="md:flex md:gap-6 md:items-start">
          <div className="md:w-full space-y-6 md:flex-1">
            <OpnameStepper execution={execution} />
          </div>

          {/* Kolom tindakan, desktop saja */}
          <div className="hidden md:block md:w-[25%] sticky top-32 ">
            <div className="space-y-4">
              <OpnameActionsSidebar {...actionProps} />
            </div>
          </div>
        </div>
      </PageLayout>

      <OpnameActionsBar {...actionProps} />

      {/* Ruang kosong supaya konten tidak tertutup bar tindakan mobile */}
      <div className="sm:hidden h-28" />

      <ConfirmationModal
        isOpen={showFinishConfirm}
        title="Selesaikan Opname?"
        message="Stok akan diperbarui sesuai hasil opname. Pastikan semua data sudah benar sebelum melanjutkan. Tindakan ini tidak dapat dibatalkan."
        type="warning"
        confirmText="Ya, Selesaikan"
        onConfirm={() => {
          setShowFinishConfirm(false);
          void execution.finish();
        }}
        onCancel={() => setShowFinishConfirm(false)}
      />

      <ConfirmationModal
        isOpen={showBackwardWarning}
        title="Kembali ke Tahap 1?"
        message="⚠️ Kembali ke tahap 1 akan menghapus semua progress input stok fisik. Anda harus memilih ulang obat yang akan di-opname. Lanjutkan?"
        type="warning"
        confirmText="Ya, Kembali"
        onConfirm={() => {
          setShowBackwardWarning(false);
          void execution.confirmBackward();
        }}
        onCancel={() => setShowBackwardWarning(false)}
      />
    </>
  );
};

export default PelaksanaanOpnamePage;
