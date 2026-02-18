# LivePreview Implementation Guide for /final

## Overview

This guide describes how to integrate the LivePreview component into the `/final` PendingAppsPage.

## Current State

**Location**: `apps/web/src/app/final/components/pending-apps-page/live-preview.tsx`

**Current**: Placeholder div that responds to `screenSize` prop.

## Target State

A fully functional iframe component that:
1. Displays the running app at `localhost:{port}`
2. Responds to screen size changes
3. Shows loading/error states
4. Includes security sandboxing

## Integration Steps

### Step 1: Update Props Interface

The current LivePreview only receives `screenSize`. Update to receive CodeExample data:

```tsx
// Current
interface LivePreviewProps {
  screenSize: 'desktop' | 'tablet' | 'mobile';
}

// Updated
interface LivePreviewProps {
  screenSize: 'desktop' | 'tablet' | 'mobile';
  codeExample: {
    id: string;
    port: number;
    path: string;
    reviewStatus: 'pending' | 'approved' | 'rejected';
  } | null;
}
```

### Step 2: Fetch CodeExample in Parent

In `PendingAppsPage`, fetch the current CodeExample based on `currentAppIndex`:

```tsx
// In PendingAppsPage/index.tsx
const [codeExamples, setCodeExamples] = useState<CodeExample[]>([]);

useEffect(() => {
  async function loadPendingApps() {
    const response = await fetch('/api/code-examples?status=pending');
    const data = await response.json();
    setCodeExamples(data.codeExamples || []);
  }
  loadPendingApps();
}, []);

const currentApp = codeExamples[currentAppIndex] || null;

// Pass to LivePreview
<LivePreview screenSize={screenSize} codeExample={currentApp} />
```

### Step 3: Implement LivePreview Component

Replace the placeholder with the code example implementation:

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

type PreviewStatus = 'idle' | 'loading' | 'ready' | 'error';

interface LivePreviewProps {
  screenSize: 'desktop' | 'tablet' | 'mobile';
  codeExample: {
    id: string;
    port: number;
    path: string;
    reviewStatus: 'pending' | 'approved' | 'rejected';
  } | null;
}

export function LivePreview({ screenSize, codeExample }: LivePreviewProps) {
  const [status, setStatus] = useState<PreviewStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Empty state if no codeExample
  if (!codeExample) {
    return (
      <div className="h-full bg-zinc-900/30 p-4 flex items-center justify-center">
        <span className="text-zinc-500">No app selected</span>
      </div>
    );
  }

  const appUrl = `http://localhost:${codeExample.port}`;

  // ... rest of implementation from code example
}
```

### Step 4: Add API Endpoint (if needed)

If the gallery prototype's preview server pattern is needed, create or reuse:

```ts
// apps/web/src/app/api/code-examples/route.ts
import { db } from '@codeextract/db';
import { codeExamples } from '@codeextract/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  const query = status
    ? db.select().from(codeExamples).where(eq(codeExamples.reviewStatus, status))
    : db.select().from(codeExamples);

  const results = await query;
  return Response.json({ codeExamples: results });
}
```

## Key Decisions Made

### URL Format
Using `http://localhost:{port}` directly. The gallery prototype uses `/extracted` path, but that's specific to how those apps are served. For CodeExtract apps, the root should work.

### App Status Detection
Polling with `no-cors` fetch. This matches the gallery prototype pattern. The app status is detected by trying to fetch the URL.

### Security
Using iframe sandbox with:
- `allow-scripts` - required for app JS
- `allow-same-origin` - required for app to work normally
- `allow-forms` - required for form submissions
- `allow-popups` - required for window.open
- `allow-modals` - required for alert/confirm

### Error Handling
Show error state with retry button rather than auto-retry, to avoid infinite loops.

## File Locations

| Purpose | Path |
|---------|------|
| Code Example | `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps/live-preview/` |
| Seed | `apps/web/src/app/MANUAL/seed/live-preview/` |
| Final Component | `apps/web/src/app/final/components/pending-apps-page/live-preview.tsx` |

## Testing

1. Start an app on a port (e.g., `npx create-next-app test-app && cd test-app && npm run dev -- -p 3001`)
2. Navigate to the demo page at `/partner/backwards/prototypes/fetch-model-and-req/created-apps/live-preview`
3. Enter port 3001 and verify the preview loads
4. Test screen size switching (desktop/tablet/mobile)
5. Test error state by stopping the dev server
