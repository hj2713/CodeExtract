# AppearanceSettings Component

## What this demonstrates

This example demonstrates a complete, production-ready settings panel component that handles appearance and compute environment configuration. The component showcases:

- **Complex form layouts** using a sophisticated Field component system with horizontal/vertical orientations
- **Controlled input patterns** with validation and constraints (GPU count between 1-99)
- **Composite UI patterns** combining buttons, inputs, radio groups, and switches
- **Radix UI integration** for accessible, unstyled primitives
- **Tailwind CSS** with advanced features like container queries, data attributes, and variant-based styling
- **Type-safe component APIs** using TypeScript and class-variance-authority

## Original implementation

The source repository uses this component as a demonstration of their design system's form components. It showcases how multiple primitive components can be composed into a cohesive settings panel.

### Key files from source:

- **`apps/v4/app/(app)/(root)/components/appearance-settings.tsx`** — Main component implementation
- **`apps/v4/examples/radix/ui/field.tsx`** — Field layout component system with 10+ sub-components
- **`apps/v4/examples/radix/ui/button.tsx`** — Button with CVA variants and Radix Slot support
- **`apps/v4/examples/radix/ui/button-group.tsx`** — Button group container with orientation support
- **`apps/v4/examples/radix/ui/input.tsx`** — Styled input component
- **`apps/v4/examples/radix/ui/radio-group.tsx`** — Radio group using Radix primitives
- **`apps/v4/examples/radix/ui/switch.tsx`** — Switch toggle using Radix primitives
- **`apps/v4/examples/radix/ui/separator.tsx`** — Visual separator component
- **`apps/v4/examples/radix/ui/label.tsx`** — Label component using Radix primitives
- **`apps/v4/examples/radix/lib/utils.ts`** — cn() utility for merging Tailwind classes

## Dependencies

### NPM packages required

- **`@radix-ui/react-slot`** — Polymorphic component composition (used in Button)
- **`@radix-ui/react-label`** — Accessible label primitive
- **`@radix-ui/react-separator`** — Separator primitive
- **`@radix-ui/react-switch`** — Switch/toggle primitive
- **`@radix-ui/react-radio-group`** — Radio group primitive
- **`class-variance-authority`** — Type-safe variant styling system
- **`clsx`** — Utility for constructing className strings
- **`tailwind-merge`** — Intelligently merge Tailwind CSS classes
- **`@tabler/icons-react`** — Icon library (IconPlus, IconMinus)
- **`lucide-react`** — Icon library (Circle icon for radio indicator)

### Code ported from source

All UI components have been ported from the source repository with full functionality:

- **`components/ui/button.tsx`** from `source/apps/v4/examples/radix/ui/button.tsx` — Button component with 6 variants and 7 sizes
- **`components/ui/button-group.tsx`** from `source/apps/v4/examples/radix/ui/button-group.tsx` — Groups buttons with automatic border handling
- **`components/ui/field.tsx`** from `source/apps/v4/examples/radix/ui/field.tsx` — Complete field system with 10 sub-components
- **`components/ui/input.tsx`** from `source/apps/v4/examples/radix/ui/input.tsx` — Styled input element
- **`components/ui/radio-group.tsx`** from `source/apps/v4/examples/radix/ui/radio-group.tsx` — Radio group with custom indicator
- **`components/ui/switch.tsx`** from `source/apps/v4/examples/radix/ui/switch.tsx` — Toggle switch with animations
- **`components/ui/separator.tsx`** from `source/apps/v4/examples/radix/ui/separator.tsx` — Visual separator
- **`components/ui/label.tsx`** from `source/apps/v4/examples/radix/ui/label.tsx` — Accessible label
- **`lib/utils.ts`** from `source/apps/v4/examples/radix/lib/utils.ts` — cn() utility function

### Mocked in this example

- **Icon system** — The original uses `IconPlaceholder` component with dynamic icon library selection. We simplified this to use `lucide-react` directly (Circle icon in RadioGroupItem)
- **Database/API** — The original doesn't persist settings. We added mock server actions in `actions.ts` to demonstrate how this would work
- **User context** — Settings would typically be user-specific. We mock this with local component state

## Component Architecture

### Field Component System

The Field components use a sophisticated composition pattern:

```
FieldSet
└── FieldGroup (container with @container queries)
    ├── FieldSet (nested for sections)
    │   ├── FieldLegend (section title)
    │   ├── FieldDescription (section description)
    │   └── Field (individual field)
    │       ├── FieldContent (label + description wrapper)
    │       │   ├── FieldLabel or FieldTitle
    │       │   └── FieldDescription
    │       └── [Control] (RadioGroupItem, Switch, Input, etc.)
    └── FieldSeparator (visual divider)
```

### State Management

The component uses React hooks for state:

