import type { FieldError } from 'react-hook-form';

// Class tambahan untuk input yang errornya sedang tampil
export const fieldErrorClassName = 'border-red-500 focus:border-red-500 focus:ring-red-500';

export const isFieldErrorVisible = (
  fieldState: { error?: FieldError; isTouched: boolean },
  isSubmitted: boolean,
) => Boolean(fieldState.error) && (fieldState.isTouched || isSubmitted);
