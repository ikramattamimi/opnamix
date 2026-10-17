import React, { useRef } from 'react';
import { CloudUpload } from 'lucide-react';
import { formatFileSize } from '@/lib/imageCompression';

interface ReceiptUploadProps {
  file: File | null;
  onFileSelected: (file: File) => void;
}

// Area upload bukti nota. Validasi file dilakukan oleh pemanggil.
export const ReceiptUpload: React.FC<ReceiptUploadProps> = ({ file, onFileSelected }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6">
        Bukti Fisik (Opsional)
      </h4>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className="border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-background dark:hover:bg-white/5 transition-colors group bg-background/30"
      >
        <div className="bg-primary/10 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-200">
          <CloudUpload className="size-8 text-primary" aria-hidden />
        </div>
        <p className="text-foreground font-bold text-lg mb-1">
          {file ? file.name : 'Upload Bukti Nota'}
        </p>
        {file && (
          <p className="text-xs text-muted-foreground font-medium mb-2">
            Ukuran asli: {formatFileSize(file.size)}
          </p>
        )}
        <p className="text-xs text-muted-foreground font-medium">
          File PNG, JPG, dan GIF diizinkan
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-2">
          Gambar akan otomatis dikompres untuk menghemat storage
        </p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={(e) => {
            const selectedFile = e.target.files?.[0];
            if (selectedFile) onFileSelected(selectedFile);
            // Supaya file yang sama bisa dipilih ulang setelah ditolak
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
};
