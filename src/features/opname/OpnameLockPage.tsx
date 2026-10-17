import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CircleCheck,
  Hourglass,
  Loader2,
  Lock,
  Play,
  RefreshCw,
  TriangleAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OpnameLockInfo, useActiveOpnameLock } from './useActiveOpnameLock';
import { useAuth } from '@/features/auth/useAuth';
import { toDate } from '@/lib/utils';

interface OpnameLockPageProps {
  opname: OpnameLockInfo;
}

const OpnameLockPage: React.FC<OpnameLockPageProps> = ({ opname }) => {
  const { userProfile } = useAuth();
  const userRoles = userProfile?.roles ?? (userProfile?.role ? [userProfile.role] : []);
  const navigate = useNavigate();
  // Query yang sama dengan AuthenticatedApp, jadi hasil cek langsung dipakai di sana
  const { refetch: refetchLock } = useActiveOpnameLock();
  const [isChecking, setIsChecking] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const isAdmin = userRoles.includes('admin');
  const isFarmasi = userRoles.includes('apoteker') || userRoles.includes('farmasi');
  const isNakes = userRoles.includes('nakes');

  const getStepLabel = (step: number) => {
    switch (step) {
      case 1:
        return 'Pemilihan Obat';
      case 2:
        return 'Input Stok Fisik';
      case 3:
        return 'Penyesuaian Stok';
      default:
        return 'Unknown';
    }
  };

  const handleCheckStatus = async () => {
    setIsChecking(true);
    const result = await refetchLock();
    if (result.isError) {
      console.error('Failed to check status:', result.error);
    } else if (result.data && !result.data.isLocked) {
      setIsComplete(true);
    }
    setIsChecking(false);
  };

  const handleReload = () => {
    window.location.reload();
  };

  const handleContinueOpname = () => {
    navigate(`/audit/stok-opname/pelaksanaan/${opname.id}`);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="bg-card rounded-3xl p-8 md:p-12 shadow-soft text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            {isNakes ? (
              <div className="w-24 h-24 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center">
                <Hourglass className="size-12 text-amber-500" aria-hidden />
              </div>
            ) : (
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                <Lock className="size-12 text-primary" aria-hidden />
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {isNakes ? 'Opname Sedang Berlangsung' : 'Opname Sedang Berlangsung'}
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              {isNakes
                ? 'Mohon menunggu. Opname sedang dilakukan oleh tim farmasi.'
                : `Opname ${opname.opnameNumber} sedang dilaksanakan.`}
            </p>
          </div>

          {/* Progress Info */}
          <div className="bg-background rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Kode Opname</span>
              <span className="font-bold">{opname.opnameNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tahap Saat Ini</span>
              <span className="font-bold text-primary">
                {opname.currentStep}/3 - {getStepLabel(opname.currentStep)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Dimulai</span>
              <span className="font-bold">
                {toDate(opname.startedAt).toLocaleString('id-ID', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {(isAdmin || isFarmasi) && (
              <Button
                onClick={handleContinueOpname}
                className="w-full font-bold rounded-xl h-auto py-4 text-base [&_svg]:size-6"
              >
                <Play className="mr-2" aria-hidden />
                Lanjutkan Opname
              </Button>
            )}

            {isNakes && (
              <>
                <Button
                  onClick={handleCheckStatus}
                  disabled={isChecking}
                  variant="outline"
                  className="w-full font-bold rounded-xl h-auto py-4 text-base [&_svg]:size-6"
                >
                  {isChecking ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" aria-hidden />
                      Mengecek...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2" aria-hidden />
                      Cek Status Opname
                    </>
                  )}
                </Button>

                {isComplete && (
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-500 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <CircleCheck className="size-6" aria-hidden />
                      <p className="font-bold">Opname Telah Selesai!</p>
                    </div>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                      Aplikasi sudah bisa digunakan kembali.
                    </p>
                    <Button
                      onClick={handleReload}
                      className="w-full font-bold rounded-xl h-auto py-3 bg-emerald-500 hover:bg-emerald-600"
                    >
                      Muat Ulang Aplikasi
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Warning Note */}
          <div className="bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 rounded-xl p-4 text-left">
            <div className="flex gap-3">
              <TriangleAlert className="size-5 text-amber-500 flex-shrink-0" aria-hidden />
              <div className="text-sm text-amber-700 dark:text-amber-300">
                {isAdmin && (
                  <>
                    <p className="font-bold mb-1">Menu Lain Dikunci</p>
                    <p>
                      Menu lain dikunci untuk menjaga integritas data. Hanya menu Opname yang dapat
                      diakses.
                    </p>
                  </>
                )}
                {isFarmasi && (
                  <>
                    <p className="font-bold mb-1">Aplikasi Dikunci</p>
                    <p>
                      Aplikasi dikunci untuk mencegah perubahan data obat. Silakan selesaikan opname
                      terlebih dahulu.
                    </p>
                  </>
                )}
                {isNakes && (
                  <>
                    <p className="font-bold mb-1">Mohon Bersabar</p>
                    <p>
                      Aplikasi akan kembali normal setelah opname selesai. Estimasi: ~15-30 menit.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpnameLockPage;
