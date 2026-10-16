export const STOCK_OUT_META_MARKER = '||META||';

export const extractTransactionNoteAndMeta = (rawNote?: string | null) => {
  if (!rawNote) {
    return {
      note: '',
      meta: { serviceFee: 0 },
    };
  }

  const [note, metaPart] = rawNote.split(STOCK_OUT_META_MARKER);

  if (!metaPart) {
    return {
      note: note.trim(),
      meta: { serviceFee: 0 },
    };
  }

  try {
    const parsed = JSON.parse(metaPart);
    return {
      note: note.trim(),
      meta: {
        serviceFee: Number(parsed?.serviceFee || 0),
      },
    };
  } catch {
    return {
      note: note.trim(),
      meta: { serviceFee: 0 },
    };
  }
};
