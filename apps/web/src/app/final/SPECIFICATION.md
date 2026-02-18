# CodeExtract Final UI Specification

This document describes all components in the `/final` directory, how they work, how they share data, and what they probably do when fully implemented.

---

## Architecture Overview

```
MainPage (page.tsx)
├── Dock (tab navigation)
└── PageContainer
    ├── WorkingQueuePage (tab 1)
    └── PendingAppsPage (tab 2)
```

The app is a single-page application with two main views controlled by a floating dock at the bottom of the screen.

---

## Global State Management

State is managed at the page level and passed down via props. There is **no global state manager** (no Redux, Zustand, or Context). Each page manages its own state.

### MainPage State
| State | Type | Purpose |
|-------|------|---------|
| `activeTab` | `'working-queue' \| 'pending-apps'` | Controls which page is displayed |

### WorkingQueuePage State
| State | Type | Purpose |
|-------|------|---------|
| `selectedSource` | `string \| null` | Currently selected GitHub source |
| `createSourceModalOpen` | `boolean` | Controls CreateSourceModal visibility |
| `agentContextModalOpen` | `boolean` | Controls AgentContextModal visibility |

### PendingAppsPage State
| State | Type | Purpose |
|-------|------|---------|
| `isApproved` | `boolean` | Toggle between approved grid and pending view |
| `screenSize` | `'desktop' \| 'tablet' \| 'mobile'` | Controls LivePreview iframe width |
| `currentAppIndex` | `number` | Index of currently viewed pending app |
| `openModal` | `'logs' \| 'readme' \| 'filesystem' \| 'deny' \| null` | Which modal is open |

---

## Shared Components (Design System)

### `StatusDot`
**Status**: ✅ Fully Implemented

A colored indicator dot with optional glow/animation.

| Status | Color | Animation |
|--------|-------|-----------|
| `online` | Green | None |
| `launching` | Yellow | Pulse |
| `stopped` | Gray | None |
| `errored` | Red | None |
| `unknown` | Orange | None |

**To make real**: Already functional. Use as-is.

---

### `Badge`
**Status**: ✅ Fully Implemented

Status badge with border and subtle background.

| Variant | Usage |
|---------|-------|
| `success` | Approved items |
| `warning` | Pending items |
| `error` | Rejected/errored items |
| `info` | Informational |
| `default` | Neutral |

**To make real**: Already functional. Use as-is.

---

## Dock Component

### `Dock`
**Status**: ✅ Fully Implemented

Fixed-position bottom navigation bar with 2 tabs. Centered horizontally with margin from bottom edge. Does **not** affect document flow (uses `fixed` positioning).

**Props**:
- `activeTab`: Current active tab
- `onTabChange`: Callback when tab is clicked

**Styling Notes**:
- No full-width background - just wraps the tab buttons
- Centered at bottom of screen with padding
- Tabs highlight when active

**To make real**: Already functional. May want to add icons to tabs.

---

## WorkingQueuePage Components

### `WorkingQueuePage` (index.tsx)
**Status**: ✅ Layout Implemented

Main container with 30/70 horizontal split.

**Layout**:
- Header (top bar)
- Body: ChatWindow (30%) | QueueScreen (70%)
- Modals: CreateSourceModal, AgentContextModal

**To make real**: Wire up to actual data sources and job queue.

---

### `Header`
**Status**: ✅ Fully Implemented

Top bar with breadcrumb navigation and action buttons.

**Contains**:
- Breadcrumb (left)
- CreateSourceButton + worker count (right)

**To make real**: 
- [ ] Wire worker count to actual worker status
- [ ] **UNCERTAIN**: What determines worker count? Is it configurable?

---

### `Breadcrumb`
**Status**: ✅ Fully Implemented

Navigation path: `home / sources / [GithubSwitcher]`

**To make real**: Already functional. The path structure is hardcoded.

---

### `GithubSwitcher`
**Status**: ⚠️ Partially Implemented (uses dummy data)

Dropdown/context menu to select active GitHub source/repository. Appears as the **last item in the Breadcrumb** navigation.

**Current behavior**: Uses hardcoded `DUMMY_SOURCES` array. Clicking opens a dropdown overlay.

**State Interaction**: 
- Controls `selectedSource` state in WorkingQueuePage
- **Important**: The only component that consumes `selectedSource` is the ChatWindow (aka "Interview component")

**To make real**:
- [ ] Fetch sources from database/API
- [ ] **UNCERTAIN**: What is a "source"? Seems to be a GitHub repository that has been added to the system.
- [ ] **CLARIFIED**: Source selection filters/scopes the ChatWindow context, not the queue

---

### `CreateSourceButton`
**Status**: ✅ Fully Implemented

Button that opens CreateSourceModal.

**To make real**: Already functional.

---

