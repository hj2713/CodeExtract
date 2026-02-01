# EmailView Component Preview

## Visual Structure

```
┌─────────────────────────────────────────────────────────────┐
│  EmailView Component Demo              [👁️ Privacy Off]    │
│  Extracted from EchoPilot - Click "Back..." to cycle       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  ← Back to Inbox                                             │
│                                                               │
│  Q4 Planning Meeting - Thursday                              │
│                                                               │
│  Sarah Chen                        Monday, January 15, 2024  │
│  sarah.chen@techcorp.com                  10:30 AM           │
│  ─────────────────────────────────────────────────────────   │
│                                                               │
│  Hi!                                                          │
│                                                               │
│  I wanted to confirm our meeting for Thursday at 2pm to      │
│  discuss the Q4 planning roadmap. I've prepared some         │
│  slides covering the main initiatives.                       │
│                                                               │
│  Please let me know if you need me to adjust the time or     │
│  add anyone else to the invite.                              │
│                                                               │
│  Best,                                                        │
│  Sarah                                                        │
│                                                               │
│                                                               │
│  ─────────────────────────────────────────────────────────   │
│  [  ↩️  Reply  ]  [  ➡️  Forward  ]  [ 🗑️ ]                │
└─────────────────────────────────────────────────────────────┘
```

## With Privacy Mode Enabled

```
┌─────────────────────────────────────────────────────────────┐
│  EmailView Component Demo               [🙈 Privacy On]     │
│  Extracted from EchoPilot - Click "Back..." to cycle       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  ← Back to Inbox                                             │
│                                                               │
│  Q4 Planning Meeting - Thursday                              │
│                                                               │
│  ••••••                            Monday, January 15, 2024  │
│  ••••••@••••••                            10:30 AM           │
│  ─────────────────────────────────────────────────────────   │
│                                                               │
│  Hi!                                                          │
│                                                               │
│  I wanted to confirm our meeting for Thursday at 2pm to      │
│  discuss the Q4 planning roadmap...                          │
│                                                               │
│  ...                                                          │
└─────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### Header Section
```tsx
<div className="p-4 border-b border-border">
  <Button variant="ghost" onClick={onBack}>
    ← Back to Inbox
  </Button>

  <h1>{email.subject}</h1>

  <div>
    <p>{privacyMode ? '••••••' : email.fromName}</p>
    <p>{privacyMode ? '••••••@••••••' : email.from}</p>
  </div>

  <p>{formatDate(email.date)}</p>
</div>
```

### Body Section
```tsx
<div className="flex-1 overflow-y-auto p-6">
  <div className="prose prose-lg dark:prose-invert">
    {email.body.split('\n').map(paragraph => (
      <p>{paragraph}</p>
    ))}
  </div>
</div>
```

### Actions Section
```tsx
<div className="p-4 border-t border-border flex gap-3">
  <Button size="lg">
    <Reply /> Reply
  </Button>
  <Button variant="secondary" size="lg">
    <Forward /> Forward
  </Button>
  <Button variant="destructive" size="lg">
    <Trash2 />
  </Button>
</div>
```

## Color Scheme (Dark Mode)

```css
Background:    hsl(220 25% 6%)   /* Very dark blue-gray */
Foreground:    hsl(60 30% 96%)   /* Off-white */
Primary:       hsl(180 100% 50%) /* Cyan */
Card:          hsl(220 25% 10%)  /* Dark blue-gray */
Border:        hsl(220 20% 20%)  /* Medium gray */
Muted:         hsl(220 10% 60%)  /* Light gray (for dates) */
Destructive:   hsl(0 75% 55%)    /* Red (delete button) */
Secondary:     hsl(220 20% 18%)  /* Slightly lighter than card */
```

## Button Variants

### Primary (Reply)
- Background: Cyan (`hsl(180 100% 50%)`)
- Text: Dark blue-gray
- Hover: Slightly darker cyan

### Secondary (Forward)
- Background: Dark gray (`hsl(220 20% 18%)`)
- Text: Off-white
- Hover: Slightly lighter

### Destructive (Delete)
- Background: Red (`hsl(0 75% 55%)`)
- Text: Off-white
- Hover: Slightly darker red

### Ghost (Back button)
- Background: Transparent
- Text: Inherit
- Hover: Subtle gray background

## Responsive Behavior

### Mobile (< 640px)
- Full width buttons stack
- Reduced padding
- Smaller font sizes
- Action buttons in column layout

### Desktop (≥ 640px)
- Fixed width container (max 1024px)
- Larger padding
- Buttons in row layout
- More spacious design

## Accessibility Features

### ARIA Labels
```tsx
role="article"
aria-label={`Email from ${privacyMode ? 'hidden sender' : email.fromName}: ${email.subject}`}
aria-label="Go back to inbox"
aria-hidden="true" // on icons
```

### Keyboard Navigation
- All buttons are keyboard accessible
- Tab order follows visual flow
- Focus indicators visible
- Enter/Space to activate buttons

### Screen Reader Support
- Semantic HTML (header, main sections)
- `.sr-only` class for icon labels
- Descriptive button text
- Proper heading hierarchy

## States

### Default State
- Display full email content
- Show sender information
- Enable all actions

### Privacy Mode
- Mask sender name with dots
- Mask email address with dots
- Subject and body remain visible
- Actions still available

### Loading State (Not in Demo)
- Could add skeleton screens
- Loading spinners on actions
- Disabled button states

## Sample Emails Included

1. **Work Meeting** (Sarah Chen) - Unread
2. **Coffee Catchup** (Alex Rodriguez) - Unread
3. **GitHub Notification** - Unread
4. **HR Reminder** - Read
5. **Family Dinner** (Mom) - Read

## Theme Customization Points

```css
/* Easy to customize: */
--primary:       /* Brand color */
--background:    /* Page background */
--card:          /* Email viewer background */
--border:        /* Divider lines */
--radius:        /* Border radius for rounded corners */
```

## Props Interface

```typescript
interface EmailViewProps {
  email: DemoEmail;      // Email data to display
  onBack: () => void;    // Back button handler
  privacyMode: boolean;  // Toggle privacy masking
}

interface DemoEmail {
  id: string;
  threadId: string;
  from: string;          // Email address
  fromName: string;      // Display name
  to: string;
  subject: string;
  snippet: string;       // Preview text (not used in view)
  body: string;          // Full email body
  date: string;          // ISO date string
  unread: boolean;       // Read status (not used in view)
}
```

---

**View it live**: Run `npm run dev` and navigate to `/extracted`
