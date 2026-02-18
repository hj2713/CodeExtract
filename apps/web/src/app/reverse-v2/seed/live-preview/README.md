# LivePreview Component

Iframe-based preview component for displaying running apps at localhost ports.

## Usage

```tsx
import { LivePreview } from './live-preview';

<LivePreview
  screenSize="desktop"  // 'desktop' | 'tablet' | 'mobile'
  port={3001}           // Port number where the app is running
  appId="my-app"        // Optional: for iframe title
/>
```

## Features

- **Responsive sizing**: Desktop (100%), Tablet (768px), Mobile (375px)
- **Loading state**: Shows spinner while checking if app is ready
- **Error state**: Shows error message with retry button
- **Security**: iframe sandbox attributes for safe embedding

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `screenSize` | `'desktop' \| 'tablet' \| 'mobile'` | Yes | Controls iframe width |
| `port` | `number` | Yes | Port number for localhost URL |
| `appId` | `string` | No | Used for iframe title attribute |

## States

1. **idle/loading**: Polling the URL to check if app is ready
2. **ready**: Shows the iframe with the app
3. **error**: Shows error message with retry button

## Security

The iframe uses sandbox attributes:
- `allow-scripts`: Needed for app JS to run
- `allow-same-origin`: Needed for localStorage, cookies
- `allow-forms`: Needed for form submissions
- `allow-popups`: Needed for links opening new tabs
- `allow-modals`: Needed for alerts, confirms, prompts
