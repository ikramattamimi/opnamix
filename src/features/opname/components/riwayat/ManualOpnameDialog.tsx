import React, { useMemo, useState } from 'react';
import { Loader2, Zap } from 'lucide-react';
import { useStartOpname } from '../../useOpname';
import { useOpnameSchedules } from '../../useOpnameSchedules';
import { useOpnameProducts } from '../../useOpnameProducts';
import { OpnameSchedule } from '../../types';
import { Product } from '@/features/products/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { LoadingState } from '@/components/common/QueryState';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const NO_SCHEDULES: OpnameSchedule[] = [];
const today = () => new Date().toISOString().split('T')[0];

interface ManualOpnameDialogProps {
  open: boolean;
  onClose: () => void;
}

// Buat opname manual dari jadwal yang dipilih. Isi form direset setiap kali
// dialog dibuka karena komponen ini di-mount ulang oleh halaman.
const ManualOpnameDialog: React.FC<ManualOpnameDialogProps> = ({ open, onClose }) => {
  const { showToast } = useToast();
  const startOpname = useStartOpname();
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [manualDate, setManualDate] = useState(today);
  const [isCreating, setIsCreating] = useState(false);

  // Jadwal dan obat baru diambil saat dibutuhkan oleh dialog
  const schedulesQuery = useOpnameSchedules({ enabled: open });
  const allSchedules = schedulesQuery.data ?? NO_SCHEDULES;
  const productsQuery = useOpnameProducts({ enabled: !!selectedScheduleId });
  const isLoadingProducts = productsQuery.isLoading;
  const scheduleProducts = useMemo<Product[]>(() => {
    const products = productsQuery.data?.data;
    if (!selectedScheduleId || !products) return [];
    const schedule = allSchedules.find((s) => s.id === selectedScheduleId);
    if (schedule?.obatIds === null) return products;
    if (schedule?.obatIds && Array.isArray(schedule.obatIds)) {
      const idSet = new Set(schedule.obatIds.map(String));
      return products.filter((p) => idSet.has(String(p.id)));
    }
    return [];
  }, [selectedScheduleId, allSchedules, productsQuery.data]);

  const handleCreate = async () => {
    if (!selectedScheduleId || !manualDate) return;
    setIsCreating(true);
    try {
      // Detail dibuat setelah user memilih obat di langkah 1
      await startOpname.mutateAsync({ scheduleId: selectedScheduleId, date: manualDate });
      onClose();
      showToast(
        'Opname berhasil dibuat. Silakan pilih opname dari daftar untuk melanjutkan.',
        'success',
      );
    } catch (error) {
      console.error('Failed to create manual opname:', error);
      showToast('Gagal membuat opname. Silahkan coba lagi.', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[500px] bg-card rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-lg font-bold">Buat Opname Manual</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Pilih jadwal opname dan tentukan tanggal pelaksanaan. Obat yang akan di-opname diambil
            dari jadwal yang dipilih.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="manual-schedule" className="text-sm font-bold opacity-60">
              Pilih Jadwal Opname
            </Label>
            <Select value={selectedScheduleId} onValueChange={setSelectedScheduleId}>
              <SelectTrigger
                id="manual-schedule"
                className="h-auto w-full bg-background border-none rounded-xl px-4 py-3 text-sm font-medium"
              >
                <SelectValue placeholder="— Pilih jadwal —" />
              </SelectTrigger>
              <SelectContent>
                {allSchedules.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nama} (Tgl {s.tanggalAudit},{' '}
                    {s.obatIds === null ? 'Semua Obat' : `${s.obatIds.length} obat`})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-date" className="text-sm font-bold opacity-60">
              Tanggal Pelaksanaan
            </Label>
            <Input
              id="manual-date"
              type="date"
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
              className="h-auto w-full bg-background border-none rounded-xl px-4 py-3 text-sm md:text-sm font-medium"
            />
            <p className="text-xs text-muted-foreground">
              Anda dapat memilih tanggal di luar jadwal yang sudah ditentukan.
            </p>
          </div>

          {selectedScheduleId && (
            <div className="space-y-2">
              <p className="text-sm font-bold opacity-60">
                Obat yang Akan Di-Opname
                {!isLoadingProducts && (
                  <span className="ml-1 text-primary">({scheduleProducts.length} obat)</span>
                )}
              </p>
              {isLoadingProducts ? (
                <LoadingState label="Memuat obat..." className="py-4" />
              ) : (
                <div className="max-h-[200px] overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-800 p-2 space-y-0.5">
                  {scheduleProducts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-background text-sm"
                    >
                      <span className="font-bold truncate flex-1">{p.name}</span>
                    </div>
                  ))}
                  {scheduleProducts.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4 italic">
                      Tidak ada obat pada jadwal ini.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="px-6 pb-6 pt-2 gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="font-bold rounded-xl px-4 h-auto py-2.5"
          >
            Batal
          </Button>
          <Button
            onClick={handleCreate}
            disabled={
              !selectedScheduleId || !manualDate || scheduleProducts.length === 0 || isCreating
            }
            className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl px-6 h-auto py-2.5 shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-1.5 animate-spin" aria-hidden />
                Membuat...
              </>
            ) : (
              <>
                <Zap className="mr-1.5" aria-hidden />
                Buat Opname
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManualOpnameDialog;
