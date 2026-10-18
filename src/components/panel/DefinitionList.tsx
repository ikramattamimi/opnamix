import React from 'react';

// Pasangan label–nilai, nilai rata kanan
export interface Definition {
  label: React.ReactNode;
  value: React.ReactNode;
}

export const DefinitionList: React.FC<{ items: Definition[] }> = ({ items }) => (
  <dl className="m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3.5 gap-y-1.5 text-meta">
    {items.map((item, index) => (
      <React.Fragment key={index}>
        <dt className="text-muted-foreground">{item.label}</dt>
        <dd className="m-0 break-words text-right font-medium">{item.value}</dd>
      </React.Fragment>
    ))}
  </dl>
);
