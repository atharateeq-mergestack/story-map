/**
 * Heading Component
 *
 * Reusable heading component with theme-aware styling and responsive typography.
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

export type HeadingProps = {
  as?: HeadingLevel;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  color?: 'primary' | 'secondary' | 'default' | 'muted' | 'destructive';
  align?: 'left' | 'center' | 'right';
  responsive?: boolean;
} & React.HTMLAttributes<HTMLHeadingElement>;

const headingStyles: Record<HeadingLevel, string> = {
  h1: 'text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight',
  h2: 'text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight',
  h3: 'text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight',
  h4: 'text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight',
  h5: 'text-lg md:text-xl lg:text-2xl font-semibold',
  h6: 'text-base md:text-lg lg:text-xl font-semibold',
};

const sizeStyles: Record<string, string> = {
  'xs': 'text-xs',
  'sm': 'text-sm',
  'md': 'text-base',
  'lg': 'text-lg',
  'xl': 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl md:text-4xl',
  '4xl': 'text-4xl md:text-5xl',
  '5xl': 'text-5xl md:text-6xl',
  '6xl': 'text-6xl md:text-7xl',
};

const weightStyles: Record<string, string> = {
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  extrabold: 'font-extrabold',
};

const colorStyles: Record<string, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary-foreground',
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  destructive: 'text-destructive',
};

export const Heading = (
  { ref, as, level = 1, size, weight, color = 'default', align, responsive = true, className, children, ...props }: HeadingProps & { ref?: React.RefObject<HTMLHeadingElement | null> },
) => {
  const Component = as || (`h${level}` as HeadingLevel);
  const baseStyles = as ? '' : headingStyles[Component];

  const classes = cn(
    baseStyles,
    size && sizeStyles[size],
    weight && weightStyles[weight],
    colorStyles[color],
    align === 'center' && 'text-center',
    align === 'right' && 'text-right',
    responsive && 'leading-tight',
    className,
  );

  return (
    <Component ref={ref} className={classes} {...props}>
      {children}
    </Component>
  );
};

Heading.displayName = 'Heading';
