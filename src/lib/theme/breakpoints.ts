/**
 * Responsive Breakpoints Utilities
 *
 * Helper functions and constants for responsive design.
 */

export const breakpoints = {
  'mobile': '0px',
  'tablet': '768px',
  'desktop': '1024px',
  'desktop-lg': '1280px',
  'desktop-xl': '1536px',
} as const;

/**
 * Media query helpers for use in CSS/styled components
 */
export const mediaQueries = {
  'mobile': `(min-width: ${breakpoints.mobile})`,
  'tablet': `(min-width: ${breakpoints.tablet})`,
  'desktop': `(min-width: ${breakpoints.desktop})`,
  'desktop-lg': `(min-width: ${breakpoints['desktop-lg']})`,
  'desktop-xl': `(min-width: ${breakpoints['desktop-xl']})`,
  // Max-width queries
  'mobile-only': `(max-width: ${Number.parseInt(breakpoints.tablet) - 1}px)`,
  'tablet-only': `(min-width: ${breakpoints.tablet}) and (max-width: ${Number.parseInt(breakpoints.desktop) - 1}px)`,
  'desktop-only': `(min-width: ${breakpoints.desktop}) and (max-width: ${Number.parseInt(breakpoints['desktop-lg']) - 1}px)`,
} as const;

/**
 * Tailwind breakpoint classes mapping
 */
export const breakpointClasses = {
  'mobile': '',
  'tablet': 'md:',
  'desktop': 'lg:',
  'desktop-lg': 'xl:',
  'desktop-xl': '2xl:',
} as const;
