import React from 'react';
import { Monitor, Moon, Sun, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/app/providers/ThemeProvider';
import {
  SIZE_OPTIONS,
  THEME_OPTIONS,
  type SizePreference,
  type ThemePreference,
} from '@/app/providers/displayPreferences';

// Pilihan tema dan ukuran sementara; tampilan finalnya dibuat bersama halaman
// Profil baru (Fase 5) dan sidebar (Fase 1).

const THEME_ICONS: Record<ThemePreference, React.ElementType> = {
  light: Sun,
  system: Monitor,
  dark: Moon,
};

interface ChoiceGroupProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  icon?: (value: T) => React.ElementType;
}

function ChoiceGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  icon,
}: ChoiceGroupProps<T>) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const Icon = icon?.(option.value);
          const selected = option.value === value;
          return (
            <Button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              size="sm"
              variant={selected ? 'soft' : 'outline'}
              onClick={() => onChange(option.value)}
            >
              {Icon && <Icon aria-hidden />}
              {option.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

const DisplayPreferencesSection: React.FC = () => {
  const { theme, setTheme, size, setSize } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Type className="size-4 text-primary" aria-hidden />
          Tampilan
        </CardTitle>
        <CardDescription>
          Disimpan di perangkat ini. Ukuran Besar memperbesar semua teks dan kontrol 15%.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-6">
        <ChoiceGroup<ThemePreference>
          label="Tema"
          options={THEME_OPTIONS}
          value={theme}
          onChange={setTheme}
          icon={(value) => THEME_ICONS[value]}
        />
        <ChoiceGroup<SizePreference>
          label="Ukuran"
          options={SIZE_OPTIONS}
          value={size}
          onChange={setSize}
        />
      </CardContent>
    </Card>
  );
};

export default DisplayPreferencesSection;
