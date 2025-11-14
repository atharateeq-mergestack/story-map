# Theme System Documentation

Complete guide to the custom theme system, responsive design, and reusable components.

## 📁 Folder Structure

```
src/
├── lib/
│   └── theme/
│       ├── theme.config.ts      # Theme configuration
│       └── breakpoints.ts       # Responsive breakpoints
├── hooks/
│   └── useTheme.ts              # Theme switching hook
├── components/
│   └── ui/
│       ├── theme/
│       │   ├── ThemeProvider.tsx    # Theme context provider
│       │   └── ThemeToggle.tsx      # Theme toggle button
│       └── common/
│           ├── Heading.tsx          # Reusable heading component
│           ├── Text.tsx              # Reusable text component
│           └── index.ts              # Exports
└── styles/
    └── global.css                # Global styles with theme variables
```

## 🌈 Theme Configuration

### Colors

The theme system includes the following color categories:

#### Primary Colors
- `primary` - Main brand color
- `primary-foreground` - Text color on primary background
- `primary-light` - Lighter variant
- `primary-dark` - Darker variant

#### Secondary Colors
- `secondary` - Secondary brand color
- `secondary-foreground` - Text color on secondary background
- `secondary-light` - Lighter variant
- `secondary-dark` - Darker variant

#### Semantic Colors
- **Destructive**: `destructive`, `destructive-foreground`, `destructive-light`, `destructive-dark`
- **Info**: `info`, `info-foreground`, `info-light`, `info-dark`
- **Success**: `success`, `success-foreground`, `success-light`, `success-dark`
- **Warning**: `warning`, `warning-foreground`, `warning-light`, `warning-dark`

#### Background Colors
- `background` - Main background
- `background-secondary` - Secondary background
- `background-tertiary` - Tertiary background

#### Text Colors
- `text-primary` - Primary text color
- `text-secondary` - Secondary text color
- `text-tertiary` - Tertiary text color
- `text-inverse` - Inverse text color

#### Border Colors
- `border` - Default border
- `border-light` - Light border
- `border-dark` - Dark border

### Typography

#### Font Sizes
- `xs`: 0.75rem (12px)
- `sm`: 0.875rem (14px)
- `base`: 1rem (16px)
- `lg`: 1.125rem (18px)
- `xl`: 1.25rem (20px)
- `2xl`: 1.5rem (24px)
- `3xl`: 1.875rem (30px)
- `4xl`: 2.25rem (36px)
- `5xl`: 3rem (48px)
- `6xl`: 3.75rem (60px)

#### Font Weights
- `light`: 300
- `normal`: 400
- `medium`: 500
- `semibold`: 600
- `bold`: 700
- `extrabold`: 800

#### Heading Styles
Predefined heading styles for h1-h6 with responsive sizing.

### Spacing

- `xs`: 0.25rem (4px)
- `sm`: 0.5rem (8px)
- `md`: 1rem (16px)
- `lg`: 1.5rem (24px)
- `xl`: 2rem (32px)
- `2xl`: 3rem (48px)
- `3xl`: 4rem (64px)
- `4xl`: 6rem (96px)

### Border Radius

- `none`: 0
- `sm`: calc(var(--radius) - 4px)
- `md`: calc(var(--radius) - 2px)
- `lg`: var(--radius) (default: 0.625rem)
- `xl`: calc(var(--radius) + 4px)
- `full`: 9999px

### Shadows

- `sm`: Small shadow
- `DEFAULT`: Default shadow
- `md`: Medium shadow
- `lg`: Large shadow
- `xl`: Extra large shadow
- `2xl`: 2X large shadow
- `inner`: Inner shadow
- `none`: No shadow

## 📐 Responsive Breakpoints

### Breakpoint Definitions

```typescript
{
  mobile: '0px',        // Mobile devices
  tablet: '768px',      // Tablets
  desktop: '1024px',    // Desktop
  'desktop-lg': '1280px',  // Large desktop
  'desktop-xl': '1536px',  // Ultra-wide screens
}
```

### Tailwind Classes

- Mobile: Base styles (no prefix)
- Tablet: `md:*`
- Desktop: `lg:*`
- Large Desktop: `xl:*`
- Ultra-wide: `2xl:*`

### Usage in Components

```tsx
// Responsive padding
<div className="p-4 md:p-6 lg:p-8 xl:p-10">

// Responsive text
<h1 className="text-2xl md:text-3xl lg:text-4xl">

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
```

## ⚙️ Theme Switching

### Setup

The `ThemeProvider` is already included in the root layout via `Providers`.

### Using the Theme Hook

```tsx
'use client';

import { useThemeContext } from '@/components/ui/theme/ThemeProvider';

function MyComponent() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useThemeContext();

  return (
    <div>
      <p>Current theme: {resolvedTheme}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <button onClick={() => setTheme('light')}>Light</button>
      <button onClick={() => setTheme('dark')}>Dark</button>
      <button onClick={() => setTheme('system')}>System</button>
    </div>
  );
}
```

### Theme Toggle Component

