import { useMemo, useState } from 'react';
import { isoDay, resolveDateRange, type DatePreset } from './dateRange';

// State rentang tanggal untuk DateRangeControl
export function useDateRange(initial: DatePreset = '7') {
  const [preset, setPreset] = useState<DatePreset>(initial);
  const [custom, setCustom] = useState(() => {
    const today = new Date();
    const weekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
    return { from: isoDay(weekAgo), to: isoDay(today) };
  });
  const range = useMemo(() => resolveDateRange(preset, custom), [preset, custom]);
  return { preset, setPreset, custom, setCustom, range };
}

export type DateRangeState = ReturnType<typeof useDateRange>;
