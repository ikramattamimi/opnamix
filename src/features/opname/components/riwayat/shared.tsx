import React from 'react';
import { Search, type LucideIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export const SectionHeader: React.FC<{
  icon: LucideIcon;
  iconClassName: string;
  title: string;
}> = ({ icon: Icon, iconClassName, title }) => (
  <div className="flex items-center gap-3 mb-3">
    <div className={cn('p-2 rounded-xl', iconClassName)}>
      <Icon className="size-6" aria-hidden />
    </div>
    <h3 className="text-lg font-bold">{title}</h3>
  </div>
);

export const OpnameSearchInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}> = ({ value, onChange, placeholder }) => (
  <div className="relative mb-4">
    <Search
      className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2"
      aria-hidden
    />
    <Input
      type="text"
      placeholder={placeholder}
      aria-label={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-auto w-full bg-card border-none rounded-xl pl-9 pr-4 py-2.5 text-sm md:text-sm font-medium placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/20 shadow-soft"
    />
  </div>
);

// Wadah kartu untuk status kosong/gagal di daftar opname
export const ListStateCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-card rounded-2xl shadow-soft">{children}</div>
);