### `CreateSourceModal`
**Status**: ⚠️ Partially Implemented

Modal for adding a new GitHub source. Has **title only, no description text**.

**Contains**:
- Title: "Create Source"
- GitHub URL input (functional - uses shadcn Input component)
- Submit button "Add Source" (logs to console only - uses shadcn Button)
- GithubRepoTree (placeholder) - shows below the form

**Layout Notes**:
- Form is above the tree view
- Modal uses standard shadcn modal patterns (backdrop click closes, X button)

**To make real**:
- [ ] Connect submit to API to create source
- [ ] Implement GithubRepoTree to show repo structure after URL is entered
- [ ] **UNCERTAIN**: What happens after a source is created? Does it start indexing? Does it appear in GithubSwitcher?
- [ ] **UNCERTAIN**: What is GithubRepoTree for? Selecting specific folders/files to index? Or just preview?

---

### `GithubRepoTree`
**Status**: 🔴 Placeholder Only

Tree view of repository files.

**Current behavior**: Just displays "GithubRepoTree" text.

**To make real**:
- [ ] Fetch repo tree from GitHub API
- [ ] Render as expandable tree
- [ ] **UNCERTAIN**: Is this for viewing only, or for selecting files/folders?
- [ ] **UNCERTAIN**: Does it show the full repo or just indexed files?

---

### `ChatWindow` (aka "Interview Component")
**Status**: ⚠️ Layout Implemented

Left sidebar (30% width) with chat interface. Also referred to as the **"Interview component"** in design discussions.

**Props**:
- `selectedSource`: Current source - this is the **only component that uses selectedSource state**
- `onPlusClick`: Opens AgentContextModal

**Contains**:
- MessagesArea (scrollable history)
- ChatInput (input area)

**To make real**:
- [ ] Filter/scope chat context by `selectedSource`
- [ ] **UNCERTAIN**: Is this a chat with an AI agent? With other users? Both?
- [ ] **UNCERTAIN**: How does selectedSource affect the chat? Does it filter messages or set context for new messages?

---

### `MessagesArea`
**Status**: 🔴 Placeholder Only

Scrollable chat history.

**Current behavior**: Just displays "MessagesArea" text.

**To make real**:
- [ ] Fetch messages from backend
- [ ] Render message bubbles (user vs agent)
- [ ] Auto-scroll to bottom on new messages
- [ ] **UNCERTAIN**: Message format/schema
- [ ] **UNCERTAIN**: Real-time updates (WebSocket?) or polling?

---

### `ChatInput`
**Status**: ⚠️ Layout Implemented

Chat input with plus button and send button.

**Layout**:
- Textarea area (placeholder, not functional)
- Plus button (+) positioned **inside** the textarea, bottom-left corner
- Send button positioned **outside/right** of the textarea

**Current behavior**:
- Textarea is a placeholder div (not a real textarea)
- Plus button works (opens AgentContextModal)
- Send button does nothing

**To make real**:
- [ ] Replace placeholder with actual shadcn Textarea
- [ ] Connect send button to API
- [ ] Handle keyboard shortcuts (Enter to send? Shift+Enter for newline?)
- [ ] **UNCERTAIN**: What does sending a message do? Creates a job? Talks to an agent?

---

### `AgentContextModal`
**Status**: ⚠️ Layout Implemented

Modal for adding context to agent/chat. Triggered by the plus (+) button inside ChatInput.

**Contains**:
- Title: "Add Context"
- ComponentCardList (placeholder) - should be **multi-selectable**
- Footer with Cancel and "Add Selected" buttons

**To make real**:
- [ ] Implement ComponentCardList with actual components/files
- [ ] Track multi-selection state
- [ ] On "Add Selected", add selected items as context to the chat/agent
- [ ] **UNCERTAIN**: What are "components" in this context? UI components? Code files? Extracted components from the source repo?

---

### `ComponentCardList`
**Status**: 🔴 Placeholder Only

Multi-selectable list of component cards.

**Current behavior**: Just displays "ComponentCardList" text.

**To make real**:
- [ ] Fetch available components from backend
- [ ] Render as selectable cards
- [ ] Track selection state
- [ ] **UNCERTAIN**: What makes something a "component"? How are they discovered/indexed?

---

### `QueueScreen`
**Status**: ⚠️ Layout Implemented

Right side with 50/50 vertical split.

**Contains**:
- QueueComponent (top 50%)
- ActiveJobComponent (bottom 50%)

**To make real**: Wire up to job queue system.

---

### `QueueComponent`
**Status**: 🔴 Placeholder Only

List of queued jobs.

**Current behavior**: Just displays "QueueComponent" text.

**To make real**:
- [ ] Fetch job queue from backend
- [ ] Render job items with status (StatusDot)
- [ ] Allow clicking to view job details
- [ ] Real-time updates
- [ ] **UNCERTAIN**: Job schema/structure
- [ ] **UNCERTAIN**: Can jobs be reordered, cancelled, retried?

