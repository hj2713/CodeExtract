# Research Task: GithubSwitcher

## PREAMBLE: Domain Context

CodeExtract has 6 core entities. See `packages/db/src/schema/index.ts` (ignore archive tables):

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| **Source** | A GitHub repository to extract from | `id`, `name`, `originUrl`, `type`, `githubMetadata`, `components` |
| **Conversation** | A chat session scoped to a source | `id`, `sourceId`, `title` |
| **Message** | Individual chat messages | `id`, `conversationId`, `role`, `content` |
| **Requirement** | Extraction spec from a conversation | `id`, `sourceId`, `conversationId`, `requirement`, `context`, `title`, `status` |
| **Job** | Queue item with prompt payload | `id`, `type`, `payload`, `status`, `priority` |
| **CodeExample** | Output in created-apps folder | `id`, `requirementId`, `path`, `port`, `reviewStatus` |

### The Complete Flow

```
1. ADD SOURCE: User provides GitHub URL → Source record created
2. INTERVIEW: User chats with AI about source → Produces Requirement
3. QUEUE JOB: Requirement → Job with prompt in payload
4. WORKER: Claims job → Creates sandbox app in created-apps → Runs Claude Code
5. REVIEW: User approves/rejects in PendingAppsPage
```

### Architecture Note

`selectedSource` state flows through GithubSwitcher and ONLY affects ChatWindow. When source changes, conversation context changes. QueueScreen shows ALL jobs regardless of source.

---

## REQUIREMENT: GithubSwitcher

**Component**: `apps/web/src/app/final/components/working-queue-page/github-switcher.tsx`

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

**Prototype**: `apps/web/src/app/partner/backwards/prototypes/crud-prompt-github/`

---

## RESEARCH INSTRUCTIONS

### Phase 1: Context Loading

Read these files to understand the system:
1. `apps/web/src/app/final/SPECIFICATION.md` - UI specification
2. `apps/web/src/app/MANUAL/AGENT-WORKING-QUEUE.md` - Database records and seed scripts
3. `packages/db/src/schema/index.ts` - Data models (NOT archive tables)

### Phase 2: Prototype Research

Study the prototype at: `apps/web/src/app/partner/backwards/prototypes/crud-prompt-github/`

Your goal is to understand:
1. How sources are fetched from the database
2. What API routes exist for sources
3. How the dropdown/switcher UI works
4. What data flows in and out

Create a research report covering:
- **Files to copy/adapt**: List every file relevant to this feature
- **API routes needed**: What endpoints exist or need to be created
- **Data model usage**: Which tables/columns are used
- **Dependencies**: npm packages, internal imports

### Phase 3: Interview

Interview the user to clarify:

**Data Model Questions**:
- What fields from `sources` should display in the dropdown?
- Should it show repo owner/name or full URL?
- Any filtering (only certain source types)?

**UI Behavior Questions**:
- Loading state appearance?
- Empty state message?
- Error handling if fetch fails?

**Integration Questions**:
- How does selecting a source affect ChatWindow?
- Should selection persist (localStorage, URL param)?

### Phase 4: Code Example Creation

After research and interview, create a minimal code example.

**Working Directories**:
- Code: `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps/github-switcher-with-db/`
- Seed: `apps/web/src/app/MANUAL/seed/github-switcher-with-db/`

**Requirements**:
1. Standalone Next.js app
2. Fetches sources from database
3. Dropdown UI with selection
4. Mock data for demo

### Phase 5: Implementation Guide

Document how to integrate into `/final`:
1. Files to modify in `apps/web/src/app/final/components/working-queue-page/`
2. API route to create
3. Props interface changes
4. Parent component state updates