```tsx
import { ThemeToggle } from '@/components/ui/theme/ThemeToggle';

<ThemeToggle />
```

## 📦 Reusable Components

### Heading Component

```tsx
import { Heading } from '@/components/ui/common';

// Basic usage
<Heading level={1}>Main Title</Heading>

// With custom props
<Heading
  as="h2"
  level={2}
  size="3xl"
  weight="bold"
  color="primary"
  align="center"
  responsive
>
  Responsive Heading
</Heading>

// Semantic HTML
<Heading as="h1">Page Title</Heading>
<Heading as="h2" size="2xl">Section Title</Heading>
```

**Props:**
- `as`: HTML element type ('h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6')
- `level`: Heading level (1-6)
- `size`: Custom size override
- `weight`: Font weight
- `color`: Text color variant
- `align`: Text alignment
- `responsive`: Enable responsive sizing (default: true)

### Text Component

```tsx
import { Text } from '@/components/ui/common';

// Basic usage
<Text>Regular paragraph text</Text>

// With custom props
<Text
  as="span"
  size="lg"
  weight="medium"
  color="muted"
  align="center"
  truncate
>
  Truncated text
</Text>

// Line clamping
<Text lineClamp={3}>
  Long text that will be clamped to 3 lines...
</Text>
```

**Props:**
- `as`: HTML element type ('p' | 'span' | 'div' | 'label' | 'small' | 'strong' | 'em')
- `size`: Font size
- `weight`: Font weight
- `color`: Text color variant (includes semantic colors)
- `align`: Text alignment
- `truncate`: Enable text truncation
- `lineClamp`: Number of lines to clamp (1-6)

### Button Component

The existing shadcn Button component already uses theme variables:

```tsx
import { Button } from '@/components/ui/button';

<Button variant="default">Primary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
```

### Card Component

The existing shadcn Card component uses theme variables:

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Card content
  </CardContent>
</Card>
```

### InputField Component

The existing InputField component uses theme variables:

```tsx
import { InputField } from '@/components/ui/input-field';

<InputField
  label="Email"
  type="email"
  error={errors.email?.message}
  required
/>
```

### Avatar Component

The existing Avatar component uses theme variables:

```tsx
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

<Avatar>
  <AvatarImage src={user.avatar} />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

## 🖌️ Example Usage

### Complete Page Example

```tsx
'use client';

import { Heading } from '@/components/ui/common';
import { Text } from '@/components/ui/common';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme/ThemeToggle';

export default function ExamplePage() {
  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with theme toggle */}
        <div className="flex items-center justify-between">
          <Heading level={1} size="4xl" responsive>
            Example Page
          </Heading>
          <ThemeToggle />
        </div>

        {/* Responsive grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <Heading level={3} size="xl">
                  Card Title
                </Heading>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Text size="base" color="muted">
                Card content with responsive design
              </Text>
            </CardContent>
          </Card>
        </div>

        {/* Semantic colors */}
        <div className="space-y-4">
          <Text color="success">Success message</Text>
          <Text color="warning">Warning message</Text>
          <Text color="info">Info message</Text>
          <Text color="destructive">Error message</Text>
        </div>
      </div>
    </div>
  );
}
```

## 🎨 Using Theme Variables in CSS

### Direct CSS Variable Usage

```css
.my-component {
  background-color: var(--color-primary);
  color: var(--color-primary-foreground);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}
```

### Tailwind Classes

All theme variables are available as Tailwind classes:

```tsx
<div className="bg-primary text-primary-foreground border-border rounded-lg shadow-md">
```

## 📱 Responsive Design Best Practices

1. **Mobile-First Approach**: Start with mobile styles, then add larger breakpoints
2. **Use Container**: Use `container` class for max-width and centering
3. **Responsive Typography**: Use responsive text classes (`text-2xl md:text-3xl lg:text-4xl`)
4. **Flexible Grids**: Use responsive grid classes (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
5. **Spacing**: Adjust padding/margin for different screen sizes
6. **Hide/Show**: Use `hidden md:block` for responsive visibility

## ✅ Best Practices

1. **Always use theme variables** - Don't hardcode colors
2. **Use semantic colors** - Use `success`, `warning`, `info`, `destructive` for appropriate contexts
3. **Responsive by default** - Make components responsive from the start
4. **Test on multiple devices** - Test on mobile, tablet, and desktop
5. **Consistent spacing** - Use the spacing scale consistently
6. **Accessible contrast** - Ensure text meets WCAG contrast requirements
7. **Smooth transitions** - Theme switching includes smooth transitions

## 🚀 Getting Started

1. The theme system is already set up in your app
2. Use `Heading` and `Text` components for typography
3. Use `ThemeToggle` in your navigation
4. All existing shadcn components already use theme variables
5. Customize colors in `src/styles/global.css` if needed

## 📝 Notes

- Theme switching is persisted in localStorage
- System theme preference is respected when set to 'system'
- All transitions are smooth (150ms)
- Typography scales responsively based on screen size
- All colors are defined in OKLCH color space for better color consistency

