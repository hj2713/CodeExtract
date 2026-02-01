# Quick Start Guide

Get the Command Menu running in 5 minutes!

## Prerequisites

- Next.js 14+ project with App Router
- Tailwind CSS configured
- TypeScript enabled

## Step 1: Install Dependencies

```bash
npm install cmdk @radix-ui/react-dialog @radix-ui/react-slot lucide-react class-variance-authority clsx tailwind-merge
```

## Step 2: Copy Files

Copy all files from this directory to your project:

```
your-project/
├── app/
│   └── (your-page)/
│       └── page.tsx              # Use the code from page.tsx
└── components/
    ├── command-menu.tsx          # Main command menu
    └── ui/
        ├── command.tsx           # Command primitives
        ├── dialog.tsx            # Dialog component
        └── button.tsx            # Button component
```

Or create a new folder structure like:

```
your-project/
└── components/
    └── command/
        ├── command-menu.tsx
        ├── command.tsx
        ├── dialog.tsx
        └── button.tsx
```

## Step 3: Add CSS Variables

Add these to your `app/globals.css`:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --border: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}
```

See `globals.css.example` for the complete CSS.

## Step 4: Update Tailwind Config

Add to your `tailwind.config.ts`:

```ts
theme: {
  extend: {
    colors: {
      border: "hsl(var(--border))",
      background: "hsl(var(--background))",
      foreground: "hsl(var(--foreground))",
      popover: {
        DEFAULT: "hsl(var(--popover))",
        foreground: "hsl(var(--popover-foreground))",
      },
      muted: {
        DEFAULT: "hsl(var(--muted))",
        foreground: "hsl(var(--muted-foreground))",
      },
      accent: {
        DEFAULT: "hsl(var(--accent))",
        foreground: "hsl(var(--accent-foreground))",
      },
      // ... see tailwind.config.example.ts for complete config
    },
  },
}
```

## Step 5: Use the Component

```tsx
import { CommandMenu } from "@/components/command-menu"

export default function Page() {
  return (
    <div>
      <CommandMenu />
    </div>
  )
}
```

## Step 6: Test It!

1. Run your dev server: `npm run dev`
2. Press `⌘K` or `/` to open the command menu
3. Type to search, use arrow keys to navigate, Enter to select

## Customization

### Add Your Own Commands

Edit `command-menu.tsx` and add new `CommandGroup` and `CommandItem` components:

```tsx
<CommandGroup heading="My Commands">
  <CommandItem onSelect={() => runCommand(() => router.push("/my-page"))}>
    <MyIcon />
    <span>My Custom Command</span>
    <CommandShortcut>⌘M</CommandShortcut>
  </CommandItem>
</CommandGroup>
```

### Change Keyboard Shortcut

In `command-menu.tsx`, find the `useEffect` with keyboard listener:

```tsx
React.useEffect(() => {
  const down = (e: KeyboardEvent) => {
    // Change this line to use different keys
    if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
      e.preventDefault()
      setOpen((open) => !open)
    }
  }
  // ...
}, [])
```

### Style Changes

All components use Tailwind CSS classes. You can modify them directly in the component files, or override with your own classes.

## Troubleshooting

**Q: The menu doesn't open when I press ⌘K**
- Make sure the component is mounted in your page
- Check browser console for errors
- Try clicking the search button instead

**Q: Styles look wrong**
- Verify CSS variables are added to globals.css
- Check Tailwind config includes the theme extensions
- Make sure Tailwind is processing the component files (check content paths in tailwind.config)

**Q: TypeScript errors**
- Ensure all dependencies are installed
- Check that you have `@types/react` and `@types/node` installed
- Run `npm install` again

## Next Steps

- Check out `advanced-example.tsx` for routing integration
- Read the full `README.md` for detailed documentation
- Customize the styling to match your brand
- Add more command groups for your app's features

## Resources

- [cmdk Documentation](https://cmdk.paco.me/)
- [Radix UI Dialog](https://www.radix-ui.com/docs/primitives/components/dialog)
- [shadcn/ui](https://ui.shadcn.com/)
