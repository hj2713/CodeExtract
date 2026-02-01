# Quick Start Guide

## TL;DR - Get Running in 3 Steps

### 1. Install Dependencies
```bash
npm install lucide-react @radix-ui/react-slot class-variance-authority clsx tailwind-merge
```

### 2. Ensure Tailwind is Configured
The `globals.css` file contains all necessary CSS variables. The `tailwind.config.ts` in your project root should include the color scheme (see SETUP.md for full config).

### 3. Run the Demo
```bash
npm run dev
```

Navigate to: `http://localhost:3000/extracted`

## What You'll See

- A full-featured email viewer displaying the first email from the mock data
- A "Privacy Mode" toggle button in the header (eye icon)
- Click "Back to Inbox" to cycle through different emails
- Action buttons for Reply, Forward, and Delete (currently non-functional)

## Key Features to Try

1. **Toggle Privacy Mode** — Click the eye icon to see sender info masked
2. **Cycle Through Emails** — Click "Back to Inbox" to view different emails
3. **Responsive Design** — Resize your browser to see mobile/desktop layouts
4. **Accessibility** — Try keyboard navigation (Tab through buttons)

## File Overview

| File | Purpose |
|------|---------|
| `page.tsx` | Main demo wrapper with email selection logic |
| `email-view.tsx` | Core EmailView component (the star of the show) |
| `ui-components/button.tsx` | Reusable button with variants |
| `mock-data.ts` | 5 demo emails to cycle through |
| `types.ts` | TypeScript interfaces |
| `utils.ts` | className utility function |
| `globals.css` | High-contrast theme CSS variables |
| `layout.tsx` | Route layout with CSS imports |

## Customization Quick Hits

### Change the Emails
Edit `mock-data.ts` and modify the `MOCK_EMAILS` array.

### Change Colors
Edit CSS variables in `globals.css` under `.dark` class.

### Add Real Actions
In `email-view.tsx`, add onClick handlers to the action buttons:

```typescript
<Button onClick={() => console.log('Reply to', email.id)}>
  <Reply className="w-5 h-5 mr-2" />
  Reply
</Button>
```

## Need More Help?

- See `README.md` for full documentation
- See `SETUP.md` for detailed setup instructions
- Check the original source at `source/src/components/EmailView.tsx`
