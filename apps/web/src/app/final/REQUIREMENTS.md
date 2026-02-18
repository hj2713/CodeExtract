# CodeExtract Final UI Requirements

This document contains:
1. **PREAMBLE** - Essential domain context (include with every research task)
2. **REQUIREMENTS** - Individual component requirements

---

# PREAMBLE: Domain Context

**Include this section with every research task.** It explains how the system works.

## The Domain Model

CodeExtract has 6 core entities. See `packages/db/src/schema/index.ts` (ignore archive tables):

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| **Source** | A GitHub repository to extract from | `id`, `name`, `originUrl`, `type`, `githubMetadata`, `components` |
| **Conversation** | A chat session scoped to a source | `id`, `sourceId`, `title` |
| **Message** | Individual chat messages | `id`, `conversationId`, `role`, `content` |
| **Requirement** | Extraction spec from a conversation | `id`, `sourceId`, `conversationId`, `requirement`, `context`, `title`, `status` |
| **Job** | Queue item with prompt payload | `id`, `type`, `payload`, `status`, `priority` |
| **CodeExample** | Output in created-apps folder | `id`, `requirementId`, `path`, `port`, `reviewStatus` |

## The Complete Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. ADD SOURCE                                                               │
│    User provides GitHub URL → Source record created → Repo analyzed         │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. INTERVIEW (ChatWindow)                                                   │
│    - User selects source via GithubSwitcher                                 │
│    - Conversation is scoped to that source                                  │
│    - User can add components from repo as context (AgentContextModal)       │
│    - AI interviews user about what to extract                               │
│    - Goal: produce a detailed Requirement                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. CREATE REQUIREMENT                                                       │
│    Conversation → Requirement record with:                                  │
│    - requirement: detailed extraction spec                                  │
│    - context: additional notes                                              │
│    - relevantFiles: components to include                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. QUEUE JOB                                                                │
│    Requirement → Job record with:                                           │
│    - type: "claude_extraction"                                              │
│    - payload: { prompt, name, originUrl, requirementId, ... }               │
│    - status: "pending" → "claimed" → "completed"/"failed"                   │
│                                                                             │
│    Jobs appear in QueueComponent, active job in ActiveJobComponent          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. WORKER PROCESSING (invisible to UI but powers the queue)                 │
│    Worker claims job → Creates sandbox Next.js app in created-apps →        │
│    Runs Claude Code inside sandbox → Creates CodeExample record             │
│                                                                             │
│    ⚠️ BEWARE: Relative paths to created-apps folder can cause bugs          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ 6. REVIEW (PendingAppsPage)                                                 │
│    - LivePreview shows the created app                                      │
│    - User can view logs, readme, filesystem                                 │
│    - APPROVE: CodeExample.reviewStatus → "approved", moves to gallery       │
│    - REJECT: Modify prompt, create new job, re-queue                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Architecture: Two Pages

