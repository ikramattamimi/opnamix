import React, { useId, useRef, useState } from 'react';
import { FileUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Unggah satu berkas: klik atau seret ke kotak. Berkas terpilih tampil dengan
// tombol hapus.

interface FileDropProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  accept?: string;
  label?: string;
  hint?: React.ReactNode;
  className?: string;
}

export const FileDrop: React.FC<FileDropProps> = ({
  file,
  onFileChange,
  accept,
  label = 'Pilih atau seret berkas ke sini',
  hint,
  className,
}) => {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  if (file) {
    return (
      <div
        className={cn(
          'flex items-center gap-2.5 rounded-xl border px-2.5 py-2 text-meta',
          className,
        )}
      >
        <FileUp className="size-4 shrink-0 text-primary" aria-hidden />
        <span className="min-w-0 flex-1 truncate">{file.name}</span>
        <small className="text-xs text-muted-foreground">{Math.ceil(file.size / 1024)} KB</small>
        <button
          type="button"
          onClick={() => {
            onFileChange(null);
            if (inputRef.current) inputRef.current.value = '';
          }}
          aria-label={`Hapus ${file.name}`}
          className="grid size-6.5 place-items-center rounded-md text-muted-foreground hover:bg-surface-2 hover:text-foreground"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <label
      htmlFor={id}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        const dropped = event.dataTransfer.files[0];
        if (dropped) onFileChange(dropped);
      }}
      className={cn(
        'flex h-30 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border-strong bg-[repeating-linear-gradient(135deg,rgb(var(--surface-2))_0_0.625rem,rgb(var(--card))_0.625rem_1.25rem)] px-3 text-center text-xs text-muted-foreground focus-within:ring-2 focus-within:ring-ring',
        dragging && 'border-primary bg-primary-soft',
        className,
      )}
    >
      <FileUp className="size-5" aria-hidden />
      <span className="font-medium text-foreground">{label}</span>
      {hint && <span>{hint}</span>}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
      />
    </label>
  );
};
