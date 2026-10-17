import React from 'react';
import { ArrowLeft, ArrowRight, BadgeCheck, Info, LogOut, Save, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OpnameActionsProps {
  currentStep: number;
  isSaving: boolean;
  // Langkah 1 tidak bisa dilanjutkan tanpa obat yang dipilih
  canContinue: boolean;
  onNext: () => void;
  onFinish: () => void;
  onSaveDraft: () => void;
  onBackward: () => void;
  onExit: () => void;
}

const STEP_HINTS: Record<number, string> = {
  1: 'Pilih produk yang akan di-opname',
  2: 'Input jumlah stok fisik hasil penghitungan',
  3: 'Review dan selesaikan penyesuaian stok',
};

// Kartu tindakan di kolom kanan (desktop)
export const OpnameActionsSidebar: React.FC<OpnameActionsProps> = ({
  currentStep,
  isSaving,
  canContinue,
  onNext,
  onFinish,
  onSaveDraft,
  onBackward,
  onExit,
}) => (
  <div className="bg-card rounded-2xl p-6 shadow-soft">
    <h3 className="text-base font-bold mb-2 flex items-center gap-2">
      <Zap className="size-5 text-primary" aria-hidden />
      Tindakan
    </h3>

    <div className="space-y-3">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl p-4 border border-blue-100 dark:border-blue-900">
        <div className="flex items-start gap-3">
          <Info className="size-5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
          <div>
            <p className="text-xs font-bold text-blue-900 dark:text-blue-300 mb-1">
              Tahap {currentStep}/3
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
              {STEP_HINTS[currentStep]}
            </p>
          </div>
        </div>
      </div>

      {currentStep < 3 ? (
        <Button
          size="lg"
          onClick={onNext}
          disabled={!canContinue || isSaving}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 disabled:bg-gray-300"
        >
          <ArrowRight className="mr-2" aria-hidden />
          {isSaving ? 'Memproses...' : 'Lanjutkan'}
        </Button>
      ) : (
        <Button
          size="lg"
          onClick={onFinish}
          disabled={isSaving}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20 disabled:bg-gray-300"
        >
          <BadgeCheck className="mr-2" aria-hidden />
          {isSaving ? 'Memproses...' : 'Selesaikan Opname'}
        </Button>
      )}

      <Button
        variant="ghost"
        onClick={onSaveDraft}
        disabled={isSaving}
        className="w-full font-bold border-2 border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary"
      >
        <Save className="mr-2" aria-hidden />
        {isSaving ? 'Menyimpan...' : 'Simpan Draft'}
      </Button>

      <div className="border-t border-gray-100 dark:border-gray-800 my-4"></div>

      {/* Kembali hanya tersedia di langkah 2 */}
      {currentStep === 2 && (
        <Button
          variant="ghost"
          onClick={onBackward}
          disabled={isSaving}
          className="w-full font-bold hover:bg-gray-50 dark:hover:bg-white/5"
        >
          <ArrowLeft className="mr-2" aria-hidden />
          Kembali
        </Button>
      )}

      <Button
        variant="ghost"
        onClick={onExit}
        className="w-full font-bold text-red-700 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
      >
        <LogOut className="mr-2" aria-hidden />
        Keluar
      </Button>
    </div>
  </div>
);

// Bar tindakan yang menempel di bawah layar (mobile)
export const OpnameActionsBar: React.FC<OpnameActionsProps> = ({
  currentStep,
  isSaving,
  canContinue,
  onNext,
  onFinish,
  onSaveDraft,
  onBackward,
  onExit,
}) => (
  <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-gray-100 dark:border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-4 py-3 space-y-2.5">
    <div className="flex gap-2">
      {currentStep < 3 ? (
        <Button
          size="lg"
          onClick={onNext}
          disabled={!canContinue || isSaving}
          className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 disabled:bg-gray-300"
        >
          {isSaving ? 'Memproses...' : 'Lanjutkan'}
          <ArrowRight className="ml-1.5" aria-hidden />
        </Button>
      ) : (
        <Button
          size="lg"
          onClick={onFinish}
          disabled={isSaving}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20 disabled:bg-gray-300"
        >
          <BadgeCheck className="mr-1.5" aria-hidden />
          {isSaving ? 'Memproses...' : 'Selesaikan Opname'}
        </Button>
      )}
    </div>

    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">
        {currentStep === 2 && (
          <Button
            variant="ghost"
            onClick={onBackward}
            disabled={isSaving}
            className="font-bold px-3 text-xs"
          >
            <ArrowLeft className="mr-0.5" aria-hidden />
            Kembali
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={onExit}
          className="font-bold px-3 text-xs text-muted-foreground"
        >
          Keluar
        </Button>
      </div>
      <Button
        variant="ghost"
        onClick={onSaveDraft}
        disabled={isSaving}
        className="font-bold px-3 text-xs border border-gray-200 dark:border-gray-700"
      >
        <Save className="mr-1" aria-hidden />
        {isSaving ? 'Menyimpan...' : 'Draft'}
      </Button>
    </div>
  </div>
);
