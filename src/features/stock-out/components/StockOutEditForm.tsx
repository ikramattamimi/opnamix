import React, { useState } from 'react';
import { useToast } from '@/components/ui/toast';
import { useProducts } from '@/features/products/useProducts';
import { useServices } from '@/features/services/useServices';
import { withErrorDetail } from '@/lib/utils';
import {
  addDrug,
  cloneRequest,
  removeDrug,
  toggleService,
  updateDrug,
  validateRequestEdit,
} from '../requestItems';
import { calculateRequestTotals } from '../stockOutTotals';
import { StockOutRequest } from '../types';
import { useUpdateStockOutRequest } from '../useStockOut';
import RequestDrugTable from './RequestDrugTable';
import RequestInfoCards from './RequestInfoCards';
import RequestServices from './RequestServices';
import RequestSummary from './RequestSummary';

interface StockOutEditFormProps {
  request: StockOutRequest;
  onCancel: () => void;
  onSaved: (request: StockOutRequest) => void;
}

// Mode edit di detail permintaan (isi body dan footer dialog)
const StockOutEditForm: React.FC<StockOutEditFormProps> = ({ request, onCancel, onSaved }) => {
  const { showToast } = useToast();
  const { data: productData } = useProducts({ page: 1, perPage: 1000 });
  const products = productData?.data || [];
  const { data: serviceData } = useServices({ page: 1, perPage: 1000 });
  const services = serviceData?.data || [];
  const updateRequestMutation = useUpdateStockOutRequest();

  const [draft, setDraft] = useState(() => cloneRequest(request));
  const totals = calculateRequestTotals(draft);

  const handleAddDrug = () => {
    const fallbackProduct = products[0];
    if (!fallbackProduct) return;
    setDraft((prev) => addDrug(prev, fallbackProduct, `tmp-${Date.now()}`));
  };

  const handleSave = async () => {
    if (updateRequestMutation.isPending) return;

    const validationError = validateRequestEdit(draft);
    if (validationError) {
      showToast(validationError, 'error');
      return;
    }

    try {
      await updateRequestMutation.mutateAsync({
        number: request.id,
        payload: {
          tanggal: draft.date,
          nama_pasien: draft.patient.fullName,
          tanggal_lahir_pasien: draft.patient.birthDate,
          nama_nakes: draft.requestedBy,
          total: totals.grandTotal,
          diskon: draft.discount ?? 0,
          serviceFee: draft.serviceFee ?? 0,
          items: draft.drugs.map((drug) => ({
            productId: drug.productId,
            quantity: drug.quantity,
            price: drug.price || 0,
          })),
          services: draft.services.map((service) => ({
            serviceId: service.id,
            price: service.price,
          })),
        },
      });

      onSaved({ ...draft, totalAmount: totals.grandTotal });
      showToast('Detail permintaan berhasil diperbarui.', 'success');
    } catch (error) {
      console.error('Error updating stock out request:', error);
      showToast(withErrorDetail('Gagal menyimpan perubahan detail permintaan', error), 'error');
    }
  };

  return (
    <>
      <div className="p-6 space-y-6">
        <RequestInfoCards
          request={draft}
          avatarUrl={request.requestedByAvatar}
          onChange={setDraft}
        />
        <RequestDrugTable
          drugs={draft.drugs}
          edit={{
            products,
            onChange: (drugId, field, value) =>
              setDraft((prev) => updateDrug(prev, drugId, field, value, products)),
            onAdd: handleAddDrug,
            onRemove: (drugId) => setDraft((prev) => removeDrug(prev, drugId)),
          }}
        />
        <RequestServices
          selected={draft.services}
          edit={{
            services,
            onToggle: (serviceId) => setDraft((prev) => toggleService(prev, serviceId, services)),
          }}
        />
        <RequestSummary
          totals={totals}
          onServiceFeeChange={(serviceFee) => setDraft((prev) => ({ ...prev, serviceFee }))}
          onDiscountChange={(discount) => setDraft((prev) => ({ ...prev, discount }))}
        />
      </div>

      <div className="p-6 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3 bg-gray-50/50 dark:bg-white/5 rounded-b-3xl">
        <button
          onClick={onCancel}
          className="px-6 py-2.5 rounded-xl font-bold text-text-secondary-light hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
        >
          Batal
        </button>
        <button
          onClick={handleSave}
          disabled={updateRequestMutation.isPending}
          className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/30 hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <span className="material-icons-round text-sm">
            {updateRequestMutation.isPending ? 'refresh' : 'save'}
          </span>
          {updateRequestMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </>
  );
};

export default StockOutEditForm;
