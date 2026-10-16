import React from 'react';
import { formatDateForDisplay } from '@/lib/format';
import { StockOutRequest } from '../types';

const FALLBACK_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

interface RequestInfoCardsProps {
  request: StockOutRequest;
  avatarUrl: string;
  // Diisi saat mode edit: nama pasien, tanggal lahir, dan nama nakes bisa diubah
  onChange?: (request: StockOutRequest) => void;
}

// Kartu pasien, status, dan pengaju di detail permintaan
const RequestInfoCards: React.FC<RequestInfoCardsProps> = ({ request, avatarUrl, onChange }) => (
  <>
    <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-500/20 flex gap-4 items-center">
      <div className="p-3 bg-white dark:bg-white/10 rounded-xl shadow-sm">
        <span className="material-icons-round text-primary text-3xl">person</span>
      </div>
      <div className="flex-1">
        <p className="text-sm text-text-secondary-light uppercase tracking-wider font-bold mb-1">
          Nama Pasien
        </p>
        {onChange ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={request.patient.fullName}
              onChange={(e) =>
                onChange({ ...request, patient: { ...request.patient, fullName: e.target.value } })
              }
              className="rounded-xl border border-blue-200 dark:border-blue-500/20 bg-white dark:bg-card-dark px-4 py-3 text-sm font-semibold text-text-primary-light dark:text-white"
              placeholder="Nama pasien"
            />
            <input
              type="date"
              value={request.patient.birthDate || ''}
              onChange={(e) =>
                onChange({ ...request, patient: { ...request.patient, birthDate: e.target.value } })
              }
              className="rounded-xl border border-blue-200 dark:border-blue-500/20 bg-white dark:bg-card-dark px-4 py-3 text-sm text-text-primary-light dark:text-white"
            />
          </div>
        ) : (
          <>
            <h4 className="font-bold text-xl text-primary dark:text-blue-300">
              {request.patient.fullName}
            </h4>
            <p className="text-sm text-text-secondary-light mt-1">
              Tanggal Lahir: {formatDateForDisplay(request.patient.birthDate)}
            </p>
          </>
        )}
      </div>
    </div>

    <div className="flex gap-4">
      <div className="flex-1 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800">
        <p className="text-xs uppercase font-bold text-text-secondary-light mb-2">
          Status Permintaan
        </p>
        <div className="flex items-center gap-2">
          <span
            className={`material-icons-round ${request.status === 'Menunggu' ? 'text-amber-500' : 'text-emerald-500'}`}
          >
            {request.status === 'Menunggu' ? 'schedule' : 'check_circle'}
          </span>
          <span className="font-bold text-lg">{request.status}</span>
        </div>
      </div>
      <div className="flex-1 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800">
        <p className="text-xs uppercase font-bold text-text-secondary-light mb-2">Diajukan Oleh</p>
        <div className="flex items-center gap-2">
          <img
            src={avatarUrl}
            className="size-8 rounded-full"
            alt=""
            onError={(e) => {
              e.currentTarget.src = FALLBACK_AVATAR;
            }}
          />
          {onChange ? (
            <input
              type="text"
              value={request.requestedBy}
              onChange={(e) => onChange({ ...request, requestedBy: e.target.value })}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-card-dark px-3 py-2 text-sm font-bold text-text-primary-light dark:text-white"
            />
          ) : (
            <span className="font-bold">{request.requestedBy}</span>
          )}
        </div>
      </div>
    </div>
  </>
);

export default RequestInfoCards;
