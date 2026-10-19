import React from 'react';
import { CircleAlert } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { useFormField } from '@/components/ui/form';
import { isFieldErrorVisible } from './fieldErrorVisibility';

interface FieldErrorTextProps {
  id?: string;
  children: React.ReactNode;
}

export const FieldErrorText: React.FC<FieldErrorTextProps> = ({ id, children }) => (
  <p id={id} className="mt-1 flex items-center gap-1 text-xs text-bad">
    <CircleAlert className="size-4" aria-hidden />
    {children}
  </p>
);

// Pesan error untuk field di dalam <FormItem>. Sama seperti validasi lama,
// pesan baru tampil setelah field disentuh atau form disubmit.
export const FieldErrorMessage: React.FC = () => {
  const { error, isTouched, formMessageId } = useFormField();
  const {
    formState: { isSubmitted },
  } = useFormContext();

  if (!error?.message || !isFieldErrorVisible({ error, isTouched }, isSubmitted)) return null;
  return <FieldErrorText id={formMessageId}>{error.message}</FieldErrorText>;
};
