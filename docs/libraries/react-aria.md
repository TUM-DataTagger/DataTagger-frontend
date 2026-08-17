# React Aria Components + CVA Styling

> Guide for building accessible UI components with React Aria Components and CVA in this codebase.

## Quick Start

### Installation

```bash
pnpm --filter @fdm-frontend/website add react-aria-components cva tailwind-merge
```

## Core Concepts

### 1. CVA Configuration

The codebase uses a custom CVA setup with Tailwind Merge integration:

```typescript
// src/styles/cva.ts
import { defineConfig } from 'cva';
import { extendTailwindMerge } from 'tailwind-merge';

const twMergeConfig = {
  classGroups: {
    'font-size': [
      'text-base-heading-xs',
      'text-base-heading-sm',
      'text-base-heading-md',
      // ... custom text variants
    ],
  },
};

const twMerge = extendTailwindMerge({
  extend: twMergeConfig,
});

export const { cva, cx, compose } = defineConfig({
  hooks: {
    onComplete: (className) => twMerge(className),
  },
});
```

**Exports:**
- `cva` - Create variant-based class functions
- `cx` - Merge class names (replaces `clsx`/`cn`)
- `compose` - Combine multiple CVA functions

### 2. Component Wrapper Pattern

React Aria Components are wrapped with CVA for consistent styling:

```typescript
// src/components/ui/Button.tsx
import { Button as RACButton, composeRenderProps } from 'react-aria-components';
import { buttonStyles } from '@/styles/ui/button';

export function Button(props: ButtonProps) {
  return (
    <RACButton
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        buttonStyles({
          ...renderProps,  // isHovered, isPressed, isFocused, etc.
          variant: props.variant,
          size: props.size,
          isDestructive: props.isDestructive,
          className,
        }),
      )}
    >
      {(values) => (
        <>{typeof props.children === 'function' ? props.children(values) : props.children}</>
      )}
    </RACButton>
  );
}
```

### 3. The `composeRenderProps` Pattern

React Aria Components use render props for state-dependent styling. Use `composeRenderProps` to merge consumer classes with internal styles:

```typescript
// src/styles/util.ts
import { composeRenderProps } from 'react-aria-components';
import { cx } from '@/styles/cva';

export function composeTailwindRenderProps<Type>(
  className: string | ((v: Type) => string) | undefined,
  tw: string,
): string | ((v: Type) => string) {
  return composeRenderProps(className, (className) => cx(tw, className));
}
```

**Usage:**
```typescript
export function Checkbox(props: CheckboxProps) {
  return (
    <RACCheckbox
      {...props}
      className={composeTailwindRenderProps(props.className, 'group block disabled:opacity-38')}
    >
      {/* children */}
    </RACCheckbox>
  );
}
```

## Styling System

### Color System

Colors are defined as CSS custom properties in `src/styles/base.css`:

```css
@theme {
  /* Neutral - grayscale */
  --color-base-neutral-0: #ffffff;
  --color-base-neutral-100: #e6e6e6;
  --color-base-neutral-500: #808080;
  --color-base-neutral-900: #191919;

  /* Lavender - primary accent */
  --color-base-lavender-100: #e9e6fb;
  --color-base-lavender-500: #8f81ea;
  --color-base-lavender-900: #1d1a2f;

  /* Sunset - error/destructive */
  --color-base-sunset-100: #ffe1df;
  --color-base-sunset-500: #ff6a5e;

  /* Crystal - info */
  --color-base-crystal-100: #dfedff;
  --color-base-crystal-500: #5ea4ff;

  /* Tangerine - warning */
  --color-base-tangerine-100: #fdefd2;
  --color-base-tangerine-500: #f7b11e;
}
```

**Usage in Tailwind:**
```tsx
<div className="bg-base-lavender-500 text-base-neutral-0">
  Primary action
</div>
<div className="text-base-sunset-500">
  Error message
</div>
```

### Typography System

```css
@theme {
  /* Headings */
  --text-base-heading-xl: 2.813rem;
  --text-base-heading-lg: 2.25rem;
  --text-base-heading-md: 2rem;
  --text-base-heading-sm: 1.75rem;
  --text-base-heading-xs: 1.5rem;

  /* Labels */
  --text-base-label-xl: 1.125rem;
  --text-base-label-lg: 1rem;
  --text-base-label-md: 0.875rem;
  --text-base-label-sm: 0.75rem;

  /* Body */
  --text-base-xl: 1.125rem;
  --text-base-lg: 1rem;
  --text-base-md: 0.875rem;
  --text-base-sm: 0.75rem;
}
```

**Usage:**
```tsx
<h1 className="text-base-heading-md">Page Title</h1>
<span className="text-base-label-sm">Form label</span>
<p className="text-base-md">Body text</p>
```

### Reusable Focus Ring

A shared focus ring style for keyboard navigation:

```typescript
// src/styles/ui/focusRing.ts
import { cva } from '@/styles/cva';

export const focusRing = cva({
  base: 'outline-base-lavender-400 dark:outline-base-lavender-600 outline-offset-2 forced-colors:outline-[Highlight]',
  variants: {
    isFocusVisible: {
      true: 'outline-2',
      false: 'outline-0',
    },
  },
});
```

