import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  bg?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color, bg }) => {
  return (
    <Card className="p-4 flex items-center transition-all hover:scale-[1.02]">
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${bg || 'bg-background'}`}
      >
        <Icon className={`text-${color} size-6`} aria-hidden />
      </div>
      <div>
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <h3 className="text-2xl font-bold text-foreground">{value}</h3>
      </div>
    </Card>
  );
};

export default StatCard;
