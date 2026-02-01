# CodeExtract Design System

A dark, terminal-inspired design system with sharp edges, monospace typography, and intentional color usage.

---

## Core Principles

1. **No Border Radius** - All elements use `rounded-none` for sharp, technical aesthetic
2. **Dark First** - Dark zinc backgrounds create focus and reduce eye strain
3. **Monospace Typography** - `font-mono` for technical, developer-focused feel
4. **Smart Color** - Color is used intentionally for status and hierarchy, not decoration
5. **Minimal Shadows** - Rely on borders and subtle gradients instead of heavy shadows

---

## Color Palette

### Backgrounds
```
bg-zinc-950  (#09090b)  - Page background
bg-zinc-900  (#18181b)  - Card/surface background
bg-zinc-900/50         - Card background with transparency
bg-zinc-800  (#27272a)  - Elevated surface, borders
bg-black               - iframe/preview backgrounds
```

### Borders
```
border-zinc-700  (#3f3f46)  - Primary borders
border-zinc-800  (#27272a)  - Subtle borders
border-zinc-500  (#71717a)  - Hover state borders
border-dashed border-zinc-800  - Empty state borders
```

### Text
```
text-zinc-100  (#f4f4f5)  - Primary text (headings, important)
text-zinc-400  (#a1a1aa)  - Secondary text
text-zinc-500  (#71717a)  - Tertiary text
text-zinc-600  (#52525b)  - Muted text (timestamps, labels)
text-zinc-700  (#3f3f46)  - Very muted text
```

### Status Colors
```css
/* Online/Success */
bg-green-500         - Status dot
text-green-400       - Success text
border-green-500/30  - Success border
bg-green-500/10      - Success background
shadow-green-500/50  - Glow effect

/* Warning/Pending */
bg-yellow-500        - Status dot
shadow-yellow-500/50 - Glow effect
animate-pulse        - Animation

/* Error */
bg-red-500           - Status dot
shadow-red-500/50    - Glow effect

/* Stopped/Inactive */
bg-zinc-500          - Status dot

/* Unknown */
bg-orange-500        - Status dot
```

---

## Typography

### Font Families
```css
font-mono  /* JetBrains Mono, SF Mono, Consolas, monospace */
```

All text should use `font-mono` for consistency.

### Font Sizes
```
text-xs   (12px)  - Micro text, status badges, timestamps
text-sm   (14px)  - Body text, labels
text-base (16px)  - Standard paragraphs (rarely used)
```

### Weights
```
font-normal  - Body text
font-medium  - Slightly emphasized
font-semibold - Not typically used (monospace doesn't need it)
```

---

## Components

### Status Dot

A small colored indicator with optional glow effect.

```tsx
function StatusDot({ status }: { status: 'online' | 'stopped' | 'errored' | 'launching' | 'unknown' }) {
  const colors = {
    online: 'bg-green-500 shadow-green-500/50',
    launching: 'bg-yellow-500 shadow-yellow-500/50 animate-pulse',
    stopped: 'bg-zinc-500',
    errored: 'bg-red-500 shadow-red-500/50',
    unknown: 'bg-orange-500',
  };

  return (
    <span
      className={`inline-block w-2 h-2 rounded-full shadow-sm ${colors[status]}`}
      title={status}
    />
  );
}
```

### Card

Sharp-edged container with border and hover states.

```tsx
<div className="rounded-none border border-zinc-700 bg-zinc-900/50 hover:border-zinc-500 transition-colors">
  {/* Header */}
  <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-900">
    {/* ... */}
  </div>

  {/* Content */}
  <div className="relative h-48 bg-black overflow-hidden">
    {/* ... */}
  </div>

  {/* Footer */}
  <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-800 bg-zinc-900/80">
    {/* ... */}
  </div>
</div>
```

### Status Badge

Inline badge for status indication.

```tsx
<span className="px-2 py-0.5 font-mono text-xs border border-green-500/30 text-green-400 bg-green-500/10">
  approved
</span>
```

### Empty State

```tsx
<div className="border border-dashed border-zinc-800 rounded-none p-12 text-center">
  <div className="font-mono text-sm text-zinc-600 mb-2">
    no items found
  </div>
  <div className="font-mono text-xs text-zinc-700 mb-4">
    description of what to do
  </div>
  {/* Optional action button */}
</div>
```

### ASCII Title

For page headers with visual impact.

```tsx
const TITLE_TEXT = `
 █████╗ ██████╗ ██████╗ ██████╗  ██████╗ ██╗   ██╗███████╗██████╗