---

### `ActiveJobComponent`
**Status**: 🔴 Placeholder Only

Display for currently running job.

**Current behavior**: Just displays "ActiveJobComponent" text.

**To make real**:
- [ ] Show active job details
- [ ] Stream job logs/progress
- [ ] Show job actions (cancel, etc.)
- [ ] **UNCERTAIN**: What information should be displayed? Progress? Logs? Output?
- [ ] **UNCERTAIN**: Is there always exactly one active job, or can there be multiple?

---

## PendingAppsPage Components

### `PendingAppsPage` (index.tsx)
**Status**: ✅ Layout Implemented

Main container with header and conditional content.

**Layout**:
- ControlPanelHeader (top)
- MainScreen (conditional based on isApproved toggle)
- Modals: Logs, Readme, FileSystem, Deny

**To make real**: Wire up to actual pending apps data.

---

### `ControlPanelHeader`
**Status**: ✅ Fully Implemented

Top control bar with screen size selector, navigation, and toggle.

**Contains**:
- ScreenSizeSelector (left)
- BackNextNav (left)
- ApprovedToggle (right)

**To make real**: Already functional. May need to disable nav buttons when no apps.

---

### `ScreenSizeSelector`
**Status**: ✅ Fully Implemented

3-tab selector for Desktop/Tablet/Mobile preview sizes.

**Effect**: Changes LivePreview iframe width:
- Desktop: 100%
- Tablet: 768px
- Mobile: 375px

**To make real**: Already functional.

---

### `BackNextNav`
**Status**: ⚠️ Partially Implemented

Navigation through pending apps.

**Current behavior**:
- Back button disabled at index 0
- Next button always enabled (no upper bound)
- Shows current index + 1

**To make real**:
- [ ] Set max based on actual pending apps count
- [ ] Disable Next at end of list
- [ ] **UNCERTAIN**: Should wrap around or stop at ends?

---

### `ApprovedToggle`
**Status**: ✅ Fully Implemented

Toggle switch between approved grid and pending verification view.

**To make real**: Already functional.

---

### `MainScreen`
**Status**: ✅ Fully Implemented

Conditional wrapper that renders either AppGrid or PendingVerificationView.

**To make real**: Already functional.

---

### `AppGrid`
**Status**: ⚠️ Layout Implemented (uses dummy data)

Grid of approved app cards.

**Current behavior**: Renders 6 dummy AppItem components.

**To make real**:
- [ ] Fetch approved apps from backend
- [ ] Pass app data to AppItem
- [ ] **UNCERTAIN**: What actions are available on approved apps? View? Delete? Re-verify?

---

### `AppItem`
**Status**: 🔴 Placeholder Only

Card for an approved app.

**Current behavior**: Just displays "AppItem" text.

**To make real**:
- [ ] Display app name, thumbnail, status
- [ ] Add click action (view details? open in new tab?)
- [ ] **UNCERTAIN**: What data does an "app" have? Name, URL, thumbnail, creation date?

---

### `PendingVerificationView`
**Status**: ✅ Layout Implemented

80/20 horizontal split for verification workflow.

**Contains**:
- LivePreview (80%)
- SideControlPanel (20%)

**To make real**: Wire up to actual pending app data.

---

### `LivePreview`
**Status**: ⚠️ Partially Implemented

Iframe container with responsive width.

**Current behavior**: Shows placeholder text, responds to screenSize prop.

**To make real**:
- [ ] Replace placeholder with actual iframe
- [ ] Load pending app URL
- [ ] **UNCERTAIN**: What URL is loaded? A preview deployment? A local dev server?
- [ ] **UNCERTAIN**: Are there security considerations for iframe content?

---

### `SideControlPanel`
**Status**: ✅ Layout Implemented

Right panel with button groups.

**Contains**:
- ButtonStack (top)
- ActionButtons (bottom, separated)

**To make real**: Already functional structure.

---

### `ButtonStack`
**Status**: ✅ Fully Implemented

Vertical stack of 4 info buttons.

| Button | Opens Modal | Notes |
|--------|-------------|-------|
| Logs | ✅ LogsModal | |
| Readme | ✅ ReadmeModal | |
| FileSystem | ✅ FileSystemModal | |
| Imports | ❌ Nothing | Currently no action |

**To make real**:
- [ ] **UNCERTAIN**: What should Imports button do? Show import analysis? Another modal?

---

### `ActionButtons`
**Status**: ✅ Fully Implemented

Approve/Deny buttons.

| Button | Action |
|--------|--------|
| Approve | Nothing (no backend yet) |
| Deny | Opens DenyModal |

