import React, { useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { CHART_BG, CHART_FILL, type ChartColor } from './chartColors';

// Grafik batang SVG ringan.
// - grouped: seri berdampingan dari nol
// - stacked: seri bertumpuk; nilai negatif bertumpuk ke bawah, jadi dua seri
//   bertanda berbeda (mis. kurang/lebih) menghasilkan grafik diverging
// Label sumbu hanya untuk nilai tertinggi/terendah yang benar-benar tercapai.
// Setiap ember punya area sentuh yang bisa difokus (tooltip, Enter = klik).

export interface BarSeries {
  key: string;
  label: string;
  color: ChartColor;
}

export interface BarDatum {
  label: string;
  values: Record<string, number>;
  /** Baris tambahan di tooltip, mis. "3 sesi" */
  note?: string;
}

interface BarChartProps {
  data: BarDatum[];
  series: BarSeries[];
  mode?: 'grouped' | 'stacked';
  formatValue?: (value: number) => string;
  /** Label sumbu yang lebih ringkas; bawaan formatValue */
  formatAxis?: (value: number) => string;
  onBucketClick?: (index: number) => void;
  /** Teks petunjuk di tooltip saat ember bisa diklik */
  clickHint?: string;
  height?: number;
  label: string;
  className?: string;
}

const PAD = { left: 58, right: 6, top: 10, bottom: 24 };

// Batang dengan sudut membulat di ujung yang menjauhi nol
function barPath(x: number, y0: number, y1: number, w: number) {
  const up = y1 < y0;
  const top = Math.min(y0, y1);
  const bottom = Math.max(y0, y1);
  const h = bottom - top;
  if (h <= 0) return '';
  const r = Math.min(4, h, w / 2);
  return up
    ? `M${x},${bottom}V${top + r}Q${x},${top} ${x + r},${top}H${x + w - r}Q${x + w},${top} ${x + w},${top + r}V${bottom}Z`
    : `M${x},${top}V${bottom - r}Q${x},${bottom} ${x + r},${bottom}H${x + w - r}Q${x + w},${bottom} ${x + w},${bottom - r}V${top}Z`;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  series,
  mode = 'grouped',
  formatValue = (v) => v.toLocaleString('id-ID'),
  formatAxis,
  onBucketClick,
  clickHint = 'klik untuk menyaring',
  height = 170,
  label,
  className,
}) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(480);
  const [active, setActive] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const update = () => setWidth(Math.max(260, Math.round(el.clientWidth)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const axis = formatAxis ?? formatValue;
  const W = width;
  const H = height;
  const pw = W - PAD.left - PAD.right;
  const ph = H - PAD.top - PAD.bottom;

  // Rentang nilai per ember
  const extents = data.map((d) => {
    if (mode === 'grouped') {
      const vals = series.map((s) => d.values[s.key] ?? 0);
      return { pos: Math.max(0, ...vals), neg: Math.min(0, ...vals) };
    }
    let pos = 0;
    let neg = 0;
    for (const s of series) {
      const v = d.values[s.key] ?? 0;
      if (v >= 0) pos += v;
      else neg += v;
    }
    return { pos, neg };
  });
  const maxTop = Math.max(0, ...extents.map((e) => e.pos));
  const maxBot = Math.max(0, ...extents.map((e) => -e.neg));
  const ticks: [number, string][] = [];
  if (maxTop) ticks.push([maxTop, axis(maxTop)]);
  if (maxBot) ticks.push([-maxBot, axis(-maxBot)]);
  // Grafik yang hanya ke bawah tetap diberi ruang kecil di atas garis nol
  let top = maxTop;
  const bot = maxBot;
  if (!top && !bot) top = 1;
  else if (!top) top = bot * 0.25;

  const y = (v: number) => PAD.top + ((top - v) / (top + bot || 1)) * ph;
  const y0 = y(0);
  const band = data.length ? pw / data.length : pw;
  const groupW = Math.max(6, Math.min(mode === 'grouped' ? 44 : 30, band * 0.6));
  const barW = mode === 'grouped' ? groupW / Math.max(1, series.length) : groupW;
  const every = Math.ceil(data.length / Math.max(1, Math.floor(pw / 64)));

  const activeDatum = active !== null ? data[active] : null;
  const tipLeft =
    active !== null
      ? (Math.min(Math.max(PAD.left + band * active + band / 2, 80), W - 80) / W) * 100
      : 0;

  return (
    <div ref={boxRef} className={cn('relative w-full', className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height={H}
        role="img"
        aria-label={label}
        className="block overflow-visible"
      >
        {ticks.map(([v, t]) => (
          <g key={v}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(v)}
              y2={y(v)}
              className="stroke-chart-grid"
              strokeDasharray="3 3"
            />
            <text
              x={PAD.left - 8}
              y={y(v) + 3.5}
              textAnchor="end"
              className="fill-muted-foreground text-[0.6875rem] tabular-nums"
            >
              {t}
            </text>
          </g>
        ))}
        <line x1={PAD.left} x2={W - PAD.right} y1={y0} y2={y0} className="stroke-border-strong" />
        <text
          x={PAD.left - 8}
          y={y0 + 3.5}
          textAnchor="end"
          className="fill-muted-foreground text-[0.6875rem]"
        >
          0
        </text>

        {data.map((d, i) => {
          const cx = PAD.left + band * i + band / 2;
          const x0 = cx - groupW / 2;
          let posAcc = 0;
          let negAcc = 0;
          return (
            <g key={i}>
              <rect
                x={PAD.left + band * i + 1}
                y={PAD.top}
                width={Math.max(0, band - 2)}
                height={ph}
                rx={6}
                tabIndex={0}
                role={onBucketClick ? 'button' : undefined}
                aria-label={`${d.label}: ${series
                  .map((s) => `${s.label} ${formatValue(d.values[s.key] ?? 0)}`)
                  .join(', ')}`}
                className={cn(
                  'fill-transparent outline-none focus-visible:fill-surface-2',
                  active === i && 'fill-surface-2',
                  onBucketClick && 'cursor-pointer',
                )}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                onClick={() => onBucketClick?.(i)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onBucketClick?.(i);
                  }
                }}
              />
              {series.map((s, si) => {
                const v = d.values[s.key] ?? 0;
                if (!v) return null;
                let from: number;
                let to: number;
                let x = x0;
                if (mode === 'grouped') {
                  from = 0;
                  to = v;
                  x = x0 + barW * si;
                } else if (v >= 0) {
                  from = posAcc;
                  to = posAcc += v;
                } else {
                  from = negAcc;
                  to = negAcc += v;
                }
                // Batang kecil tetap terlihat minimal 3px
                let py0 = y(from);
                let py1 = y(to);
                if (Math.abs(py1 - py0) < 3) py1 = py0 + (v > 0 ? -3 : 3);
                if (mode === 'stacked' && from === 0) py0 += v > 0 ? -1 : 1;
                return (
                  <path
                    key={s.key}
                    d={barPath(x, py0, py1, mode === 'grouped' ? Math.max(2, barW - 1) : barW)}
                    className={cn(CHART_FILL[s.color], 'pointer-events-none')}
                  />
                );
              })}
              {i % every === 0 && (
                <text
                  x={cx}
                  y={H - 6}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[0.6875rem]"
                >
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {activeDatum && (
        <div
          role="tooltip"
          className="pointer-events-none absolute top-1 z-10 min-w-36 -translate-x-1/2 rounded-lg border bg-card px-2.5 py-1.5 text-xs shadow-float"
          style={{ left: `${tipLeft}%` }}
        >
          <b className="block text-label font-semibold">{activeDatum.label}</b>
          {series.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <i className={cn('size-2 rounded-sm', CHART_BG[s.color])} aria-hidden />
              <span className="text-muted-foreground">{s.label}</span>
              <b className="ml-auto tabular-nums">{formatValue(activeDatum.values[s.key] ?? 0)}</b>
            </span>
          ))}
          {(activeDatum.note || onBucketClick) && (
            <span className="mt-0.5 block text-muted-foreground">
              {[activeDatum.note, onBucketClick && clickHint].filter(Boolean).join(' · ')}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
