'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type AnimatedWrapperProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
};

export function AnimatedWrapper({
  children,
  className,
  delay = 0,
  direction = 'up',
}: AnimatedWrapperProps) {
  const directionClasses = {
    up: 'animate-[fadeInUp_0.6s_ease-out]',
    down: 'animate-[fadeInDown_0.6s_ease-out]',
    left: 'animate-[fadeInLeft_0.6s_ease-out]',
    right: 'animate-[fadeInRight_0.6s_ease-out]',
  };

  return (
    <div
      className={cn(
        'opacity-0',
        directionClasses[direction],
        className,
      )}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'forwards',
      }}
    >
      {children}
    </div>
  );
}

type StaggeredListProps = {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
};

export function StaggeredList({
  children,
  className,
  staggerDelay = 50,
}: StaggeredListProps) {
  return (
    <div className={className}>
      {Array.isArray(children)
        ? children.map((child, index) => (
            <AnimatedWrapper
              key={index}
              delay={index * staggerDelay}
              direction="up"
            >
              {child}
            </AnimatedWrapper>
          ))
        : children}
    </div>
  );
}