**To make real**:
- [ ] Connect Approve to backend (mark app as approved)
- [ ] After approve, move to next pending app or show empty state
- [ ] **UNCERTAIN**: What happens after approval? App moves to approved grid? Gets deployed?

---

### `LogsModal`
**Status**: 🔴 Placeholder Only

Modal for viewing app logs.

**Current behavior**: Shows "Logs Content" placeholder.

**To make real**:
- [ ] Fetch logs for current pending app
- [ ] Display in scrollable, monospace format
- [ ] **UNCERTAIN**: Build logs? Runtime logs? Agent logs?
- [ ] **UNCERTAIN**: Should support filtering, search, download?

---

### `ReadmeModal`
**Status**: 🔴 Placeholder Only

Modal for viewing app readme.

**Current behavior**: Shows "Readme Content" placeholder.

**To make real**:
- [ ] Fetch README.md content
- [ ] Render as markdown
- [ ] **UNCERTAIN**: Is this auto-generated or user-provided?

---

### `FileSystemModal`
**Status**: 🔴 Placeholder Only

Modal for viewing app file system.

**Current behavior**: Shows "FileSystem Content" placeholder.

**To make real**:
- [ ] Fetch file tree for pending app
- [ ] Render as expandable tree
- [ ] Click to view file contents?
- [ ] **UNCERTAIN**: Is this read-only or can files be edited?

---

### `DenyModal`
**Status**: ⚠️ Layout Implemented

Modal for denying/rejecting an app.

**Current behavior**: Shows placeholder + Cancel/Confirm Deny buttons.

**To make real**:
- [ ] Add reason input (why denying?)
- [ ] Connect Confirm Deny to backend
- [ ] Move to next pending app after denial
- [ ] **UNCERTAIN**: Is denial permanent? Can denied apps be re-submitted?

---

## Data Flow Summary

### WorkingQueuePage Flow
```
User selects source (GithubSwitcher in Breadcrumb)
  → selectedSource state updates in WorkingQueuePage
  → ChatWindow (Interview component) receives selectedSource
  → ChatWindow uses selectedSource to scope/filter its context
  → Note: QueueScreen does NOT use selectedSource

User clicks + button in ChatInput
  → AgentContextModal opens
  → User selects components/files to add as context
  → Selected items added to chat context

User types message and sends
  → ??? (needs backend)
  → Creates job in queue?
  → Job appears in QueueComponent

Job runs
  → Appears in ActiveJobComponent
  → When complete, result goes to PendingAppsPage?
```

### PendingAppsPage Flow
```
Pending apps exist (from job completion?)
  → BackNextNav cycles through them
  → LivePreview shows current app
  → User reviews via Logs/Readme/FileSystem

User approves
  → App moves to approved grid
  → Next pending app loads

User denies
  → DenyModal opens
  → User provides reason?
  → App removed from queue
```

---

## Major Unknowns

1. **What is a "source"?** - Appears to be a GitHub repository, but unclear what happens after adding one. Does it get indexed? Analyzed for components?

2. **What is the chat/interview for?** - The ChatWindow is called the "Interview component". Is this interviewing the user about what they want to extract? Talking to an AI agent? Creating extraction jobs?

3. **What is a "job"?** - Seems to be a task that creates an "app", but the flow is unclear. Is it a component extraction job?

4. **What is an "app"?** - The output of a job? A component extraction? A full application? Based on project name "CodeExtract", likely an extracted component/module.

5. **How do apps get to "pending"?** - From job completion in WorkingQueuePage?

6. **What does approval do?** - Deployment? Publication? Just marking as reviewed?

7. **Real-time updates** - Are WebSockets needed for queue/job status updates?

8. **Authentication** - No auth components exist. Is auth handled elsewhere?

9. **selectedSource scope** - Confirmed: selectedSource only affects ChatWindow, not QueueScreen. But why? Is the queue global while chat is source-specific?

10. **Component context (AgentContextModal)** - What exactly are the "components" that can be added as context? Files from the selected source repo? Previously extracted components?

---

## Implementation Priority

### Phase 1: Core Data
1. Define schemas for: Source, Job, App, Message
2. Set up API endpoints
3. Wire GithubSwitcher to real sources

### Phase 2: Chat Flow
1. Implement MessagesArea with real messages
2. Make ChatInput functional
3. Connect to job creation

### Phase 3: Queue System
1. Implement QueueComponent with real jobs
2. Implement ActiveJobComponent with live updates
3. Set up real-time updates (WebSocket?)

### Phase 4: Verification Flow
1. Wire PendingAppsPage to real pending apps
2. Implement LivePreview with real iframe
3. Implement modal contents (Logs, Readme, FileSystem)
4. Connect Approve/Deny to backend

### Phase 5: Polish
1. Empty states
2. Loading states
3. Error handling
4. Animations/transitions
