'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export type InputFieldProps = {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
} & React.ComponentProps<'input'>;

export const InputField = ({ ref, label, error, helperText, required, className, id, ...props }: InputFieldProps & { ref?: React.RefObject<HTMLInputElement | null> }) => {
  const inputId = React.useId();
  const hasError = !!error;

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={inputId} className={cn(required && 'after:content-["*"] after:ml-0.5 after:text-destructive')}>
          {label}
        </Label>
      )}
      <Input
        ref={ref}
        id={inputId}
        className={cn(hasError && 'border-destructive', className)}
        aria-invalid={hasError}
        aria-describedby={
          error
            ? `${inputId}-error`
            : helperText
              ? `${inputId}-helper`
              : undefined
        }
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="text-sm text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  );
};

InputField.displayName = 'InputField';
