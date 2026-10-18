import React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FilterFieldProps {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}

// Label kecil huruf kapital di atas field filter laporan.
export const FilterField: React.FC<FilterFieldProps> = ({ label, htmlFor, children }) => (
  <div className="space-y-2">
    <Label htmlFor={htmlFor} className="block text-xs font-bold uppercase text-muted-foreground">
      {label}
    </Label>
    {children}
  </div>
);

interface FilterSelectProps {
  id: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}

// Select filter laporan dengan tampilan yang sama seperti input tanggal di sebelahnya.
export const FilterSelect: React.FC<FilterSelectProps> = ({
  id,
  value,
  onValueChange,
  options,
  className,
}) => (
  <Select value={value} onValueChange={onValueChange}>
    <SelectTrigger
      id={id}
      className={cn(
        'min-w-[160px] gap-2 border-0 bg-white px-4 text-base text-foreground shadow-none dark:bg-card',
        className,
      )}
    >
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {options.map((option) => (
        <SelectItem key={option.value} value={option.value}>
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
