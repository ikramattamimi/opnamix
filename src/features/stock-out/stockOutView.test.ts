import { describe, expect, it } from 'vitest';
import { filterRequests, itemSummary, stockOutStats, typeLabel, visibleNote } from './stockOutView';
import type { StockOutRequest } from './types';

const make = (over: Partial<StockOutRequest>): StockOutRequest => ({
  id: 'OUT-1',
  requestId: 'OUT-1',
  patient: { fullName: 'Budi', medicalRecordNumber: '-', birthDate: '', diagnosis: '-' },
  drugs: [],
  services: [],
  totalAmount: 0,
  discount: 0,
  serviceFee: 0,
  requestedBy: 'Rina',
  requestedByAvatar: '',
  status: 'Menunggu',
  date: '2026-10-18',
  tipeSumber: 'PENGAJUAN_NAKES',
  createdBy: 'u1',
  createdAt: '2026-10-18T09:00:00',
  processedAt: null,
  processedBy: null,
  note: '',
  ...over,
});

const NOW = new Date(2026, 9, 18, 15, 0);

describe('filterRequests', () => {
  const list = [
    make({ id: 'a', requestId: 'OUT-1', patient: { ...make({}).patient, fullName: 'Ani' } }),
    make({ id: 'b', requestId: 'OUT-2', status: 'Selesai', tipeSumber: 'KASIR_LANGSUNG' }),
  ];
  it('menyaring status, jenis, dan kata kunci', () => {
    expect(filterRequests(list, { status: 'Selesai', type: 'Semua', query: '' })).toHaveLength(1);
    expect(filterRequests(list, { status: 'Semua', type: 'Manual', query: '' })[0].id).toBe('b');
    expect(filterRequests(list, { status: 'Semua', type: 'Semua', query: 'ani' })[0].id).toBe('a');
    expect(filterRequests(list, { status: 'Semua', type: 'Semua', query: 'out-2' })[0].id).toBe(
      'b',
    );
  });
});

describe('stockOutStats', () => {
  it('menghitung menunggu, hari ini, dan nilai 7 hari yang selesai', () => {
    const stats = stockOutStats(
      [
        make({ status: 'Menunggu', totalAmount: 5000 }),
        make({ status: 'Selesai', totalAmount: 10000, createdAt: '2026-10-12T08:00:00' }),
        make({ status: 'Selesai', totalAmount: 7000, createdAt: '2026-10-11T08:00:00' }),
      ],
      NOW,
    );
    expect(stats).toEqual({ waiting: 1, today: 1, weekTotal: 10000 });
  });
});

describe('teks baris', () => {
  it('jenis, ringkasan item, dan keterangan', () => {
    expect(typeLabel({ tipeSumber: 'KASIR_LANGSUNG' })).toBe('Manual');
    expect(itemSummary({ drugs: [make({}).drugs[0]].filter(Boolean), services: [] })).toBe(
      'Tanpa item',
    );
    expect(visibleNote('Request from Nakes - Original ID: #REQ-1')).toBe('');
    expect(visibleNote('Sampel rusak')).toBe('Sampel rusak');
  });
});
