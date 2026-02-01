# Dependencies for AppearanceSettings Component

## NPM Packages

Add these to your `package.json`:

```json
{
  "dependencies": {
    "@radix-ui/react-label": "^2.1.1",
    "@radix-ui/react-radio-group": "^1.2.2",
    "@radix-ui/react-separator": "^1.1.1",
    "@radix-ui/react-slot": "^1.1.1",
    "@radix-ui/react-switch": "^1.1.2",
    "@tabler/icons-react": "^3.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "lucide-react": "^0.344.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@tailwindcss/container-queries": "^0.1.1"
  }
}
```

## Installation Command

```bash
npm install @radix-ui/react-label @radix-ui/react-radio-group @radix-ui/react-separator @radix-ui/react-slot @radix-ui/react-switch @tabler/icons-react class-variance-authority clsx lucide-react tailwind-merge

npm install -D @tailwindcss/container-queries
```

## Tailwind Configuration

Update your `tailwind.config.ts` or `tailwind.config.js`:

```js
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
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

export default config
```

## CSS Variables

Add to your `app/globals.css` or root CSS file:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

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

## TypeScript Configuration

Ensure your `tsconfig.json` has path aliases set up:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Verification

After installation, verify the setup:

1. Run the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/extracted` in your browser

3. You should see the AppearanceSettings component with:
   - Radio buttons for compute environment selection
   - Number input with increment/decrement buttons for GPU count
   - Toggle switch for wallpaper tinting
   - Proper styling and dark mode support

## Troubleshooting

### Container queries not working
- Ensure `@tailwindcss/container-queries` plugin is installed and added to `tailwind.config.js`
- Check that Tailwind CSS v3.2+ is installed

### CSS variables not applied
- Verify `globals.css` is imported in your root layout
- Check browser DevTools to ensure CSS variables are defined

### Icons not rendering
- Ensure `@tabler/icons-react` and `lucide-react` are installed
- Check that icons are being imported correctly

### Type errors
- Run `npm install --save-dev @types/react @types/node`
- Ensure TypeScript 5.0+ is installed
