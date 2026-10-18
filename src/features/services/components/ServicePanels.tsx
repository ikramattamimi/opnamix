import React, { useState } from 'react';
import { Check, Loader2, Plus, Tags, Trash2 } from 'lucide-react';
import { SidePanel, PanelSection } from '@/components/panel/SidePanel';
import { LineItems } from '@/components/panel/LineItems';
import { ToneIcon } from '@/components/data/ToneIcon';
import { StatusChip } from '@/components/data/StatusChip';
import { EmptyState } from '@/components/common/QueryState';
import { Field } from '@/components/form/Field';
import { CurrencyInput } from '@/components/form/CurrencyInput';
import { OptionSelect } from '@/components/form/OptionSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NO_CATEGORY, serviceCategoryMeta } from '../catalog';
import {
  serviceCategoryFormSchema,
  serviceFormSchema,
  type ServiceFormValues,
} from '../serviceSchema';
import type { Service, ServiceCategoryType } from '../types';

// Panel kanan Data Jasa: form tambah/edit jasa, dan mode "Kelola kategori".

interface ServiceFormPanelProps {
  /** Kosong berarti jasa baru */
  service?: Service;
  categories: ServiceCategoryType[];
  saving: boolean;
  onSave: (values: ServiceFormValues) => Promise<boolean>;
  onDelete: (service: Service) => void;
  onCancel: () => void;
}

const NONE = 'none';

export const ServiceFormPanel: React.FC<ServiceFormPanelProps> = ({
  service,
  categories,
  saving,
  onSave,
  onDelete,
  onCancel,
}) => {
  const isNew = !service;
  const [values, setValues] = useState<ServiceFormValues>({
    name: service?.name ?? '',
    code: service?.code ?? '',
    categoryId: service?.categoryId ?? categories[0]?.id ?? '',
    price: service?.price || undefined,
    description: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const result = serviceFormSchema.safeParse(values);
  const errors = submitted && !result.success ? result.error.flatten().fieldErrors : {};

  const set = <K extends keyof ServiceFormValues>(key: K, value: ServiceFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const categoryName = categories.find((c) => c.id === values.categoryId)?.name;
  const meta = serviceCategoryMeta(categoryName);
  const formId = 'service-form';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!result.success) return;
    const saved = await onSave(values);
    if (saved && isNew) {
      setValues((prev) => ({ ...prev, name: '', price: undefined }));
      setSubmitted(false);
    }
  };

  return (
    <SidePanel
      icon={isNew ? Plus : meta.icon}
      tone={meta.tone}
      eyebrow={isNew ? 'Jasa baru' : `Edit jasa · ${service.code}`}
      title={isNew ? 'Tambah jasa' : service.name}
      footer={
        <>
          {!isNew && (
            <Button
              type="button"
              variant="ghost-danger"
              onClick={() => onDelete(service)}
              disabled={saving}
            >
              <Trash2 aria-hidden />
              Hapus
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            className="sm:ml-auto"
            onClick={onCancel}
            disabled={saving}
          >
            Batal
          </Button>
          <Button type="submit" form={formId} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" aria-hidden /> : <Check aria-hidden />}
            Simpan
          </Button>
        </>
      }
    >
      <form
        id={formId}
        noValidate
        onSubmit={(event) => void handleSubmit(event)}
        className="flex flex-col gap-3"
      >
        <Field label="Nama jasa" required error={errors.name?.[0]}>
          <Input
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Mis. Rawat luka kecil"
          />
        </Field>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Kategori">
            <OptionSelect
              value={values.categoryId || NONE}
              onValueChange={(v) => set('categoryId', v === NONE ? '' : v)}
              options={[
                ...categories.map((c) => ({ value: c.id, label: c.name })),
                { value: NONE, label: NO_CATEGORY },
              ]}
            />
          </Field>
          <Field label="Kode" hint={isNew ? 'Dibuat otomatis dari nama jasa.' : undefined}>
            <Input
              className="font-mono"
              value={isNew ? '' : values.code}
              placeholder="Otomatis"
              readOnly
            />
          </Field>
        </div>
        <Field label="Tarif" required error={errors.price?.[0]}>
          <CurrencyInput
            value={values.price ?? null}
            onValueChange={(v) => set('price', v ?? undefined)}
          />
        </Field>
      </form>
    </SidePanel>
  );
};

interface ServiceCategoryPanelProps {
  categories: ServiceCategoryType[];
  /** Jumlah jasa per id kategori */
  usage: Map<string, number>;
  adding: boolean;
  onAdd: (name: string) => Promise<boolean>;
  onDone: () => void;
}

export const ServiceCategoryPanel: React.FC<ServiceCategoryPanelProps> = ({
  categories,
  usage,
  adding,
  onAdd,
  onDone,
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string>();

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = serviceCategoryFormSchema.safeParse({ name, description: '' });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    if (
      categories.some(
        (c) => c.name.toLocaleLowerCase('id-ID') === name.trim().toLocaleLowerCase('id-ID'),
      )
    ) {
      setError('Kategori ini sudah ada.');
      return;
    }
    setError(undefined);
    if (await onAdd(name.trim())) setName('');
  };

  return (
    <SidePanel
      icon={Tags}
      eyebrow="Master jasa"
      title="Kategori jasa"
      onClose={onDone}
      footer={
        <>
          <Button type="button" variant="outline" className="sm:ml-auto" onClick={onDone}>
            Selesai
          </Button>
        </>
      }
    >
      <form
        noValidate
        onSubmit={(event) => void handleAdd(event)}
        className="flex items-start gap-2"
      >
        <Field label="Nama kategori baru" error={error} className="flex-1">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mis. Konsultasi gizi"
          />
        </Field>
        {/* Sejajar dengan isian: tinggi label Field (1rem) + jarak (0,375rem) */}
        <Button type="submit" className="mt-5.5" disabled={adding}>
          {adding ? <Loader2 className="animate-spin" aria-hidden /> : <Plus aria-hidden />}
          Tambah
        </Button>
      </form>

      <PanelSection title={`${categories.length} kategori`}>
        {categories.length === 0 ? (
          <EmptyState icon={Tags} title="Belum ada kategori" />
        ) : (
          <LineItems
            items={categories.map((c) => {
              const meta = serviceCategoryMeta(c.name);
              return {
                id: c.id,
                lead: <ToneIcon icon={meta.icon} tone={meta.tone} size="sm" />,
                title: c.name,
                subtitle: c.description || undefined,
                amount: (
                  <StatusChip tone="neutral" plain>
                    {usage.get(c.id) ?? 0} jasa
                  </StatusChip>
                ),
              };
            })}
          />
        )}
      </PanelSection>
    </SidePanel>
  );
};
