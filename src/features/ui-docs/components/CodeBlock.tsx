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
      <pre className="overflow-x-auto rounded-xl border bg-surface-2 p-3.5 pr-12 font-mono text-xs leading-relaxed text-foreground">
        <code>{code.trim()}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleCopy}
        aria-label={copied ? 'Kode tersalin' : 'Salin kode'}
        className="absolute right-2 top-2"
      >
        {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
      </Button>
    </div>
  );
};

export default CodeBlock;
