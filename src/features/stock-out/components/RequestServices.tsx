import React from 'react';
import type { Service } from '@/features/services/types';
import { RequestedService } from '../types';

interface RequestServicesProps {
  selected: RequestedService[];
  // Diisi saat mode edit: semua jasa ditampilkan sebagai pilihan
  edit?: {
    services: Service[];
    onToggle: (serviceId: string) => void;
  };
}

const SectionTitle: React.FC = () => (
  <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
    <span className="material-icons-round text-primary">medical_services</span>
    Layanan Tambahan
  </h4>
);

// Layanan tambahan di detail permintaan
const RequestServices: React.FC<RequestServicesProps> = ({ selected, edit }) => {
  if (edit) {
    return (
      <div>
        <SectionTitle />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {edit.services.map((service) => {
            const checked = selected.some((item) => item.id === service.id);
            return (
              <label
                key={service.id}
                className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                  checked
                    ? 'border-primary bg-primary/5 dark:bg-primary/10'
                    : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => edit.onToggle(service.id)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="font-medium text-text-primary-light dark:text-white">
                    {service.name}
                  </span>
                </div>
                <span className="text-sm font-bold text-primary dark:text-blue-300">
                  Rp {service.price.toLocaleString('id-ID')}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  if (selected.length === 0) return null;

  return (
    <div>
      <SectionTitle />
      <div className="flex flex-col gap-2">
        {selected.map((svc, i) => (
          <div
            key={i}
            className="flex justify-between items-center p-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-white/5"
          >
            <span className="font-bold text-sm text-text-primary-light dark:text-white">
              {svc.name}
            </span>
            <span className="font-bold text-sm text-primary dark:text-blue-300">
              Rp {(svc.price || 0).toLocaleString('id-ID')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RequestServices;
