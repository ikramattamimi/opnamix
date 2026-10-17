import React from 'react';
import { CircleCheck, Clock, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
        <User className="size-8 text-primary" aria-hidden />
      </div>
      <div className="flex-1">
        <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold mb-1">
          Nama Pasien
        </p>
        {onChange ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              type="text"
              value={request.patient.fullName}
              onChange={(e) =>
                onChange({ ...request, patient: { ...request.patient, fullName: e.target.value } })
              }
              className="border border-blue-200 dark:border-blue-500/20 bg-card px-4 text-sm md:text-sm font-semibold text-foreground"
              placeholder="Nama pasien"
              aria-label="Nama pasien"
            />
            <Input
              type="date"
              value={request.patient.birthDate || ''}
              aria-label="Tanggal lahir pasien"
              onChange={(e) =>
                onChange({ ...request, patient: { ...request.patient, birthDate: e.target.value } })
              }
              className="border border-blue-200 dark:border-blue-500/20 bg-card px-4 text-sm md:text-sm text-foreground"
            />
          </div>
        ) : (
          <>
            <h4 className="font-bold text-xl text-primary dark:text-blue-300">
              {request.patient.fullName}
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              Tanggal Lahir: {formatDateForDisplay(request.patient.birthDate)}
            </p>
          </>
        )}
      </div>
    </div>

    <div className="flex gap-4">
      <div className="flex-1 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800">
        <p className="text-xs uppercase font-bold text-muted-foreground mb-2">Status Permintaan</p>
        <div className="flex items-center gap-2">
          {request.status === 'Menunggu' ? (
            <Clock className="size-6 text-amber-500" aria-hidden />
          ) : (
            <CircleCheck className="size-6 text-emerald-500" aria-hidden />
          )}
          <span className="font-bold text-lg">{request.status}</span>
        </div>
      </div>
      <div className="flex-1 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800">
        <p className="text-xs uppercase font-bold text-muted-foreground mb-2">Diajukan Oleh</p>
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
            <Input
              type="text"
              value={request.requestedBy}
              onChange={(e) => onChange({ ...request, requestedBy: e.target.value })}
              aria-label="Diajukan oleh"
              className="w-full border border-gray-200 dark:border-gray-700 bg-card px-3 text-sm md:text-sm font-bold text-foreground"
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
