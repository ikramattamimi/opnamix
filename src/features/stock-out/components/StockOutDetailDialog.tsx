import React, { useState } from 'react';
import { CircleCheck, Pencil, ReceiptText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDateTimeForDisplay } from '@/lib/format';
import { calculateRequestTotals } from '../stockOutTotals';
import { StockOutRequest } from '../types';
import RequestDrugTable from './RequestDrugTable';
import RequestInfoCards from './RequestInfoCards';
import RequestServices from './RequestServices';
import RequestSummary from './RequestSummary';
import StockOutEditForm from './StockOutEditForm';
import type { ProcessDraft } from './StockOutProcessDialog';
import { DIALOG_FOOTER, GHOST_BUTTON, PRIMARY_BUTTON } from './dialogStyles';

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
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      {/* Tombol tutup bawaan DialogContent disembunyikan; header punya tombol tutup sendiri */}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-2xl p-0 gap-0 border-none bg-card shadow-2xl flex flex-col [&>button:last-child]:hidden">
        <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/5 sticky top-0 backdrop-blur-md z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ReceiptText className="size-6 text-primary" aria-hidden />
              <DialogTitle className="text-xl font-bold leading-normal text-foreground">
                {title}
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              {request.requestId} • {formatDateTimeForDisplay(request.date)}
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Tutup"
              className="w-auto p-2 rounded-full text-current hover:text-current hover:bg-gray-200 dark:hover:bg-white/10 [&_svg]:size-6"
            >
              <X aria-hidden />
            </Button>
          </DialogClose>
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

            <div className={DIALOG_FOOTER}>
              <Button variant="ghost" onClick={onClose} className={GHOST_BUTTON}>
                Tutup
              </Button>
              {!isProcessMode && request.status === 'Menunggu' && canEdit && (
                <Button
                  variant="outline"
                  onClick={() => setIsEditMode(true)}
                  className="px-6 font-bold text-sm bg-transparent shadow-none border border-primary/20 text-primary hover:text-primary hover:bg-primary/10 hover:border-primary/20"
                >
                  <Pencil aria-hidden />
                  Edit Detail
                </Button>
              )}
              {isProcessMode && request.status === 'Menunggu' && canProcess && (
                <Button
                  onClick={() =>
                    onConfirmProcess({
                      request,
                      discount: processDiscount,
                      serviceFee: processServiceFee,
                    })
                  }
                  className={PRIMARY_BUTTON}
                >
                  <CircleCheck aria-hidden />
                  Proses Permintaan
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StockOutDetailDialog;
