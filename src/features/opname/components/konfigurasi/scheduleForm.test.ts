import { describe, expect, it } from 'vitest';
import { emptyScheduleForm, formToScheduleConfig, scheduleFormSchema } from './scheduleForm';

describe('scheduleFormSchema', () => {
  it('menerima form default dengan nama', () => {
    const result = scheduleFormSchema.safeParse({ ...emptyScheduleForm(), nama: 'Rutin' });
    expect(result.success).toBe(true);
  });

  it('menolak nama kosong atau hanya spasi', () => {
    const result = scheduleFormSchema.safeParse({ ...emptyScheduleForm(), nama: '   ' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['nama']);
  });

  it('menolak tanggal audit di luar 1-28', () => {
    for (const dayOfMonth of [0, 29, Number.NaN]) {
      const result = scheduleFormSchema.safeParse({
        ...emptyScheduleForm(),
        nama: 'A',
        dayOfMonth,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].path).toEqual(['dayOfMonth']);
    }
  });

  it('mewajibkan minimal satu obat kalau tidak memilih semua obat', () => {
    const result = scheduleFormSchema.safeParse({
      ...emptyScheduleForm(),
      nama: 'A',
      selectAll: false,
      obatIds: [],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(['obatIds']);
  });
});

describe('formToScheduleConfig', () => {
  it('semua obat disimpan sebagai obatIds null', () => {
    const config = formToScheduleConfig({ ...emptyScheduleForm(), nama: 'A', obatIds: ['1'] });
    expect(config.obatIds).toBeNull();
    expect(config).not.toHaveProperty('selectAll');
  });

  it('obat terpilih disimpan apa adanya', () => {
    const config = formToScheduleConfig({
      ...emptyScheduleForm(),
      nama: 'A',
      selectAll: false,
      obatIds: ['1', '2'],
    });
    expect(config.obatIds).toEqual(['1', '2']);
  });
});
