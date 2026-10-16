import React, { useState } from 'react';
import { formatDateTimeForDisplay } from '@/lib/format';
import { calculateRequestTotals } from '../stockOutTotals';
import { StockOutRequest } from '../types';
import RequestDrugTable from './RequestDrugTable';
import RequestInfoCards from './RequestInfoCards';
import RequestServices from './RequestServices';
import RequestSummary from './RequestSummary';
import StockOutEditForm from './StockOutEditForm';
import type { ProcessDraft } from './StockOutProcessDialog';

export type DetailMode = 'view' | 'process';

interface StockOutDetailDialogProps {
  request: StockOutRequest;
  mode: DetailMode;
  canEdit: boolean;
  canProcess: boolean;
  onClose: () => void;
  onRequestUpdated: (request: StockOutRequest) => void;
  onConfirmProcess: (draft: ProcessDraft) => void;
}

// Detail permintaan: mode lihat, mode proses (diskon dan biaya layanan), dan mode edit
const StockOutDetailDialog: React.FC<StockOutDetailDialogProps> = ({
  request,
  mode,
  canEdit,
  canProcess,
  onClose,
  onRequestUpdated,
  onConfirmProcess,
}) => {
  const isProcessMode = mode === 'process';
  const [isEditMode, setIsEditMode] = useState(false);
  const [processDiscount, setProcessDiscount] = useState(request.discount || 0);
  const [processServiceFee, setProcessServiceFee] = useState(request.serviceFee || 0);

  const totals = calculateRequestTotals(
    request,
    isProcessMode ? { discount: processDiscount, serviceFee: processServiceFee } : {},
  );

  const title = isProcessMode
    ? 'Proses Permintaan'
    : isEditMode
      ? 'Edit Detail Permintaan'
      : 'Detail Permintaan';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-card-dark w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col animate-scaleUp">
        <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/5 sticky top-0 backdrop-blur-md z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-icons-round text-primary">receipt_long</span>
              <h3 className="text-xl font-bold text-text-primary-light dark:text-white">{title}</h3>
            </div>
            <p className="text-sm text-text-secondary-light">
              {request.requestId} • {formatDateTimeForDisplay(request.date)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors"
          >
            <span className="material-icons-round">close</span>
          </button>
        </div>

        {isEditMode ? (
          <StockOutEditForm
            request={request}
            onCancel={() => setIsEditMode(false)}
            onSaved={(updated) => {
              onRequestUpdated(updated);
              setIsEditMode(false);
            }}
          />
        ) : (
          <>
            <div className="p-6 space-y-6">
              <RequestInfoCards request={request} avatarUrl={request.requestedByAvatar} />
              <RequestDrugTable drugs={request.drugs} />
              <RequestServices selected={request.services} />
              <RequestSummary
                totals={totals}
                onServiceFeeChange={isProcessMode ? setProcessServiceFee : undefined}
                onDiscountChange={isProcessMode ? setProcessDiscount : undefined}
              />
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3 bg-gray-50/50 dark:bg-white/5 rounded-b-3xl">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl font-bold text-text-secondary-light hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                Tutup
              </button>
              {!isProcessMode && request.status === 'Menunggu' && canEdit && (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="px-6 py-2.5 rounded-xl font-bold border border-primary/20 text-primary hover:bg-primary/10 transition-colors flex items-center gap-2"
                >
                  <span className="material-icons-round text-sm">edit</span>
                  Edit Detail
                </button>
              )}
              {isProcessMode && request.status === 'Menunggu' && canProcess && (
                <button
                  onClick={() =>
                    onConfirmProcess({
                      request,
                      discount: processDiscount,
                      serviceFee: processServiceFee,
                    })
                  }
                  className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/30 hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <span className="material-icons-round text-sm">check_circle</span>
                  Proses Permintaan
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StockOutDetailDialog;
