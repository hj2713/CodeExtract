# EmailView Component Extraction

## What this demonstrates

This example extracts the `EmailView` component from the EchoPilot project, which provides a fully-featured email viewing interface with privacy mode functionality. The component displays email details including sender information, subject, body content, and action buttons (Reply, Forward, Delete). It includes privacy mode that masks sensitive information like sender names and email addresses.

## Original implementation

The EchoPilot project is a voice-controlled email client built with React, TypeScript, and Vite. The `EmailView` component is part of a larger application that includes voice commands, email management, and accessibility features.

### Key files from source:

- `source/src/components/EmailView.tsx` — The main email viewing component with privacy mode
- `source/src/data/demoInbox.ts` — Demo email data structure and mock inbox emails
- `source/src/components/ui/button.tsx` — shadcn/ui Button component with variants
- `source/src/lib/utils.ts` — Utility function for className merging (cn)

## Dependencies

### NPM packages required

- `lucide-react` — Icon library (ArrowLeft, Reply, Forward, Trash2 icons)
- `@radix-ui/react-slot` — Required by the Button component for composition
- `class-variance-authority` — Type-safe variants for Button component
- `clsx` — Utility for conditional className strings
- `tailwind-merge` — Merges Tailwind CSS classes intelligently

### Code ported from source

- **EmailView component** from `source/src/components/EmailView.tsx` — Full email viewing interface with privacy mode
- **Button component** from `source/src/components/ui/button.tsx` — shadcn/ui Button with variants (default, destructive, secondary, ghost)
- **cn utility** from `source/src/lib/utils.ts` — className merging utility
- **DemoEmail type** from `source/src/data/demoInbox.ts` — TypeScript interface for email objects
- **Mock email data** from `source/src/data/demoInbox.ts` — 10 sample emails with realistic content

### Mocked in this example

- **Email fetching** — Instead of API calls or database queries, emails are loaded from `MOCK_EMAIL_DATA` constant in `utils.ts`
- **Email selection state** — Simple useState hook manages which email is displayed (original app may use more complex routing/state management)
- **Action handlers** — Reply, Forward, and Delete buttons are non-functional in this demo (they would connect to email APIs in production)
- **Authentication** — No auth required; all data is client-side mock data

## Features included

✅ **EmailView Component**
- Clean, accessible email display
- Sender info with privacy masking option
- Formatted date display
- Multi-paragraph body rendering
- Action buttons (Reply, Forward, Delete)

✅ **Privacy Mode**
- Toggle to mask sender names (shows "••••••")
- Masks email addresses (shows "••••••@••••••")
- Maintains functionality while protecting sensitive info

✅ **Inbox List**
- Simple email list view
- Click to view email details
- Visual indicators for unread emails
- Privacy mode support in list view

## How to use

### Installation

First, ensure you have the required dependencies installed:

```bash
npm install lucide-react @radix-ui/react-slot class-variance-authority clsx tailwind-merge
```

### Configuration

This example requires Tailwind CSS with the following configuration:

1. **Tailwind Config** — Your `tailwind.config.ts` should include:
   - CSS variables for theming (border, background, foreground, primary, secondary, destructive, muted, accent)
   - The extracted directory in content paths

2. **Global CSS** — Add Tailwind directives and CSS variables (see source `source/src/index.css` for full variable definitions)

### Usage in your app

```tsx
import { EmailView } from './components/EmailView';
import { MOCK_EMAIL_DATA } from './utils';

function YourComponent() {
  const [selectedEmail] = useState(MOCK_EMAIL_DATA[0]);
  const [privacyMode, setPrivacyMode] = useState(false);

  return (
    <EmailView
      email={selectedEmail}
      onBack={() => console.log('Go back')}
      privacyMode={privacyMode}
    />
  );
}
```

### Customization

**Privacy Mode**: Toggle the `privacyMode` prop to enable/disable sender information masking

**Styling**: The component uses Tailwind CSS with semantic color tokens. Customize by modifying CSS variables:
- `--border` - Border colors
- `--primary` - Primary button color
- `--destructive` - Delete button color
- `--muted-foreground` - Secondary text color

**Actions**: Implement the button onClick handlers in your version:
```tsx
<Button onClick={() => handleReply(email.id)}>
  <Reply className="w-5 h-5 mr-2" />
  Reply
</Button>
```

## Component API

### EmailView Props

```typescript
interface EmailViewProps {
  email: DemoEmail;      // Email object to display
  onBack: () => void;    // Callback when back button is clicked
  privacyMode: boolean;  // Enable/disable privacy masking
}
```

### DemoEmail Type

```typescript
interface DemoEmail {
  id: string;
  threadId: string;
  from: string;         // Email address
  fromName: string;     // Display name
  to: string;
  subject: string;
  snippet: string;      // Preview text
  body: string;         // Full email body
  date: string;         // ISO date string
  unread: boolean;
}
```

## Accessibility Features

- Semantic HTML with proper ARIA labels
- `role="article"` for email content
- `aria-label` on buttons for screen readers
- `aria-hidden` on decorative icons
- `sr-only` class for screen-reader-only text
- Keyboard navigable buttons

## Next Steps

To integrate this into a production app, you would:

1. Replace `MOCK_EMAIL_DATA` with real API calls or database queries
2. Implement actual email actions (reply, forward, delete)
3. Add loading states and error handling
4. Connect to your authentication system
5. Add email composition UI for replies/forwards
6. Implement proper routing for email selection
7. Add more email features (attachments, HTML rendering, etc.)

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
└── README.md               # This file
```
