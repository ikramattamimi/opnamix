import React from 'react';

// Baris pengaturan: judul, keterangan, kontrol di kanan
export const SettingRow: React.FC<{
  title: React.ReactNode;
  description?: React.ReactNode;
  control: React.ReactNode;
  htmlFor?: string;
}> = ({ title, description, control, htmlFor }) => (
  <div className="flex flex-wrap items-center gap-3 py-2.5 [&+&]:border-t">
    <div className="flex min-w-0 flex-[1_1_12.5rem] flex-col gap-px">
      {htmlFor ? (
        <label htmlFor={htmlFor} className="text-label font-semibold">
          {title}
        </label>
      ) : (
        <b className="text-label font-semibold">{title}</b>
      )}
      {description && <small className="text-xs text-muted-foreground">{description}</small>}
    </div>
    {control}
  </div>
);
