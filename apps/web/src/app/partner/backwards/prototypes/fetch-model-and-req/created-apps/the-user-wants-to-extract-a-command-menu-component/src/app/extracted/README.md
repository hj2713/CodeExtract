# Command Menu Component

## What this demonstrates

This example demonstrates a fully-featured command palette interface (keyboard-driven command menu) with search, keyboard navigation, grouped commands, and keyboard shortcuts. It's the same pattern used by modern applications like VS Code, Linear, and Vercel's dashboard to provide quick access to commands and navigation.

## Original implementation

The command menu is extracted from the [shadcn/ui](https://ui.shadcn.com/) landing page. It's a production-grade implementation that serves as the primary navigation interface on their documentation site.

The original implementation supports:
- Complex search with fumadocs integration for full-text search
- Dynamic page tree navigation from their documentation
- Color palette browsing and copying
- Component installation commands
- Block browsing
- Advanced keyboard interactions (Cmd+C to copy highlighted items)

Key files from source:
- `apps/v4/components/command-menu.tsx` — Main command menu implementation with search integration
- `apps/v4/registry/new-york-v4/ui/command.tsx` — Base Command UI components built on cmdk
- `apps/v4/registry/new-york-v4/ui/dialog.tsx` — Dialog wrapper for modal presentation
- `apps/v4/hooks/use-mutation-observer.ts` — Custom hook for tracking item selection state
- `apps/v4/registry/new-york-v4/examples/command-dialog.tsx` — Simple example usage

## Dependencies

### NPM packages required

- **cmdk** (v1.1.1) — The underlying command menu primitive by Paco Coursey. Provides the keyboard navigation, search filtering, and accessibility features
- **@radix-ui/react-dialog** (v1.1.5) — Accessible dialog/modal primitive for the command menu overlay
- **@radix-ui/react-slot** (v1.1.1) — Used by the Button component for composition
- **lucide-react** (v0.474.0) — Icon library for command icons and UI elements
- **class-variance-authority** (v0.7.1) — For managing button variant styles
- **clsx** (v2.1.1) — Utility for constructing className strings
- **tailwind-merge** (v3.0.1) — Utility for merging Tailwind CSS classes without conflicts

### Code ported from source

- **cn utility** from `lib/utils.ts` — Combines clsx and tailwind-merge for efficient class name merging
- **Command components** from `registry/new-york-v4/ui/command.tsx` — Styled wrappers around cmdk primitives
- **Dialog components** from `registry/new-york-v4/ui/dialog.tsx` — Modal dialog implementation
- **Button component** from `registry/new-york-v4/ui/button.tsx` — Reusable button with variants

### Mocked in this example

- **Search integration** — The original uses fumadocs-core for full-text search across documentation. We've removed this and use only cmdk's built-in filtering
- **Navigation/routing** — The original integrates with Next.js router to navigate to pages. We use console.log to demonstrate command execution
- **Dynamic content** — The original loads page tree, colors, and blocks from the site structure. We use hardcoded command items
- **Analytics tracking** — The original tracks search queries and interactions. We've removed all tracking
- **Copy to clipboard** — The original has sophisticated clipboard integration. We've simplified to just show the concept

## How to use

### Installation

1. Install the required dependencies:

```bash
npm install cmdk @radix-ui/react-dialog @radix-ui/react-slot lucide-react class-variance-authority clsx tailwind-merge
```

2. Set up Tailwind CSS with the required configuration. Copy the CSS variables from `globals.css.example` to your global CSS file:

```css
/* Add to your app/globals.css or styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* ... see globals.css.example for full variables */
  }
}
```

3. Update your `tailwind.config.ts` to include the theme extensions (see `tailwind.config.example.ts` for the full configuration).

### Basic usage

```tsx
import { CommandMenu } from "./command-menu"

export default function Page() {
  return (
    <div>
      <CommandMenu />
    </div>
  )
}
```

The command menu will automatically:
- Open when user presses `⌘K` or `/`
- Close on `Escape` or when clicking outside
- Allow navigation with arrow keys
- Filter items as user types
- Execute commands on `Enter`

### Customizing commands

Edit the `command-menu.tsx` file to add your own command groups:

```tsx
<CommandGroup heading="Your Custom Group">
  <CommandItem onSelect={() => runCommand(() => {
    // Your custom action here
    console.log("Custom action")
  })}>
    <YourIcon />
    <span>Your Command</span>
    <CommandShortcut>⌘Y</CommandShortcut>
  </CommandItem>
</CommandGroup>
```

### Keyboard shortcuts

- **⌘K** or **/** — Open/close command menu
- **↑/↓** — Navigate between items
- **Enter** — Execute selected command
- **Escape** — Close command menu
- Type to search/filter commands

### Accessibility

The command menu is fully accessible:
- Keyboard navigable
- Screen reader friendly (uses proper ARIA attributes from cmdk)
- Focus management
- Semantic HTML structure

## Architecture notes

The implementation uses a composition pattern:
1. **Command** — Container that manages keyboard interaction and search
2. **CommandInput** — Search input with icon
3. **CommandList** — Scrollable container for items
4. **CommandGroup** — Logical grouping of related commands
5. **CommandItem** — Individual command with icon, label, and optional shortcut
6. **CommandDialog** — Wraps Command in a modal dialog

The keyboard navigation and search filtering are handled automatically by the `cmdk` library, which uses the Command Score algorithm for fuzzy matching.
