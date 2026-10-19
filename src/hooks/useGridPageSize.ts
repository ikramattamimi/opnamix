import { useLayoutEffect, useState } from 'react';
import { gridLayout } from '@/components/data/pageMath';

// Jumlah kolom grid dari lebar wadah dan ukuran halaman (kolom × baris).
// Pasang `ref` ke ResponsiveGrid dan teruskan `cols` ke sana. `ref` berupa
// callback, jadi grid yang baru muncul setelah data dimuat tetap diukur.

const GAP_PX = 10;

export function useGridPageSize(minItemWidth: number, rows = 3) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const [layout, setLayout] = useState(() => gridLayout(minItemWidth * 3, minItemWidth, rows));

  useLayoutEffect(() => {
    if (!el) return;
    const update = () => {
      // Ukuran minimum dalam rem ikut naik di mode Besar
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) / 16;
      const next = gridLayout(el.clientWidth, minItemWidth * rem, rows, GAP_PX * rem);
      setLayout((prev) =>
        prev.cols === next.cols && prev.pageSize === next.pageSize ? prev : next,
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [el, minItemWidth, rows]);

  return { ref: setEl, ...layout };
}
