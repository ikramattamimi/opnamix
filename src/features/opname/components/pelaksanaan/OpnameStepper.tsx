import React from 'react';
import { ArrowLeftRight, CircleCheck, ListChecks, Package, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import StepSelectProducts from './StepSelectProducts';
import StepPhysicalCount from './StepPhysicalCount';
import StepResolveDifferences from './StepResolveDifferences';
import type { OpnameExecution } from './useOpnameExecution';

const STEPS: { num: number; label: string; icon: LucideIcon }[] = [
  { num: 1, label: 'Pemilihan Obat', icon: ListChecks },
  { num: 2, label: 'Input Stok Fisik', icon: Package },
  { num: 3, label: 'Penyesuaian Stok', icon: ArrowLeftRight },
];

interface OpnameStepperProps {
  execution: OpnameExecution;
}

// Penanda langkah opname dan isi langkah yang sedang aktif
const OpnameStepper: React.FC<OpnameStepperProps> = ({ execution }) => {
  const { opnameData, currentStep, selectedItems } = execution;

  return (
    <>
      <div className="bg-card rounded-3xl p-6 shadow-soft">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold">Opname — {opnameData?.scheduleName || 'Opname'}</h2>
          <span className="text-xs font-bold text-muted-foreground">
            {opnameData?.opnameNumber}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-4">
          {STEPS.map((step, index) => {
            const Icon = currentStep > step.num ? CircleCheck : step.icon;
            return (
              <React.Fragment key={step.num}>
                <div
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all',
                    currentStep === step.num && 'bg-primary text-white shadow-lg shadow-primary/20',
                    currentStep > step.num &&
                      'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
                    currentStep < step.num && 'bg-background text-muted-foreground',
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  <span className="text-xs font-bold hidden sm:inline">{step.label}</span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 rounded',
                      currentStep > step.num ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-gray-700',
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {currentStep === 1 && (
        <StepSelectProducts
          products={execution.allProducts}
          selectedIds={execution.selectedIds}
          onToggle={execution.toggleSelect}
          onToggleAll={execution.toggleSelectAll}
        />
      )}

      {currentStep === 2 && (
        <StepPhysicalCount
          items={selectedItems}
          physicalCounts={execution.physicalCounts}
          onChange={execution.setPhysicalCounts}
        />
      )}

      {currentStep === 3 && (
        <StepResolveDifferences
          items={selectedItems}
          physicalCounts={execution.physicalCounts}
          finalStocks={execution.finalStocks}
          onFinalStocksChange={execution.setFinalStocks}
          reasons={execution.reasons}
          onReasonsChange={execution.setReasons}
        />
      )}
    </>
  );
};

export default OpnameStepper;
