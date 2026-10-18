import React from 'react';
import { BadgeDocs, ButtonDocs } from './sections/ButtonBadgeDocs';
import { InputDocs } from './sections/InputDocs';
import { FormDocs } from './sections/FormDocs';
import { DialogDocs, DropdownDocs } from './sections/OverlayDocs';
import { CardDocs, TabsDocs } from './sections/LayoutDocs';
import { FeedbackDocs, TableDocs } from './sections/DataDocs';
import { IconDocs } from './sections/IconDocs';
import { TokenDocs } from './sections/TokenDocs';
import { PageHeaderDocs, SegmentedDocs, ToneIconDocs } from './sections/ShellDocs';
import { DataPrimitiveDocs, FormPrimitiveDocs, ListPanelDocs } from './sections/PrimitiveDocs';
import { ProductDomainDocs, TagInputDocs } from './sections/ProductDocs';
import { PosDocs } from './sections/PosDocs';
import { DocsTocInline, DocsTocSidebar } from './components/DocsToc';
import { PageHeader } from '@/components/layout/PageHeader';

// Urutan = urutan di halaman dan di daftar komponen
const SECTIONS: { id: string; label: string; Component: React.FC }[] = [
  { id: 'token', label: 'Token & Tema', Component: TokenDocs },
  { id: 'page-header', label: 'PageHeader', Component: PageHeaderDocs },
  { id: 'list-panel', label: 'ListWithPanel', Component: ListPanelDocs },
  { id: 'data', label: 'Primitif daftar', Component: DataPrimitiveDocs },
  { id: 'button', label: 'Button', Component: ButtonDocs },
  { id: 'badge', label: 'Badge', Component: BadgeDocs },
  { id: 'input', label: 'Input & Select', Component: InputDocs },
  { id: 'form', label: 'Form', Component: FormDocs },
  { id: 'form-primitives', label: 'Primitif form', Component: FormPrimitiveDocs },
  { id: 'tag-input', label: 'TagInput & OptionSelect', Component: TagInputDocs },
  { id: 'product-domain', label: 'Komponen produk', Component: ProductDomainDocs },
  { id: 'pos', label: 'PosLayout & POS', Component: PosDocs },
  { id: 'dialog', label: 'Dialog', Component: DialogDocs },
  { id: 'dropdown', label: 'Dropdown', Component: DropdownDocs },
  { id: 'segmented', label: 'SegmentedControl', Component: SegmentedDocs },
  { id: 'tone-icon', label: 'ToneIcon', Component: ToneIconDocs },
  { id: 'card', label: 'Card', Component: CardDocs },
  { id: 'tabs', label: 'Tabs', Component: TabsDocs },
  { id: 'table', label: 'Tabel', Component: TableDocs },
  { id: 'feedback', label: 'Toast & Status', Component: FeedbackDocs },
  { id: 'icons', label: 'Ikon', Component: IconDocs },
];

const TOC_ITEMS = SECTIONS.map(({ id, label }) => ({ id, label }));

const UiDocsPage: React.FC = () => (
  <>
    <PageHeader />
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_13rem] lg:gap-8">
      <div className="min-w-0 space-y-6">
        <div className="rounded-card border bg-card p-5 shadow">
          <p className="text-sm text-muted-foreground">
            Komponen bersama di <code className="font-mono text-xs">src/components/ui</code>{' '}
            (shadcn/ui), <code className="font-mono text-xs">src/components/common</code>, dan{' '}
            <code className="font-mono text-xs">src/components/layout</code>. Pakai komponen ini
            sebelum membuat versi sendiri. Konvensi lengkap ada di{' '}
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
  </>
);

export default UiDocsPage;
