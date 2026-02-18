# AppGrid Integration Guide

## Overview

The AppGrid component displays approved code examples in a responsive grid layout. It fetches data from the `codeExamples` table (filtered by `reviewStatus = 'approved'`) and joins with `requirements` for title/description.

## Files Created

```
created-apps/app-grid/
├── actions.ts      # Server action to fetch approved apps from DB
├── app-grid.tsx    # Main grid component with loading/empty states
├── app-item.tsx    # Individual app card with preview thumbnail
└── index.ts        # Barrel exports
```

## Integration Steps

### Step 1: Update the existing AppGrid in `/final`

Replace the placeholder `app-grid.tsx` in `apps/web/src/app/final/components/pending-apps-page/`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { AppItem } from './app-item';
import { getApprovedApps, type ApprovedApp } from './actions';

export function AppGrid() {
  const [apps, setApps] = useState<ApprovedApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadApps() {
      try {
        const approvedApps = await getApprovedApps();
        setApps(approvedApps);
      } catch (err) {
        console.error('Failed to load approved apps:', err);
        setError('Failed to load approved apps');
      } finally {
        setLoading(false);
      }
    }
    loadApps();
  }, []);

  if (loading) {
    return (
      <div className="h-full p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-zinc-400 animate-spin mx-auto mb-3" />
          <p className="font-mono text-sm text-zinc-500">Loading approved apps...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full p-4 flex items-center justify-center">
        <p className="font-mono text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <div className="h-full p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-zinc-500" />
          </div>
          <h3 className="font-mono text-base text-zinc-300 mb-2">No approved apps yet</h3>
          <p className="font-mono text-sm text-zinc-500 max-w-xs">
            Approve components from the verification queue to see them here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-4 overflow-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {apps.map((app) => (
          <AppItem key={app.id} app={app} />
        ))}
      </div>
    </div>
  );
}
```

### Step 2: Create the actions.ts file

Create `apps/web/src/app/final/components/pending-apps-page/actions.ts`:

```tsx
'use server';

import { db, codeExamples, requirements, eq } from '@my-better-t-app/db';

export interface ApprovedApp {
  id: string;
  name: string;
  description: string | null;
  path: string;
  port: number;
  createdAt: string;
  requirementTitle: string | null;
}

export async function getApprovedApps(): Promise<ApprovedApp[]> {
  const results = await db
    .select({
      id: codeExamples.id,
      path: codeExamples.path,
      port: codeExamples.port,
      createdAt: codeExamples.createdAt,
      requirementTitle: requirements.title,
      requirementDescription: requirements.requirement,
    })
    .from(codeExamples)
    .leftJoin(requirements, eq(codeExamples.requirementId, requirements.id))
    .where(eq(codeExamples.reviewStatus, 'approved'));

  return results.map((row) => ({
    id: row.id,
    name: row.requirementTitle || deriveNameFromPath(row.path),
    description: row.requirementDescription,
    path: row.path,
    port: row.port,
    createdAt: row.createdAt,
    requirementTitle: row.requirementTitle,
  }));
}

function deriveNameFromPath(path: string): string {
  const segments = path.split('/');
  const lastSegment = segments[segments.length - 1] || 'Untitled';
  return lastSegment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
```

### Step 3: Update AppItem to accept props

Update `apps/web/src/app/final/components/pending-apps-page/app-item.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { StatusDot } from '../status-dot';
import { Badge } from '../badge';
import type { ApprovedApp } from './actions';

interface AppItemProps {
  app: ApprovedApp;
}

export function AppItem({ app }: AppItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const previewUrl = `http://localhost:${app.port}`;

  const formattedDate = new Date(app.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const truncatedId = app.id.length > 12 ? `${app.id.slice(0, 12)}...` : app.id;

  function handleClick() {
    window.open(previewUrl, '_blank');
  }

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        group cursor-pointer rounded-none border bg-zinc-900/50 transition-colors
        ${isHovered ? 'border-zinc-500' : 'border-zinc-700'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-2">
          <StatusDot status="online" />
          <span className="font-mono text-sm text-zinc-100 truncate max-w-[150px]">
            {app.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-zinc-600">{formattedDate}</span>
          <ExternalLink
            className={`w-3 h-3 text-zinc-500 transition-opacity ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>
      </div>

      {/* Preview Thumbnail */}
      <div className="relative h-48 bg-black overflow-hidden">
        <iframe
          src={previewUrl}
          className="w-full h-full border-0 pointer-events-none scale-[0.5] origin-top-left"
          style={{ width: '200%', height: '200%' }}
          title={`Preview: ${app.name}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent pointer-events-none" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-800 bg-zinc-900/80">
        <code className="font-mono text-xs text-zinc-500">{truncatedId}</code>
        <Badge variant="success">approved</Badge>
      </div>
    </div>
  );
}
```

## Data Requirements

The component expects:

1. **codeExamples** table with:
   - `reviewStatus = 'approved'` for items to appear
   - `port` for generating preview URLs
   - `path` for fallback naming

2. **requirements** table joined via `requirementId`:
   - `title` for display name
   - `requirement` for description (optional)

## Testing

1. Run the seed SQL to insert test data
2. Ensure preview servers are running on the allocated ports
3. Grid should show 3 approved apps in the test data

## Responsive Behavior

| Breakpoint | Columns |
|------------|---------|
| < 768px    | 1       |
| 768-1023px | 2       |
| >= 1024px  | 3       |

## Future Enhancements

- [ ] Add pagination for large galleries
- [ ] Add sorting options (by date, name)
- [ ] Add search/filter functionality
- [ ] Add lazy loading for preview iframes
- [ ] Cache preview thumbnails as static images
