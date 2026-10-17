import React, { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { BriefcaseMedical, ChevronDown, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Service } from '@/features/services/types';
import type { StockOutRequestValues } from '../schemas';
import { Card } from '@/components/ui/card';

interface ServicePickerProps {
  services: Service[];
  totalServices: number;
}

const groupByCategory = (services: Service[]) =>
  services.reduce<Record<string, Service[]>>((acc, svc) => {
    const cat = svc.categoryName || 'Lainnya';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(svc);
    return acc;
  }, {});

// Pilihan jasa per kategori di form permintaan
const ServicePicker: React.FC<ServicePickerProps> = ({ services, totalServices }) => {
  const { control, setValue, trigger, formState } = useFormContext<StockOutRequestValues>();
  const selectedServices = useWatch({ control, name: 'serviceIds' });
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleService = (id: string) => {
    const next = selectedServices.includes(id)
      ? selectedServices.filter((s) => s !== id)
      : [...selectedServices, id];
    setValue('serviceIds', next, { shouldDirty: true });
    // Pesan "minimal 1 obat atau 1 jasa" ikut diperbarui setelah submit pertama
    if (formState.isSubmitted) void trigger('drugs');
  };

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryName)) next.delete(categoryName);
      else next.add(categoryName);
      return next;
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 text-purple-700">
            <BriefcaseMedical className="size-5" aria-hidden />
          </span>
          Jasa
        </h3>
      </div>
      <div className="flex flex-col gap-2">
        {Object.entries(groupByCategory(services)).map(([categoryName, categoryServices]) => {
          const isExpanded = expandedCategories.has(categoryName);
          const selectedCount = categoryServices.filter((s) =>
            selectedServices.includes(s.id),
          ).length;
          return (
            <div
              key={categoryName}
              className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden"
            >
              <Button
                type="button"
                variant="ghost"
                onClick={() => toggleCategory(categoryName)}
                aria-expanded={isExpanded}
                className="w-full justify-between rounded-none px-4 font-normal bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 active:scale-100 [&_svg]:size-5"
              >
                <div className="flex items-center gap-2">
                  <Folder className="text-purple-500" aria-hidden />
                  <span className="font-bold text-sm text-foreground">{categoryName}</span>
                  {selectedCount > 0 && (
                    <span className="text-[10px] font-bold bg-primary text-white rounded-full px-1.5 py-0.5">
                      {selectedCount}
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={cn(
                    'text-slate-400 transition-transform duration-200',
                    isExpanded && 'rotate-180',
                  )}
                  aria-hidden
                />
              </Button>
              {isExpanded && (
                <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-700">
                  {categoryServices.map((service) => {
                    const checked = selectedServices.includes(service.id);
                    return (
                      <div
                        key={service.id}
                        onClick={() => toggleService(service.id)}
                        className={cn(
                          'flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors',
                          checked && 'bg-primary/5 dark:bg-primary/10',
                        )}
                      >
                        <input
                          checked={checked}
                          readOnly
                          aria-label={service.name}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                          type="checkbox"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">
                            {service.name}
                          </p>
                        </div>
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-300 whitespace-nowrap">
                          Rp {service.price.toLocaleString('id-ID')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <div className="mt-2 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600 font-medium">Subtotal Jasa</span>
            <span className="font-bold text-slate-800 dark:text-white">
              Rp {totalServices.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ServicePicker;
