import React from 'react';
import { BadgeDocs, ButtonDocs } from './sections/ButtonBadgeDocs';
import { InputDocs } from './sections/InputDocs';
import { FormDocs } from './sections/FormDocs';
import { DialogDocs, DropdownDocs } from './sections/OverlayDocs';
import { CardDocs, TabsDocs } from './sections/LayoutDocs';
import { FeedbackDocs, TableDocs } from './sections/DataDocs';
import { IconDocs } from './sections/IconDocs';

// Urutan = urutan di halaman dan di navigasi cepat
const SECTIONS: { id: string; label: string; Component: React.FC }[] = [
  { id: 'button', label: 'Button', Component: ButtonDocs },
  { id: 'badge', label: 'Badge', Component: BadgeDocs },
  { id: 'input', label: 'Input & Select', Component: InputDocs },
  { id: 'form', label: 'Form', Component: FormDocs },
  { id: 'dialog', label: 'Dialog', Component: DialogDocs },
  { id: 'dropdown', label: 'Dropdown', Component: DropdownDocs },
  { id: 'card', label: 'Card', Component: CardDocs },
  { id: 'tabs', label: 'Tabs', Component: TabsDocs },
  { id: 'table', label: 'Tabel', Component: TableDocs },
  { id: 'feedback', label: 'Toast & Status', Component: FeedbackDocs },
  { id: 'icons', label: 'Ikon', Component: IconDocs },
];

const UiDocsPage: React.FC = () => (
  <div className="space-y-6">
    <div className="rounded-[20px] bg-card-light p-6 shadow-soft dark:bg-card-dark">
      <p className="text-sm text-text-secondary-light">
        Komponen bersama di <code className="font-mono text-xs">src/components/ui</code> (shadcn/ui)
        dan <code className="font-mono text-xs">src/components/common</code>. Pakai komponen ini
        sebelum membuat versi sendiri. Konvensi lengkap ada di{' '}
        <code className="font-mono text-xs">.ai/conventions/</code>.
      </p>
      <nav aria-label="Daftar komponen" className="mt-4 flex flex-wrap gap-2">
        {SECTIONS.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-text-secondary-light transition-colors hover:bg-primary/10 hover:text-primary dark:bg-white/5"
          >
            {label}
          </a>
        ))}
      </nav>
    </div>

    {SECTIONS.map(({ id, Component }) => (
      <Component key={id} />
    ))}
  </div>
);

export default UiDocsPage;
