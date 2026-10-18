import { describe, expect, it } from 'vitest';
import { groupByDay } from './listGroups';

describe('groupByDay', () => {
  it('menggabungkan item berurutan pada hari yang sama', () => {
    const items = [
      { id: 1, at: new Date(2026, 9, 18, 9) },
      { id: 2, at: new Date(2026, 9, 18, 8) },
      { id: 3, at: new Date(2026, 9, 17, 15) },
    ];
    const groups = groupByDay(
      items,
      (i) => i.at,
      (d) => `${d.getDate()}`,
    );
    expect(groups.map((g) => [g.label, g.items.map((i) => i.id)])).toEqual([
      ['18', [1, 2]],
      ['17', [3]],
    ]);
  });
});
