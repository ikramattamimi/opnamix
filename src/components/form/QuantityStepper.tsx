import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { clamp, parseDigits } from './number';

// − / angka / + untuk jumlah di keranjang dan penerimaan
interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
}

const BTN =
  'grid size-7 place-items-center bg-card text-muted-foreground hover:enabled:bg-surface-2 hover:enabled:text-foreground disabled:opacity-40 [&_svg]:size-3.5';

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  label,
}) => (
  <span className="inline-flex h-7 w-fit items-center overflow-hidden rounded-control border border-input">
    <button
      type="button"
      className={BTN}
      onClick={() => onChange(clamp(value - 1, min, max))}
      disabled={value <= min}
      aria-label={`Kurangi ${label}`}
    >
      <Minus aria-hidden />
    </button>
    <input
      value={value}
      inputMode="numeric"
      aria-label={`Jumlah ${label}`}
      onChange={(event) => onChange(clamp(parseDigits(event.target.value) ?? min, min, max))}
      onFocus={(event) => event.target.select()}
      className="h-7 w-12 border-x bg-card text-center text-meta tabular-nums outline-none focus:bg-primary-soft"
    />
    <button
      type="button"
      className={BTN}
      onClick={() => onChange(clamp(value + 1, min, max))}
      disabled={value >= max}
      aria-label={`Tambah ${label}`}
    >
      <Plus aria-hidden />
    </button>
  </span>
);
