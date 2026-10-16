import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { OpnameLockInfo } from './useOpnameLock';
import { api } from '@/lib/api';
import { useAuth } from '@/features/auth/useAuth';
import { toDate } from '@/lib/utils';

interface OpnameLockPageProps {
  opname: OpnameLockInfo;
  onRefresh: () => void;
}

const OpnameLockPage: React.FC<OpnameLockPageProps> = ({ opname, onRefresh }) => {
  const { userProfile } = useAuth();
  const userRoles = userProfile?.roles ?? (userProfile?.role ? [userProfile.role] : []);
  const navigate = useNavigate();
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
    try {
      const result = await api.getActiveOpnameLock();
      if (!result.isLocked) {
        setIsComplete(true);
      }
      onRefresh();
    } catch (error) {
      console.error('Failed to check status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleReload = () => {
    window.location.reload();
  };

  const handleContinueOpname = () => {
    navigate(`/audit/stok-opname/pelaksanaan/${opname.id}`);
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="bg-card-light dark:bg-card-dark rounded-3xl p-8 md:p-12 shadow-soft text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            {isNakes ? (
              <div className="w-24 h-24 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center">
                <span className="material-icons-round text-amber-500 text-5xl">
                  hourglass_empty
                </span>
              </div>
            ) : (
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="material-icons-round text-primary text-5xl">lock</span>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {isNakes ? 'Opname Sedang Berlangsung' : 'Opname Sedang Berlangsung'}
            </h1>
            <p className="text-text-secondary-light text-sm md:text-base">
              {isNakes
                ? 'Mohon menunggu. Opname sedang dilakukan oleh tim farmasi.'
                : `Opname ${opname.opnameNumber} sedang dilaksanakan.`}
            </p>
          </div>

          {/* Progress Info */}
          <div className="bg-background-light dark:bg-background-dark rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary-light">Kode Opname</span>
              <span className="font-bold">{opname.opnameNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary-light">Tahap Saat Ini</span>
              <span className="font-bold text-primary">
                {opname.currentStep}/3 - {getStepLabel(opname.currentStep)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary-light">Dimulai</span>
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
                className="w-full font-bold rounded-xl h-auto py-4 text-base"
              >
                <span className="material-icons-round mr-2">play_arrow</span>
                Lanjutkan Opname
              </Button>
            )}

            {isNakes && (
              <>
                <Button
                  onClick={handleCheckStatus}
                  disabled={isChecking}
                  variant="outline"
                  className="w-full font-bold rounded-xl h-auto py-4 text-base"
                >
                  {isChecking ? (
                    <>
                      <span className="material-icons-round mr-2 animate-spin">refresh</span>
                      Mengecek...
                    </>
                  ) : (
                    <>
                      <span className="material-icons-round mr-2">sync</span>
                      Cek Status Opname
                    </>
                  )}
                </Button>

                {isComplete && (
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-500 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                      <span className="material-icons-round">check_circle</span>
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
              <span className="material-icons-round text-amber-500 text-xl flex-shrink-0">
                warning
              </span>
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
