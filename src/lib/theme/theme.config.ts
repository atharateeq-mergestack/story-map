/**
 * Theme Configuration
 *
 * Central configuration for colors, typography, spacing, shadows, and breakpoints.
 */

export const theme = {
  colors: {
    // Primary colors
    primary: {
      DEFAULT: 'var(--color-primary)',
      foreground: 'var(--color-primary-foreground)',
      light: 'var(--color-primary-light)',
      dark: 'var(--color-primary-dark)',
    },
    secondary: {
      DEFAULT: 'var(--color-secondary)',
      foreground: 'var(--color-secondary-foreground)',
      light: 'var(--color-secondary-light)',
      dark: 'var(--color-secondary-dark)',
    },
    // Semantic colors
    destructive: {
      DEFAULT: 'var(--color-destructive)',
      foreground: 'var(--color-destructive-foreground)',
      light: 'var(--color-destructive-light)',
      dark: 'var(--color-destructive-dark)',
    },
    info: {
      DEFAULT: 'var(--color-info)',
      foreground: 'var(--color-info-foreground)',
      light: 'var(--color-info-light)',
      dark: 'var(--color-info-dark)',
    },
    success: {
      DEFAULT: 'var(--color-success)',
      foreground: 'var(--color-success-foreground)',
      light: 'var(--color-success-light)',
      dark: 'var(--color-success-dark)',
    },
    warning: {
      DEFAULT: 'var(--color-warning)',
      foreground: 'var(--color-warning-foreground)',
      light: 'var(--color-warning-light)',
      dark: 'var(--color-warning-dark)',
    },
    // Background colors
    background: {
      DEFAULT: 'var(--color-background)',
      secondary: 'var(--color-background-secondary)',
      tertiary: 'var(--color-background-tertiary)',
    },
    // Text colors
    text: {
      primary: 'var(--color-text-primary)',
      secondary: 'var(--color-text-secondary)',
      tertiary: 'var(--color-text-tertiary)',
      inverse: 'var(--color-text-inverse)',
    },
    // Border colors
    border: {
      DEFAULT: 'var(--color-border)',
      light: 'var(--color-border-light)',
      dark: 'var(--color-border-dark)',
    },
  },
  typography: {
    fontFamily: {
      sans: 'var(--font-geist-sans)',
      mono: 'var(--font-geist-mono)',
    },
    fontSize: {
      'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.025em' }],
      'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.025em' }],
      'base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0em' }],
      'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }],
      'xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }],
      '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.05em' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.05em' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.05em' }],
      '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.05em' }],
      '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.05em' }],
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    heading: {
      h1: {
        fontSize: '3rem',
        lineHeight: '1.2',
        fontWeight: '700',
        letterSpacing: '-0.05em',
      },
      h2: {
        fontSize: '2.25rem',
        lineHeight: '1.3',
        fontWeight: '700',
        letterSpacing: '-0.05em',
      },
      h3: {
        fontSize: '1.875rem',
        lineHeight: '1.4',
        fontWeight: '600',
        letterSpacing: '-0.025em',
      },
      h4: {
        fontSize: '1.5rem',
        lineHeight: '1.5',
        fontWeight: '600',
        letterSpacing: '-0.025em',
      },
      h5: {
        fontSize: '1.25rem',
        lineHeight: '1.6',
        fontWeight: '600',
        letterSpacing: '0em',
      },
      h6: {
        fontSize: '1.125rem',
        lineHeight: '1.6',
        fontWeight: '600',
        letterSpacing: '0em',
      },
    },
  },
  spacing: {
    'xs': '0.25rem',
    'sm': '0.5rem',
    'md': '1rem',
    'lg': '1.5rem',
    'xl': '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
    '4xl': '6rem',
  },
  borderRadius: {
    none: '0',
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    xl: 'var(--radius-xl)',
    full: '9999px',
  },
  shadows: {
    'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    'none': 'none',
  },
  breakpoints: {
    'mobile': '0px',
    'tablet': '768px',
    'desktop': '1024px',
    'desktop-lg': '1280px',
    'desktop-xl': '1536px',
  },
} as const;

export type Theme = typeof theme;
