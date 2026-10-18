import { useCallback, useState } from 'react';

// Item terpilih di daftar + status laci panel di layar sempit.
// Di layar lebar panel selalu tampil, jadi `panelOpen` hanya berarti di laci.
export function useListSelection<T extends string | number>(initial: T | null = null) {
  const [selectedId, setSelectedId] = useState<T | null>(initial);
  const [panelOpen, setPanelOpen] = useState(false);

  const select = useCallback((id: T | null) => {
    setSelectedId(id);
    setPanelOpen(id !== null);
  }, []);

  const openPanel = useCallback(() => setPanelOpen(true), []);
  const closePanel = useCallback(() => setPanelOpen(false), []);

  return { selectedId, select, panelOpen, openPanel, closePanel, setSelectedId };
}