### Working Queue Page (Left: 30% | Right: 70%)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Header: [Breadcrumb > GithubSwitcher]                    [+ Create Source]  │
├────────────────────────┬────────────────────────────────────────────────────┤
│                        │                                                    │
│   ChatWindow (30%)     │              QueueScreen (70%)                     │
│   ┌──────────────────┐ │   ┌────────────────────────────────────────────┐   │
│   │  MessagesArea    │ │   │           QueueComponent (50%)             │   │
│   │  (interview)     │ │   │           (list of pending jobs)           │   │
│   │                  │ │   ├────────────────────────────────────────────┤   │
│   ├──────────────────┤ │   │        ActiveJobComponent (50%)            │   │
│   │  ChatInput       │ │   │        (currently running job)             │   │
│   │  [+] [________]  │ │   └────────────────────────────────────────────┘   │
│   └──────────────────┘ │                                                    │
└────────────────────────┴────────────────────────────────────────────────────┘
```

**Key Insight**: `selectedSource` state flows through GithubSwitcher and ONLY affects ChatWindow. When source changes, conversation context changes. QueueScreen shows ALL jobs regardless of source.

### Pending Apps Page
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ControlPanel: [Desktop|Tablet|Mobile] [< 1 >]              [Toggle:Approved]│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  IF isApproved=true:  AppGrid (approved code examples)                      │
│                                                                             │
│  IF isApproved=false: PendingVerificationView                               │
│  ┌─────────────────────────────────────────────────┬──────────────────────┐ │
│  │                                                 │   [Logs]             │ │
│  │              LivePreview (80%)                  │   [Readme]           │ │
│  │              (iframe of created app)            │   [FileSystem]       │ │
│  │                                                 │   [Imports]          │ │
│  │                                                 │                      │ │
│  │                                                 │   [Approve] [Deny]   │ │
│  └─────────────────────────────────────────────────┴──────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Important Implementation Notes

1. **Copy-Paste Philosophy**: Avoid cross-cutting abstractions. Copy code into components rather than creating shared utilities.

2. **API Routes**: The main cross-cutting concern. Keep each route focused and used in ~1 place.

3. **Prototype Location**: Solution code lives in `apps/web/src/app/partner/backwards/prototypes/`. User will specify which prototype to research.

4. **created-apps Folder**: Worker creates sandbox apps here. Watch for relative path bugs.

5. **Database**: SQLite via Drizzle ORM. Schema in `packages/db/src/schema/index.ts`.

6. **No Global State**: Props drilling only. State lives in page components.

---

# REQUIREMENTS

Each requirement below describes a placeholder component in `/final` that needs implementation.

Format:
- **Component**: Name and path
- **Current State**: What exists now
- **Data Needs**: What database entities/fields it requires
- **Key Behaviors**: What it should do
- **Prototype**: `[TO BE SPECIFIED]` - User provides this when starting research

---

## REQ-01: GithubSwitcher

**Component**: `working-queue-page/github-switcher.tsx`

**Current State**: Uses hardcoded `DUMMY_SOURCES` array. Dropdown UI works.

**Data Needs**:
- Fetch all `sources` from database
- Display `source.name` and `source.originUrl`
- Track `selectedSource` (source ID)

**Key Behaviors**:
- Dropdown opens on click, closes on outside click
- Selecting a source updates `selectedSource` state in parent
- Should show loading state while fetching
- Should handle empty state (no sources yet)

**Prototype**: `[TO BE SPECIFIED]`

---

## REQ-02: CreateSourceModal

**Component**: `working-queue-page/create-source-modal.tsx`

**Current State**: Form with GitHub URL input. Submit logs to console only. GithubRepoTree is placeholder.

**Data Needs**:
- POST to create new `source` record
- Need to parse GitHub URL to extract owner/repo
- May need to fetch repo metadata from GitHub API

**Key Behaviors**:
- Validate GitHub URL format
- Submit creates source record
- After creation: close modal? Show in GithubSwitcher?
- Error handling for invalid URLs, API failures

**Prototype**: `[TO BE SPECIFIED]`

---

## REQ-03: GithubRepoTree

**Component**: `working-queue-page/github-repo-tree.tsx`

**Current State**: Placeholder text only.

**Data Needs**:
- GitHub repository tree (files/folders)
- May come from `source.components` or live GitHub API

**Key Behaviors**:
- Expandable tree view of repository structure
- Purpose unclear: viewing only? Or selecting files for context?
- Should lazy-load deep directories

**Prototype**: `[TO BE SPECIFIED]`

---

## REQ-04: MessagesArea

**Component**: `working-queue-page/messages-area.tsx`

**Current State**: Placeholder text only.

**Data Needs**:
- Fetch `messages` for current `conversation`
- Conversation is scoped to `selectedSource`
- Messages have `role` (user/assistant) and `content`

**Key Behaviors**:
- Display message bubbles (different styling for user vs assistant)
- Auto-scroll to bottom on new messages
- Handle streaming responses (if AI responses stream)
- Empty state for new conversations

**Prototype**: `[TO BE SPECIFIED]`

---

## REQ-05: ChatInput

**Component**: `working-queue-page/chat-input.tsx`

**Current State**: Placeholder div (not real textarea). Plus button works. Send button does nothing.

**Data Needs**:
- POST new message to current conversation
- May need to trigger AI response

**Key Behaviors**:
- Actual textarea with auto-resize
- Send on button click
- Send on Enter (Shift+Enter for newline?)
- Disable while sending
- Plus button opens AgentContextModal

**Prototype**: `[TO BE SPECIFIED]`

---

## REQ-06: AgentContextModal

**Component**: `working-queue-page/agent-context-modal.tsx`

**Current State**: Layout complete. Contains placeholder ComponentCardList.

**Data Needs**:
- Components from selected source (`source.components`)
- Track multi-selection state

**Key Behaviors**:
- Show list of components from source repo
- Multi-select components to add as context
- "Add Selected" adds to chat context (how? prepend to next message?)
- Selection state clears on close

**Prototype**: `[TO BE SPECIFIED]`

---

## REQ-07: ComponentCardList

**Component**: `working-queue-page/component-card-list.tsx`

**Current State**: Placeholder text only.

**Data Needs**:
- Array of components: `{ name, description, filePath }`
- From `source.components` field

**Key Behaviors**:
- Render cards for each component
- Cards are selectable (checkbox or highlight)
- Track selection in parent (AgentContextModal)
- Show component name, description, file path

**Prototype**: `[TO BE SPECIFIED]`

---

## REQ-08: QueueComponent

**Component**: `working-queue-page/queue-component.tsx`

**Current State**: Placeholder text only.

**Data Needs**:
- Fetch `jobs` with status "pending" or "claimed"
- Job has `type`, `payload`, `status`, `priority`, `createdAt`

**Key Behaviors**:
- List of queued jobs with status indicators (StatusDot)
- Click job to view details?
- Real-time updates (polling or WebSocket)
- Show job name from payload
- May need to show position in queue

**Prototype**: `[TO BE SPECIFIED]`

---

## REQ-09: ActiveJobComponent

**Component**: `working-queue-page/active-job-component.tsx`

**Current State**: Placeholder text only.

**Data Needs**:
- Currently running job (status = "claimed")
- Job progress/logs (if available)

**Key Behaviors**:
- Show active job details
- Stream logs/progress in real-time
- Show job actions (cancel?)
- Empty state when no active job
- May show multiple if parallel workers

**Prototype**: `[TO BE SPECIFIED]`

---

## REQ-10: Header Worker Count

**Component**: `working-queue-page/header.tsx`

**Current State**: Hardcoded "1" for worker count.

**Data Needs**:
- Number of active workers
- Worker status (online/offline)

**Key Behaviors**:
- Display current worker count
- May need real-time updates
- StatusDot for worker health?

**Prototype**: `[TO BE SPECIFIED]`

---

## REQ-11: AppGrid

**Component**: `pending-apps-page/app-grid.tsx`

**Current State**: Maps over hardcoded `[1,2,3,4,5,6]` array.

**Data Needs**:
- Fetch `codeExamples` with `reviewStatus = "approved"`
- Join with `requirements` for title/description

**Key Behaviors**:
- Responsive grid (1 col mobile, 2 tablet, 3 desktop)
- Render AppItem for each approved example
- Click to view/open in new tab?
- Handle empty state

**Prototype**: `[TO BE SPECIFIED]`

---

## REQ-12: AppItem

**Component**: `pending-apps-page/app-item.tsx`

**Current State**: Placeholder text only.

**Data Needs**:
- CodeExample: `path`, `port`, `reviewStatus`
- Requirement: `title`, `requirement`

**Key Behaviors**:
- Display app name/title
- Thumbnail or preview image?
- Show status badge
- Click action (view details? open preview?)

**Prototype**: `[TO BE SPECIFIED]`

---

## REQ-13: LivePreview

**Component**: `pending-apps-page/live-preview.tsx`

**Current State**: Placeholder div, responds to screenSize prop for width.

**Data Needs**:
- URL to the running app (based on `codeExample.port`)
- Port allocation must be unique per app

**Key Behaviors**:
- Render iframe with app URL
- Respond to screenSize (desktop/tablet/mobile widths)
- Handle loading state
- Handle app not running state
- Security considerations for iframe

**Prototype**: `[TO BE SPECIFIED]`

---

## REQ-14: LogsModal Content

**Component**: `pending-apps-page/logs-modal.tsx`

**Current State**: Modal wrapper works, content is placeholder.

**Data Needs**:
- Logs for current pending app
- Build logs? Runtime logs? Agent logs?

**Key Behaviors**:
- Scrollable, monospace log display
- Auto-scroll to bottom?
- May need filtering/search
- Download option?

**Prototype**: `[TO BE SPECIFIED]`

---

## REQ-15: ReadmeModal Content

**Component**: `pending-apps-page/readme-modal.tsx`

**Current State**: Modal wrapper works, content is placeholder.

**Data Needs**:
- README.md content from `codeExample.path`

**Key Behaviors**:
- Fetch and render markdown
- Syntax highlighting for code blocks
- Handle missing README

**Prototype**: `[TO BE SPECIFIED]`

---

## REQ-16: FileSystemModal Content

**Component**: `pending-apps-page/file-system-modal.tsx`

**Current State**: Modal wrapper works, content is placeholder.

**Data Needs**:
- File tree for `codeExample.path`

**Key Behaviors**:
- Expandable tree view
- Click to view file contents?
- Read-only or allow edits?
- Show file sizes?

**Prototype**: `[TO BE SPECIFIED]`

---

## REQ-17: DenyModal

**Component**: `pending-apps-page/deny-modal.tsx`

**Current State**: Layout with Cancel/Confirm buttons. No input, no action.

**Data Needs**:
- Update `codeExample.reviewStatus` to "rejected"
- May need `rejectionReason` and `rejectionNotes`

**Key Behaviors**:
- Input for denial reason (select or text)
- Input for notes
- Confirm → update record, may re-queue with modified prompt
- Move to next pending app after denial

**Prototype**: `[TO BE SPECIFIED]`

---

## REQ-18: ActionButtons

**Component**: `pending-apps-page/action-buttons.tsx`

**Current State**: Approve does nothing. Deny opens modal.

**Data Needs**:
- Update `codeExample.reviewStatus` to "approved" or "rejected"

**Key Behaviors**:
- Approve: update status, move to next app
- Deny: open DenyModal
- Disable while processing
- Success/error feedback

**Prototype**: `[TO BE SPECIFIED]`

---

## REQ-19: BackNextNav

**Component**: `pending-apps-page/back-next-nav.tsx`

**Current State**: Back disabled at 0, Next always enabled (no upper bound).

**Data Needs**:
- Total count of pending apps
- Current index

**Key Behaviors**:
- Disable Back at index 0
- Disable Next at last item
- Update currentAppIndex in parent
- Show "X of Y" format?

**Prototype**: `[TO BE SPECIFIED]`

---

## REQ-20: ButtonStack Imports

**Component**: `pending-apps-page/button-stack.tsx`

**Current State**: Logs/Readme/FileSystem open modals. Imports does nothing.

**Data Needs**:
- Import analysis for the app?
- Package.json dependencies?

**Key Behaviors**:
- What should Imports show? Needs clarification.
- May open another modal or inline display

**Prototype**: `[TO BE SPECIFIED]`

---

# Using This Document

## For Each Research Task:

1. Copy the **PREAMBLE** section (everything above "REQUIREMENTS")
2. Copy the specific **REQ-XX** section for the component
3. Get prototype path from user
4. Combine with **BOILERPLATE.md** template
5. Run the research agent

## Example Combined Prompt:

```
[PREAMBLE from REQUIREMENTS.md]

---

[REQ-04: MessagesArea from REQUIREMENTS.md]

**Prototype**: apps/web/src/app/partner/backwards/prototypes/chat-interface/

---

[Full template from BOILERPLATE.md with variables filled in]
```
