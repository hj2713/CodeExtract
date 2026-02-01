# Setup Instructions for EmailView Demo

## Prerequisites

This extraction assumes you have a Next.js 14+ project with the App Router. If you don't have one yet, create it first:

```bash
npx create-next-app@latest my-app --typescript --tailwind --app
cd my-app
```

## Installation Steps

### 1. Install Required Dependencies

```bash
npm install lucide-react @radix-ui/react-slot class-variance-authority clsx tailwind-merge
```

### 2. Update Tailwind Configuration

Update your `tailwind.config.ts` or `tailwind.config.js` to include the custom theme:

```typescript
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
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
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
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
  plugins: [],
} satisfies Config;
```

### 3. File Structure

The extracted component should be in the following structure:

```
src/app/extracted/
├── layout.tsx          # Layout with CSS imports
├── page.tsx            # Main demo page
├── globals.css         # Theme CSS variables
├── email-view.tsx      # EmailView component
├── types.ts            # TypeScript interfaces
├── utils.ts            # Utility functions
├── mock-data.ts        # Demo email data
├── actions.ts          # Server actions (placeholder)
├── ui-components/
│   └── button.tsx      # Button component
├── README.md           # Documentation
└── SETUP.md            # This file
```

### 4. Run the Development Server

```bash
npm run dev
```

Then navigate to `http://localhost:3000/extracted` to see the EmailView demo.

## Troubleshooting

### CSS Variables Not Loading

Make sure `globals.css` is imported in `layout.tsx`:

```typescript
import "./globals.css";
```

### Dark Mode Not Working

Ensure the `<html>` tag has the `dark` class in `layout.tsx`:

```typescript
<html lang="en" className="dark">
```

### Icons Not Displaying

Verify that `lucide-react` is installed:

```bash
npm install lucide-react
```

### TypeScript Errors

If you see TypeScript errors, make sure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "jsx": "preserve",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "strict": true
  }
}
```

## Next Steps

- Replace `MOCK_EMAILS` with your actual email data
- Implement real functionality for Reply, Forward, and Delete buttons
- Connect to your email API or database
- Add email composition and sending features
- Integrate with authentication
