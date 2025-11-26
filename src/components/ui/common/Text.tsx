'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type TextProps = {
  as?: 'p' | 'span' | 'div' | 'label' | 'small' | 'strong' | 'em';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'primary' | 'secondary' | 'default' | 'muted' | 'destructive' | 'success' | 'warning' | 'info';
  align?: 'left' | 'center' | 'right' | 'justify';
  truncate?: boolean;
  lineClamp?: 1 | 2 | 3 | 4 | 5 | 6;
} & React.HTMLAttributes<HTMLElement>;

const sizeStyles: Record<string, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

const weightStyles: Record<string, string> = {
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

const colorStyles: Record<string, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary-foreground',
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  destructive: 'text-destructive',
  success: 'text-[var(--color-success)]',
  warning: 'text-[var(--color-warning)]',
  info: 'text-[var(--color-info)]',
};

const alignStyles: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
};

export const Text = (
  { ref, as: Component = 'p', size = 'base', weight = 'normal', color = 'default', align, truncate, lineClamp, className, children, ...props }: TextProps & { ref?: React.RefObject<HTMLElement | null> },
) => {
  const classes = cn(
    sizeStyles[size],
    weightStyles[weight],
    colorStyles[color],
    align && alignStyles[align],
    truncate && 'truncate',
    lineClamp && `line-clamp-${lineClamp}`,
    className,
  );

  return (
    <Component ref={ref as any} className={classes} {...props}>
      {children}
    </Component>
  );
};

Text.displayName = 'Text';
