import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CodeBlockProps {
  code: string;
}

// Potongan kode contoh dengan tombol salin.
const CodeBlock: React.FC<CodeBlockProps> = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard bisa ditolak browser; tombol cukup tidak berubah
    }
  };

  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 pr-12 text-xs leading-relaxed text-slate-100">
        <code>{code.trim()}</code>
      </pre>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        aria-label={copied ? 'Kode tersalin' : 'Salin kode'}
        className="absolute right-2 top-2 h-8 w-8 p-0 text-slate-300 hover:bg-white/10 hover:text-white"
      >
        {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
      </Button>
    </div>
  );
};

export default CodeBlock;
