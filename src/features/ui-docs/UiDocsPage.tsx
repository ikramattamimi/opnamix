import React from 'react';
import { BadgeDocs, ButtonDocs } from './sections/ButtonBadgeDocs';
import { InputDocs } from './sections/InputDocs';
import { FormDocs } from './sections/FormDocs';
import { DialogDocs, DropdownDocs } from './sections/OverlayDocs';
import { CardDocs, TabsDocs } from './sections/LayoutDocs';
import { FeedbackDocs, TableDocs } from './sections/DataDocs';
import { IconDocs } from './sections/IconDocs';
import { DocsTocInline, DocsTocSidebar } from './components/DocsToc';

// Urutan = urutan di halaman dan di daftar komponen
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

const TOC_ITEMS = SECTIONS.map(({ id, label }) => ({ id, label }));

const UiDocsPage: React.FC = () => (
  <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_13rem] lg:gap-8">
    <div className="min-w-0 space-y-6">
      <div className="rounded-[20px] bg-card p-6 shadow-soft">
        <p className="text-sm text-muted-foreground">
          Komponen bersama di <code className="font-mono text-xs">src/components/ui</code>{' '}
          (shadcn/ui) dan <code className="font-mono text-xs">src/components/common</code>. Pakai
          komponen ini sebelum membuat versi sendiri. Konvensi lengkap ada di{' '}
          <code className="font-mono text-xs">.ai/conventions/</code>.
        </p>
      </div>

      <div className="lg:hidden">
        <DocsTocInline items={TOC_ITEMS} />
      </div>

      {SECTIONS.map(({ id, Component }) => (
        <Component key={id} />
      ))}
    </div>

    <aside className="hidden lg:block">
      <DocsTocSidebar items={TOC_ITEMS} />
    </aside>
  </div>
);

export default UiDocsPage;