██╔══██╗██╔══██╗██╔══██╗██╔══██╗██╔═══██╗██║   ██║██╔════╝██╔══██╗
███████║██████╔╝██████╔╝██████╔╝██║   ██║██║   ██║█████╗  ██║  ██║
██╔══██║██╔═══╝ ██╔═══╝ ██╔══██╗██║   ██║╚██╗ ██╔╝██╔══╝  ██║  ██║
██║  ██║██║     ██║     ██║  ██║╚██████╔╝ ╚████╔╝ ███████╗██████╔╝
╚═╝  ╚═╝╚═╝     ╚═╝     ╚═╝  ╚═╝ ╚═════╝   ╚═══╝  ╚══════╝╚═════╝
`;

<pre className="overflow-x-auto font-mono text-xs text-zinc-400 mb-6">
  {TITLE_TEXT}
</pre>
```

---

## Layout Patterns

### Page Container

```tsx
<div className="min-h-screen bg-zinc-950 text-zinc-100 px-6 py-4">
  {/* Content */}
</div>
```

### Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards */}
</div>
```

### Header Bar

```tsx
<div className="flex items-center justify-between mb-6">
  <div className="flex items-center gap-4">
    {/* Left side: back button, title, etc */}
  </div>
  <div className="flex items-center gap-3 font-mono text-xs">
    {/* Right side: legend, actions */}
  </div>
</div>
```

### Footer Stats

```tsx
<div className="mt-8 pt-4 border-t border-zinc-800/50">
  <div className="flex items-center gap-4 font-mono text-xs text-zinc-600">
    <span>page/section</span>
    <span className="text-zinc-700">|</span>
    <span>additional info</span>
  </div>
</div>
```

---

## Button Variants

Use shadcn Button with custom styling:

### Ghost Button
```tsx
<Button
  variant="ghost"
  size="sm"
  className="gap-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
>
  <ArrowLeft className="w-4 h-4" />
  Back
</Button>
```

### Outline Button
```tsx
<Button
  variant="outline"
  className="font-mono text-xs border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
>
  Action
</Button>
```

---

## Interactive States

### Hover
```css
hover:border-zinc-500  /* Border lightens */
hover:text-zinc-100    /* Text brightens */
hover:bg-zinc-800      /* Background lightens */
transition-colors      /* Always include */
```

### Focus
```css
focus:outline-none
focus:ring-2
focus:ring-zinc-500
focus:ring-offset-2
focus:ring-offset-zinc-950
```

### Disabled
```css
opacity-50
cursor-not-allowed
pointer-events-none
```

---

## Transitions

Always use smooth transitions:
```css
transition-colors   /* Color changes */
transition-opacity  /* Fade in/out */
transition-all      /* Multiple properties */
```

Duration: Default Tailwind (150ms) is fine.

---

## Gradients

For content overlays:
```tsx
<div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent pointer-events-none" />
```

---

## Loading States

### Spinner
Use Loader2 from lucide-react with `animate-spin`:
```tsx
<Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
```

### Loading Text
```tsx
<span className="font-mono text-sm text-zinc-500">loading...</span>
```

### Skeleton
```tsx
<span className="font-mono text-xs text-zinc-600">[ LOADING ]</span>
```

---

## Icon Usage

Use lucide-react icons. Common sizes:
```css
w-4 h-4   /* In buttons, inline */
w-5 h-5   /* Standalone small */
w-6 h-6   /* Standalone medium */
```

Icon colors should match text hierarchy:
```css
text-zinc-400  /* Secondary */
text-zinc-500  /* Tertiary */
```

---

## Quick Reference

### Class Combinations

**Dark card:**
```
rounded-none border border-zinc-700 bg-zinc-900/50 hover:border-zinc-500 transition-colors
```

**Primary text:**
```
font-mono text-sm text-zinc-100
```

**Secondary text:**
```
font-mono text-xs text-zinc-500
```

**Muted text:**
```
font-mono text-xs text-zinc-600
```

**Success badge:**
```
px-2 py-0.5 font-mono text-xs border border-green-500/30 text-green-400 bg-green-500/10
```

**Page background:**
```
min-h-screen bg-zinc-950 text-zinc-100 px-6 py-4
```

---

## Shadcn Integration

The design system works with shadcn/ui components. Override these classes:

- Remove border-radius: Add `rounded-none` to override default radius
- Dark backgrounds: Use `bg-zinc-900` or `bg-zinc-800`
- Borders: Use `border-zinc-700`
- Text: Use appropriate zinc color classes

Most shadcn components work out of the box with the `dark` class applied to the root.
