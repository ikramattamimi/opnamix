import React from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Tombol ikon bulat berlapis kaca untuk baris atas header dan sidebar.
export const HeaderIconButton = React.forwardRef<
  HTMLButtonElement,
  ButtonProps & { label: string }
>(({ label, className, children, ...props }, ref) => (
  <Button
    ref={ref}
    variant="glass"
    size="icon"
    aria-label={label}
    title={label}
    className={cn('relative rounded-full', className)}
    {...props}
  >
    {children}
  </Button>
));
HeaderIconButton.displayName = 'HeaderIconButton';