### Style Composition with `compose`

Combine multiple CVA functions for shared behaviors:

```typescript
// src/styles/ui/input.ts
import { compose, cva } from '@/styles/cva';
import { focusRing } from './focusRing';
import { fieldBorderStyles } from './field';

export const inputStyles = compose(
  focusRing,           // Focus behavior
  fieldBorderStyles,   // Invalid/disabled borders
  cva({
    base: 'h-10 rounded-sm border px-3 py-[10px] transition bg-base-neutral-0 dark:bg-base-neutral-800',
    variants: {
      isFocused: {
        true: 'outline-2',
        false: 'outline-0',
      },
    },
  }),
);
```

## The `data-slot` Pattern

Use `data-slot` attributes for semantic targeting in CSS:

```typescript
// Component definition
export function InputGroup(props: RACGroupProps) {
  return (
    <RACGroup {...props} data-slot="control">
      {props.children}
    </RACGroup>
  );
}

export function FieldError(props: RACFieldErrorProps) {
  return (
    <RACFieldError {...props}>
      <AlertCircleIcon data-slot="icon" size={18} />
      {props.children}
    </RACFieldError>
  );
}
```

```typescript
// Styling with data-slot selectors
export const inputGroupStyles = cva({
  base: [
    'relative isolate block',
    // Target icons inside
    'has-[>[data-slot=icon]:first-child]:[&_input]:pl-(--input-gutter-start)',
    '*:data-[slot=icon]:pointer-events-none *:data-[slot=icon]:absolute',
    '*:data-[slot=icon]:top-2 *:data-[slot=icon]:z-10 *:data-[slot=icon]:size-6',
  ],
});
```

**Common slots:**
| Slot | Usage |
|------|-------|
| `control` | Wrapper containers |
| `icon` | Icon elements |
| `label` | Label elements |
| `dialog`, `dialog-header`, `dialog-body`, `dialog-footer` | Dialog sections |
| `indicator`, `check-indicator`, `selected-indicator` | Visual indicators |
| `tab`, `tab-list` | Tab components |
| `menu-trigger`, `menu-content` | Menu components |

## Creating Components

### Button Example

```typescript
// src/styles/ui/button.ts
import { compose, cva } from '@/styles/cva';
import { focusRing } from './focusRing';

export const buttonStyles = compose(
  focusRing,
  cva({
    base: [
      'text-base-label-md relative isolate inline-flex place-content-center place-items-center gap-2',
      'border border-transparent',
      '*:data-[slot=icon]:size-4.5 *:data-[slot=icon]:shrink-0',
    ],
    variants: {
      variant: {
        outline: [
          'h-10 rounded-sm px-4 py-2.5',
          'border-base-neutral-300 bg-base-neutral-0 text-base-neutral-800',
          'hover:bg-base-neutral-700 hover:text-base-neutral-40 hover:border-transparent',
          'dark:bg-base-neutral-800 dark:border-base-neutral-500 dark:text-base-neutral-100',
          'dark:hover:bg-base-neutral-100 dark:hover:text-base-neutral-900',
        ],
        filled: [
          'h-10 rounded-sm px-4 py-2.5',
          'bg-base-neutral-700 text-base-neutral-40',
          'hover:bg-base-neutral-500',
          'dark:bg-base-neutral-100 dark:text-base-neutral-900',
          'dark:hover:bg-base-neutral-300',
        ],
        discreet: [
          'h-10 rounded-sm px-4 py-2.5',
          'bg-transparent text-base-neutral-800 dark:text-base-neutral-100',
          'hover:bg-base-neutral-100 dark:hover:bg-base-neutral-700',
        ],
      },
      size: {
        default: null,
        sm: 'h-8 px-3 py-1.5',
        icon: 'size-10 shrink-0 rounded-full p-2.5',
      },
      isDestructive: {
        true: null,
        false: null,
      },
    },
    compoundVariants: [
      {
        variant: 'discreet',
        isDestructive: true,
        className: [
          'text-base-sunset-600 dark:text-base-sunset-400',
          'hover:bg-base-sunset-100 hover:text-base-sunset-700',
        ],
      },
    ],
    defaultVariants: {
      variant: 'outline',
      size: 'default',
    },
  }),
);
```

```typescript
// src/components/ui/Button.tsx
'use client';

import { Button as RACButton, composeRenderProps } from 'react-aria-components';
import type { ButtonProps as RACButtonProps } from 'react-aria-components';
import { buttonStyles } from '@/styles/ui/button';
import type { VariantProps } from 'cva';

type ButtonProps = RACButtonProps &
  VariantProps<typeof buttonStyles> & {
    readonly isDestructive?: boolean;
  };

export function Button(props: ButtonProps) {
  return (
    <RACButton
      {...props}
      className={composeRenderProps(props.className, (className, renderProps) =>
        buttonStyles({
          ...renderProps,
          variant: props.variant,
          size: props.size,
          isDestructive: props.isDestructive,
          className,
        }),
      )}
    >
      {(values) => (
        <>{typeof props.children === 'function' ? props.children(values) : props.children}</>
      )}
    </RACButton>
  );
}
```

