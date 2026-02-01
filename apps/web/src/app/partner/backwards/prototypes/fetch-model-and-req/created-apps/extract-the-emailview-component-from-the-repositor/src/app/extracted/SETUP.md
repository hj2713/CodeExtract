# Setup Instructions

## Required NPM Packages

Install these dependencies in your Next.js project:

```bash
npm install lucide-react @radix-ui/react-slot class-variance-authority clsx tailwind-merge
```

## Package Details

- **lucide-react**: Icon library for UI icons (ArrowLeft, Reply, Forward, Trash2)
- **@radix-ui/react-slot**: Required by shadcn/ui Button component
- **class-variance-authority**: Type-safe variant API for components
- **clsx**: Utility for constructing className strings
- **tailwind-merge**: Intelligently merges Tailwind CSS classes

## Tailwind CSS Configuration

Ensure your `tailwind.config.ts` includes CSS variable-based theming:

```typescript
theme: {
  extend: {
    colors: {
      border: "hsl(var(--border))",
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
        foreground: "hsl(var(--muted-foreground))",
      },
      accent: {
        DEFAULT: "hsl(var(--accent))",
      },
    },
  },
}
```

## Global CSS Variables

Add these to your global CSS file (e.g., `app/globals.css`):

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
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
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}
```

## Running the Example

After installing dependencies and configuring Tailwind:

```bash
npm run dev
```

Then navigate to `/extracted` in your Next.js app.

## Quick Start

1. Install dependencies (see above)
2. Configure Tailwind CSS (see above)
3. Add CSS variables to global stylesheet
4. Run `npm run dev`
5. Visit http://localhost:3000/extracted

## File Structure

```
src/app/extracted/
├── components/
│   ├── ui/
│   │   └── button.tsx       # shadcn/ui Button component
│   └── EmailView.tsx        # Main email viewer component
├── types.ts                 # TypeScript interfaces
├── utils.ts                 # Helper functions and mock data
├── actions.ts               # Server actions (empty for this demo)
├── page.tsx                 # Next.js page with demo wrapper
├── README.md               # Full documentation
└── SETUP.md                # This file
```
