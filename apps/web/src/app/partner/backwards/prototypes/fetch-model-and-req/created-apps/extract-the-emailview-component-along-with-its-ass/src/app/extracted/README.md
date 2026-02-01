# EmailView Component Extraction

## What this demonstrates

This example extracts the `EmailView` component from the EchoPilot project, showcasing a fully-featured email viewer with privacy mode functionality, accessible design, and clean action buttons. The component displays email content with sender information, timestamps, and provides actions for replying, forwarding, and deleting emails. It includes a privacy mode that masks sensitive information (sender names and email addresses).

## Original implementation

The EchoPilot project is a voice-controlled email assistant with accessibility features. The `EmailView` component is used to display individual email messages when selected from an inbox list. In the original implementation, the component receives email data from a state management hook (`useEchoPilot`) and integrates with voice commands and navigation features.

Key files from source:
- `source/src/components/EmailView.tsx` — Core email viewing component with privacy mode
- `source/src/data/demoInbox.ts` — Demo email data with type definitions
- `source/src/components/ui/button.tsx` — Reusable button component with variants
- `source/src/lib/utils.ts` — Utility function for className merging
- `source/src/index.css` — High-contrast accessibility theme with Tailwind CSS variables
- `source/tailwind.config.ts` — Tailwind configuration with custom theme

## Dependencies

### NPM packages required

- `lucide-react` — Icon library (ArrowLeft, Reply, Forward, Trash2, Eye, EyeOff icons)
- `@radix-ui/react-slot` — Primitive for button component composition
- `class-variance-authority` — Utility for managing component variants
- `clsx` — Utility for conditional className strings
- `tailwind-merge` — Merges Tailwind classes intelligently
- `next` — Next.js 14+ with App Router
- `react` — React 18+
- `tailwindcss` — Tailwind CSS for styling

### Code ported from source

- `EmailView` component from `source/src/components/EmailView.tsx` — Main email viewing component
- `Button` component from `source/src/components/ui/button.tsx` — Reusable button with variants
- `cn()` utility from `source/src/lib/utils.ts` — ClassName merging helper
- `DemoEmail` interface from `source/src/data/demoInbox.ts` — Email type definition
- Demo email data from `source/src/data/demoInbox.ts` — Mock inbox data
- Theme CSS from `source/src/index.css` — High-contrast dark mode theme
- Tailwind config (custom font sizes, colors) — Accessibility-focused configuration

### Mocked in this example

- **Email selection logic** — Original uses `useEchoPilot` hook; here we use simple React `useState` to cycle through emails
- **Navigation** — Original navigates back to inbox view; here the "Back to Inbox" button cycles to the next email for demo purposes
- **Email actions** — Reply, Forward, and Delete buttons are non-functional (in original, these would integrate with voice commands and state management)
- **Voice control integration** — Original component is part of a voice-controlled interface; removed for simplicity
- **Database/API** — All email data is hardcoded using the mock data from `demoInbox.ts`

## How to use

1. **Install dependencies:**
   ```bash
   npm install lucide-react @radix-ui/react-slot class-variance-authority clsx tailwind-merge
   ```

2. **Configure Tailwind CSS** in your `tailwind.config.js`:
   ```javascript
   module.exports = {
     darkMode: ["class"],
     content: [
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
   }
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Navigate to** `/extracted` to view the demo.

## Features

- **Privacy Mode Toggle** — Click the eye icon to mask sender names and email addresses
- **Email Cycling** — Click "Back to Inbox" to cycle through different demo emails
- **Responsive Design** — Works on mobile and desktop
- **Accessible** — ARIA labels, high contrast theme, large text for screen readers
- **Action Buttons** — Reply, Forward, and Delete buttons with appropriate styling
- **Date Formatting** — Timestamps formatted in a human-readable format
- **Dark Mode** — High-contrast dark theme by default (from original EchoPilot design)

## Customization

### Using Your Own Email Data

Replace the `MOCK_EMAILS` array in `mock-data.ts` with your own email data:

```typescript
export const MOCK_EMAILS: DemoEmail[] = [
  {
    id: "your_id",
    threadId: "your_thread",
    from: "sender@example.com",
    fromName: "Sender Name",
    to: "you@example.com",
    subject: "Email Subject",
    snippet: "Preview text...",
    body: "Full email body...",
    date: "2024-01-15T10:30:00Z",
    unread: true
  },
  // Add more emails...
];
```

### Implementing Real Actions

To add functionality to the action buttons, modify `email-view.tsx`:

```typescript
<Button
  className="flex-1 min-w-[120px]"
  size="lg"
  onClick={() => handleReply(email)}
>
  <Reply className="w-5 h-5 mr-2" aria-hidden="true" />
  Reply
</Button>
```

### Changing the Theme

Modify the CSS variables in `globals.css` to customize colors:

```css
.dark {
  --primary: 180 100% 50%; /* Change to your brand color */
  --background: 220 25% 6%; /* Adjust background darkness */
  /* ... other variables ... */
}
```

## Accessibility Features

- **High Contrast Theme** — Designed for visually impaired users
- **Large Base Font Size** — 18px for better readability
- **Screen Reader Support** — Proper ARIA labels and semantic HTML
- **Keyboard Navigation** — All interactive elements are keyboard accessible
- **Focus Indicators** — Clear focus rings for keyboard navigation