### Checkbox Example

```typescript
// src/components/ui/Checkbox.tsx
'use client';

import { Checkbox as RACCheckbox, composeRenderProps } from 'react-aria-components';
import { CheckIcon, MinusIcon } from 'lucide-react';
import { compose, cva, cx } from '@/styles/cva';
import { focusRing } from '@/styles/ui/focusRing';
import { composeTailwindRenderProps } from '@/styles/util';

const boxStyles = compose(
  focusRing,
  cva({
    base: 'flex shrink-0 place-content-center place-items-center transition',
    variants: {
      variant: {
        default: [
          'size-4 rounded-xs border-[1.5px] *:data-[slot=check-indicator]:size-3.5',
          'border-base-neutral-300 bg-base-neutral-0 text-base-neutral-40',
          'dark:border-base-neutral-300 dark:bg-base-neutral-800',
          'group-hover:border-base-neutral-200 dark:group-hover:border-base-neutral-600',
        ],
      },
      isSelected: {
        true: [
          'bg-base-neutral-700 dark:bg-base-neutral-100 border-transparent',
          'dark:text-base-neutral-900',
          'group-hover:bg-base-neutral-500 dark:group-hover:bg-base-neutral-300',
        ],
      },
    },
  }),
);

export function Checkbox(props: CheckboxProps) {
  return (
    <RACCheckbox
      {...props}
      className={composeTailwindRenderProps(props.className, 'group block disabled:opacity-38')}
    >
      {composeRenderProps(props.children, (children, { isSelected, isIndeterminate, ...renderProps }) => (
        <>
          <div
            className={boxStyles({
              ...renderProps,
              isSelected: isSelected || isIndeterminate,
              variant: props.variant ?? 'default',
            })}
          >
            {isIndeterminate ? (
              <MinusIcon aria-hidden data-slot="check-indicator" strokeWidth={3} />
            ) : isSelected ? (
              <CheckIcon aria-hidden data-slot="check-indicator" strokeWidth={3} />
            ) : null}
          </div>
          {children}
        </>
      ))}
    </RACCheckbox>
  );
}
```

## State Selectors

React Aria provides render props for component state. Common selectors:

| Selector | Description |
|----------|-------------|
| `isHovered` | Mouse hover state |
| `isPressed` | Active/pressed state |
| `isFocused` | Any focus state |
| `isFocusVisible` | Keyboard focus only |
| `isSelected` | Selected item |
| `isDisabled` | Disabled state |
| `isIndeterminate` | Checkbox partial state |
| `isInvalid` | Form validation error |
| `isOpen` | Popover/menu open state |

**In CVA variants:**
```typescript
cva({
  variants: {
    isHovered: { true: 'bg-base-neutral-100' },
    isPressed: { true: 'scale-95' },
    isFocusVisible: { true: 'outline-2' },
    isDisabled: { true: 'opacity-38 cursor-not-allowed' },
  },
})
```

**In Tailwind (group selectors):**
```tsx
<div className="group">
  <span className="group-hover:text-base-lavender-500">
    Hover the parent
  </span>
</div>
```

## File Organization

```
src/styles/
├── base.css               # Tailwind theme variables
├── cva.ts                 # CVA config with cx and compose
├── fonts.ts               # Font imports
├── util.ts                # composeTailwindRenderProps helper
└── ui/
    ├── alert.ts           # Alert styles
    ├── button.ts          # Button styles
    ├── field.ts           # Form field border styles
    ├── focusRing.ts       # Shared focus ring
    ├── gridCard.ts        # Grid card layout
    ├── input.ts           # Input field styles
    ├── link.ts            # Link styles
    ├── listbox.ts         # ListBox item styles
    └── popover.ts         # Popover animations
```

## Creating New Components Checklist

1. **Create style file** in `src/styles/ui/[component].ts`
   - Import `cva`, `compose` from `@/styles/cva`
   - Import `focusRing` if interactive
   - Define variants for all states

2. **Create component file** in `src/components/ui/[Component].tsx`
   - Import from `react-aria-components`
   - Use `composeRenderProps` for className
   - Add `data-slot` attributes for CSS targeting
   - Export typed props interface

3. **Support dark mode** with `dark:` prefix
4. **Support forced colors** with `forced-colors:` for accessibility
5. **Use semantic `data-slot`** for structural elements

## Common Gotchas

1. **Missing `'use client'`**: All interactive components need the directive
2. **Wrong state prop**: Use `isFocusVisible` not `isFocused` for keyboard focus styling
3. **Broken composition**: Remember to spread `renderProps` into CVA function
4. **Dark mode**: Always provide `dark:` variants for colors
5. **Forced colors**: Include `forced-colors:` for Windows High Contrast support

## Documentation Links

- [React Aria Components](https://react-spectrum.adobe.com/react-aria/components.html)
- [CVA Documentation](https://cva.style/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
