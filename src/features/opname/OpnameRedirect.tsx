import React from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { ROUTES, opnamePath } from '@/types/routes';

// Rute lama opname (Riwayat, Konfigurasi, Pelaksanaan, Detail) dialihkan ke
// halaman Stok Opname gabungan, layar kerja, atau laporan.
const OpnameRedirect: React.FC = () => {
  const { opnameId } = useParams<{ opnameId: string }>();
  const { pathname } = useLocation();
  if (opnameId && pathname.includes('/pelaksanaan/'))
    return <Navigate to={opnamePath(opnameId, 'hitung')} replace />;
  if (opnameId && pathname.includes('/detail/'))
    return <Navigate to={opnamePath(opnameId, 'laporan')} replace />;
  return <Navigate to={ROUTES.STOK_OPNAME} replace />;
};

export default OpnameRedirect;
