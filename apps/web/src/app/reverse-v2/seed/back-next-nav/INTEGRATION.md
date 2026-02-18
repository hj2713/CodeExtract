# BackNextNav Integration Guide

## Overview

The `BackNextNav` component navigates through pending apps in the PendingAppsPage. It now properly bounds navigation using a `totalCount` prop.

## Changes Summary

### 1. BackNextNav Component

**File**: `apps/web/src/app/final/components/pending-apps-page/back-next-nav.tsx`

**Props Changed**:
```diff
interface BackNextNavProps {
  currentIndex: number;
+ totalCount: number;
  onIndexChange: (index: number) => void;
}
```

**Behavior Changes**:
- Shows "X of Y" format instead of just showing the index
- Next button now properly disabled at `currentIndex >= totalCount - 1`
- `min-w-[60px]` on the counter for consistent width

---

### 2. ControlPanelHeader Component

**File**: `apps/web/src/app/final/components/pending-apps-page/control-panel-header.tsx`

**Props Changed**:
```diff
interface ControlPanelHeaderProps {
  isApproved: boolean;
  onApprovedChange: (approved: boolean) => void;
  screenSize: 'desktop' | 'tablet' | 'mobile';
  onScreenSizeChange: (size: 'desktop' | 'tablet' | 'mobile') => void;
  currentAppIndex: number;
  onAppIndexChange: (index: number) => void;
+ pendingAppsCount: number;
}
```

**Usage Changed**:
```diff
<BackNextNav
  currentIndex={currentAppIndex}
+ totalCount={pendingAppsCount}
  onIndexChange={onAppIndexChange}
/>
```

---

### 3. PendingAppsPage Component

**File**: `apps/web/src/app/final/components/pending-apps-page/index.tsx`

**State/Data Changes**:
```tsx
// Add state for pending apps
const [pendingApps, setPendingApps] = useState<CodeExample[]>([]);

// Fetch pending apps on mount
useEffect(() => {
  async function fetchPendingApps() {
    const res = await fetch('/api/code-examples?reviewStatus=pending');
    const data = await res.json();
    setPendingApps(data.codeExamples || []);
  }
  fetchPendingApps();
}, []);
```

**Pass count to ControlPanelHeader**:
```diff
<ControlPanelHeader
  isApproved={isApproved}
  onApprovedChange={setIsApproved}
  screenSize={screenSize}
  onScreenSizeChange={setScreenSize}
  currentAppIndex={currentAppIndex}
  onAppIndexChange={setCurrentAppIndex}
+ pendingAppsCount={pendingApps.length}
/>
```

**Optional: Hide nav when no pending apps**:
```tsx
// In ControlPanelHeader, conditionally render BackNextNav
{pendingAppsCount > 0 && (
  <BackNextNav
    currentIndex={currentAppIndex}
    totalCount={pendingAppsCount}
    onIndexChange={onAppIndexChange}
  />
)}
```

---

## Data Flow

```
PendingAppsPage
├── pendingApps: CodeExample[]        ← fetched from API
├── currentAppIndex: number           ← local state
│
└── ControlPanelHeader
    ├── pendingAppsCount: number      ← pendingApps.length
    ├── currentAppIndex: number       ← passed through
    │
    └── BackNextNav
        ├── totalCount: number        ← pendingAppsCount
        ├── currentIndex: number      ← currentAppIndex
        └── onIndexChange()           ← updates currentAppIndex in parent
```

---

## API Endpoint Needed

```
GET /api/code-examples?reviewStatus=pending
```

Returns:
```json
{
  "codeExamples": [
    {
      "id": "string",
      "requirementId": "string",
      "path": "string",
      "port": 3001,
      "reviewStatus": "pending",
      "createdAt": "ISO8601"
    }
  ]
}
```

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| No pending apps | Hide BackNextNav entirely |
| Single pending app | Show "1 of 1", both buttons disabled |
| At first app | Back disabled, Next enabled |
| At last app | Back enabled, Next disabled |
| Approve/deny app | Re-fetch list, adjust index if needed |

---

## Testing Checklist

- [ ] Navigation buttons work correctly
- [ ] "X of Y" displays correctly (1-indexed)
- [ ] Back disabled at first item
- [ ] Next disabled at last item
- [ ] Both disabled with single item
- [ ] Hidden when no pending apps
- [ ] Index adjusts when list changes (approve/deny)