- **`useState`** — Manages GPU count (number between 1-99)
- **`useCallback`** — Memoizes event handlers to prevent unnecessary re-renders
- **Radix primitives** — Handle RadioGroup and Switch state internally

### Styling Approach

- **Tailwind CSS** with utility classes
- **Container queries** (`@container/field-group`) for responsive field layouts
- **Data attributes** (`data-slot`, `data-variant`, `data-size`) for styling hooks
- **CVA (class-variance-authority)** for type-safe variant management
- **Dark mode** support via `dark:` prefix

## How to use

### Installation

1. Install dependencies:

```bash
npm install @radix-ui/react-slot @radix-ui/react-label @radix-ui/react-separator @radix-ui/react-switch @radix-ui/react-radio-group class-variance-authority clsx tailwind-merge @tabler/icons-react lucide-react
```

2. Ensure your `tailwind.config.js` includes:

```js
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [
    require("@tailwindcss/container-queries"),
  ],
}
```

3. Add CSS variables to your `globals.css`:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}
```

### Usage

Navigate to `/extracted` to see the component in action.

You can also import and use the component directly:

```tsx
import { AppearanceSettings } from "./page"

export default function MyPage() {
  return (
    <div className="p-8">
      <AppearanceSettings />
    </div>
  )
}
```

### Customization

#### Adjusting GPU limits

```tsx
const [gpuCount, setGpuCount] = React.useState(8)

const handleGpuAdjustment = React.useCallback((adjustment: number) => {
  setGpuCount((prevCount) =>
    Math.max(1, Math.min(999, prevCount + adjustment)) // Increased max to 999
  )
}, [])
```

#### Adding new settings fields

```tsx
<FieldSeparator />
<Field orientation="horizontal">
  <FieldContent>
    <FieldLabel htmlFor="auto-save">Auto Save</FieldLabel>
    <FieldDescription>
      Automatically save changes.
    </FieldDescription>
  </FieldContent>
  <Switch id="auto-save" defaultChecked />
</Field>
```

#### Changing field orientation

The Field component supports three orientations:
- `vertical` (default) - Label above control
- `horizontal` - Label beside control
- `responsive` - Vertical on small screens, horizontal on larger screens

```tsx
<Field orientation="responsive">
  {/* ... */}
</Field>
```

## Key Features

### 1. Accessible by Default
- All components use Radix UI primitives which are WCAG compliant
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly

### 2. Type-Safe Variants
- Uses `class-variance-authority` for type-safe component variants
- Autocomplete for variant options in TypeScript
- Compile-time validation of variant combinations

### 3. Container Queries
- Fields automatically adapt to container width, not viewport width
- More predictable responsive behavior
- Better composition in complex layouts

### 4. Dark Mode Ready
- All components support dark mode via Tailwind's `dark:` prefix
- Smooth transitions between themes
- Proper contrast ratios maintained

### 5. Extensible Design
- Easy to add new fields
- Composable components
- Clear component boundaries
- Well-documented data attributes for custom styling

## Advanced Patterns

### Server Actions Integration

```tsx
"use client"

import { saveAppearanceSettings } from "./actions"

export function AppearanceSettings() {
  const [gpuCount, setGpuCount] = React.useState(8)
  const [computeEnv, setComputeEnv] = React.useState("kubernetes")
  const [tinting, setTinting] = React.useState(true)

  const handleSave = async () => {
    const result = await saveAppearanceSettings({
      computeEnvironment: computeEnv as "kubernetes" | "vm",
      gpuCount,
      wallpaperTinting: tinting,
    })

    if (result.success) {
      toast.success(result.message)
    }
  }

  return (
    <form action={handleSave}>
      {/* ... fields ... */}
      <Button type="submit">Save Settings</Button>
    </form>
  )
}
```

### Form Validation

```tsx
import { FieldError } from "./components/ui/field"

const [errors, setErrors] = React.useState<Record<string, string>>({})

const handleGpuInputChange = React.useCallback(
  (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)

    if (isNaN(value)) {
      setErrors({ ...errors, gpuCount: "Must be a number" })
      return
    }

    if (value < 1 || value > 99) {
      setErrors({ ...errors, gpuCount: "Must be between 1 and 99" })
      return
    }

    setErrors({ ...errors, gpuCount: "" })
    setGpuCount(value)
  },
  [errors]
)

// In JSX:
<FieldError>{errors.gpuCount}</FieldError>
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Mobile 90+)

Requires support for:
- CSS Container Queries (with `@tailwindcss/container-queries` plugin)
- CSS `has()` selector
- CSS Grid
- Flexbox

## Performance Notes

- All event handlers are memoized with `useCallback`
- Components use React.memo where appropriate
- Minimal re-renders due to proper state management
- No unnecessary DOM updates

## License

This code is extracted for educational purposes. Original source is from the shadcn/ui project.
