# Research Task: BackNextNav

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

---

## REQUIREMENT: BackNextNav

**Component**: `apps/web/src/app/final/components/pending-apps-page/back-next-nav.tsx`

**Current State**: Back disabled at 0, Next always enabled (no upper bound).

**Data Needs**:
- Total count of pending apps
- Current index

**Key Behaviors**:
- Disable Back at index 0
- Disable Next at last item
- Update currentAppIndex in parent
- Show "X of Y" format?

**Prototype**: `apps/web/src/app/partner/gallery/`

---

## RESEARCH INSTRUCTIONS

### Phase 1: Context Loading

Read these files:
1. `apps/web/src/app/final/SPECIFICATION.md`
2. `packages/db/src/schema/index.ts`

### Phase 2: Prototype Research

Study: `apps/web/src/app/partner/gallery/`

Focus on:
1. How total count is obtained
2. Navigation logic
3. Display format (current/total)
4. Edge case handling

### Phase 3: Interview

**Data Model Questions**:
- How to get count of pending apps?
- Is the list of pending apps fetched upfront or paginated?

**UI Behavior Questions**:
- Show "1 of 5" or just "1"?
- Keyboard shortcuts (arrow keys)?
- Wrap around or stop at ends?

**Integration Questions**:
- Does changing index trigger data fetch for new app?
- Or is all pending app data pre-loaded?

### Phase 4: Code Example Creation

**Working Directories**:
- Code: `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps/back-next-nav/`
- Seed: `apps/web/src/app/MANUAL/seed/back-next-nav/`

### Phase 5: Implementation Guide

Document integration steps for `/final`.
