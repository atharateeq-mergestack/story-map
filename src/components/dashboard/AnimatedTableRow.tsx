'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type AnimatedTableRowProps = {
  children: ReactNode;
  index: number;
  className?: string;
};

export function AnimatedTableRow({
  children,
  index,
  className,
}: AnimatedTableRowProps) {
  return (
    <tr
      className={cn(
        'opacity-0 animate-[fadeInUp_0.5s_ease-out] transition-all duration-300 hover:bg-muted/50',
        className,
      )}
      style={{
        animationDelay: `${index * 50}ms`,
        animationFillMode: 'forwards',
      }}
    >
      {children}
    </tr>
  );
}
