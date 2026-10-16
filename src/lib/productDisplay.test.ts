import { describe, expect, it } from 'vitest';
import { getDisplayNameFromMasterObat } from './productDisplay';

describe('getDisplayNameFromMasterObat', () => {
  it('obat memakai "merek - kandungan"', () => {
    expect(
      getDisplayNameFromMasterObat({
        nama: 'PCT',
        jenis: 'Obat',
        merek: 'Sanmol',
        kandungan: 'Paracetamol 500mg',
      }),
    ).toBe('Sanmol - Paracetamol 500mg');
  });

  it('obat dengan salah satu dari merek/kandungan memakai yang ada', () => {
    expect(
      getDisplayNameFromMasterObat({
        nama: 'PCT',
        jenis: 'Obat',
        merek: ' Sanmol ',
        kandungan: null,
      }),
    ).toBe('Sanmol');
  });

  it('obat tanpa merek dan kandungan jatuh ke nama', () => {
    expect(getDisplayNameFromMasterObat({ nama: 'Paracetamol', jenis: 'Obat' })).toBe(
      'Paracetamol',
    );
  });

  it('non-obat memakai nama lebih dulu', () => {
    expect(
      getDisplayNameFromMasterObat({
        nama: 'Spuit 3cc',
        jenis: 'BHP (Habis Pakai)',
        merek: 'Terumo',
        kandungan: 'x',
      }),
    ).toBe('Spuit 3cc');
  });

  it('non-obat tanpa nama jatuh ke merek/kandungan', () => {
    expect(
      getDisplayNameFromMasterObat({
        nama: '',
        jenis: 'Alat Kesehatan',
        merek: 'Omron',
        kandungan: '',
      }),
    ).toBe('Omron');
  });

  it('data kosong menghasilkan "Unknown"', () => {
    expect(getDisplayNameFromMasterObat(null)).toBe('Unknown');
    expect(getDisplayNameFromMasterObat(undefined)).toBe('Unknown');
    expect(getDisplayNameFromMasterObat({ nama: '', jenis: 'Obat' })).toBe('Unknown');
  });
});
