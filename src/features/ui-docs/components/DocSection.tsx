import React from 'react';
import CodeBlock from './CodeBlock';

interface DocSectionProps {
  id: string;
  title: string;
  description: string;
  importPath: string;
  children: React.ReactNode;
}

// Satu bagian dokumentasi: judul, deskripsi, path import, lalu contoh.
export const DocSection: React.FC<DocSectionProps> = ({
  id,
  title,
  description,
  importPath,
  children,
}) => (
  <section id={id} className="scroll-mt-36 rounded-card border bg-card p-5 shadow">
    <h2 className="text-base font-bold text-foreground">{title}</h2>
    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    <p className="mt-3 inline-block rounded-md bg-surface-2 px-2 py-1 font-mono text-xs text-muted-foreground">
      {importPath}
    </p>
    <div className="mt-6 space-y-8">{children}</div>
  </section>
);

interface DocExampleProps {
  title: string;
  code: string;
  note?: string;
  children: React.ReactNode;
}

// Contoh hidup beserta kode yang menghasilkannya.
export const DocExample: React.FC<DocExampleProps> = ({ title, code, note, children }) => (
  <div className="space-y-3">
    <div>
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
      {note && <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>}
    </div>
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-border-strong p-4">
      {children}
    </div>
    <CodeBlock code={code} />
  </div>
);
