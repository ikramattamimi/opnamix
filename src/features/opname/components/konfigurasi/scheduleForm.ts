import { z } from 'zod';
import { OpnameSchedule, OpnameScheduleConfig } from '../../types';

// Skema form jadwal opname. Dipakai oleh form dan dicek ulang sebelum
// memanggil API simpan jadwal.
export const scheduleFormSchema = z
  .object({
    nama: z.string().trim().min(1, 'Nama jadwal wajib diisi'),
    pengulangan: z.enum(['BULANAN', 'TRIWULAN', 'TAHUNAN']),
    dayOfMonth: z
      .number({ error: 'Tanggal audit wajib diisi' })
      .int('Tanggal audit harus bilangan bulat')
      .min(1, 'Tanggal audit antara 1 dan 28')
      .max(28, 'Tanggal audit antara 1 dan 28'),
    // Tidak tampil di form, dipertahankan dari jadwal yang diedit
    waktuJam: z.number(),
    waktuMenit: z.number(),
    durasiPengerjaan: z.number(),
    // true = semua obat (obat_ids null)
    selectAll: z.boolean(),
    obatIds: z.array(z.string()),
  })
  .refine((v) => v.selectAll || v.obatIds.length > 0, {
    message: 'Pilih minimal satu obat',
    path: ['obatIds'],
  });

export type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

// Field yang ada di langkah 1 dialog (info jadwal)
export const INFO_FIELDS = ['nama', 'pengulangan', 'dayOfMonth'] as const;

export const emptyScheduleForm = (): ScheduleFormValues => ({
  nama: '',
  pengulangan: 'BULANAN',
  dayOfMonth: 28,
  waktuJam: 10,
  waktuMenit: 0,
  durasiPengerjaan: 7,
  selectAll: true,
  obatIds: [],
});

export const scheduleToForm = (schedule: OpnameSchedule): ScheduleFormValues => ({
  nama: schedule.nama,
  pengulangan: schedule.pengulangan,
  // Jadwal tersimpan selalu punya nilai ini karena diisi dari form
  dayOfMonth: schedule.tanggalAudit as number,
  waktuJam: schedule.waktuJam as number,
  waktuMenit: schedule.waktuMenit as number,
  durasiPengerjaan: schedule.durasiPengerjaan || 7,
  selectAll: schedule.obatIds === null,
  obatIds: schedule.obatIds ?? [],
});

// Nilai form yang sudah lolos skema → konfigurasi untuk API
export const formToScheduleConfig = ({
  selectAll,
  obatIds,
  ...rest
}: ScheduleFormValues): OpnameScheduleConfig => ({
  ...rest,
  obatIds: selectAll ? null : obatIds,
});
