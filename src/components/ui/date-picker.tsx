'use client';

import type { SelectSingleEventHandler } from 'react-day-picker';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import * as React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type DatePickerProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
  label?: string;
};

/**
 * DatePicker component with input field and calendar popup.
 * Supports dark theme and modern styling.
 */
export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled = false,
  className,
  id,
  name,
  required = false,
  label,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const date = React.useMemo(() => {
    if (!value) {
      return undefined;
    }
    try {
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        return undefined;
      }
      return parsed;
    } catch {
      return undefined;
    }
  }, [value]);

  const handleSelect: SelectSingleEventHandler = (selectedDate) => {
    if (!selectedDate) {
      onChange?.('');
      return;
    }

    const isoString = format(selectedDate, 'yyyy-MM-dd');
    onChange?.(isoString);
    setOpen(false);
  };

  const displayValue = React.useMemo(() => {
    if (!date) {
      return '';
    }
    return format(date, 'MMMM dd, yyyy');
  }, [date]);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              id={id}
              name={name}
              disabled={disabled}
              required={required}
              readOnly
              value={displayValue || placeholder}
              placeholder={placeholder}
              className={cn('cursor-pointer pr-10', !date && 'text-muted-foreground')}
            />
            <CalendarIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-popover border-border dark:bg-popover/95" align="start">
          <Calendar mode="single" selected={date} onSelect={handleSelect} initialFocus />
        </PopoverContent>
      </Popover>
    </div>
  );
}
