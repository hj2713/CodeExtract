# Research Task: AppGrid

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

## REQUIREMENT: AppGrid

**Component**: `apps/web/src/app/final/components/pending-apps-page/app-grid.tsx`

**Current State**: Maps over hardcoded `[1,2,3,4,5,6]` array.

**Data Needs**:
- Fetch `codeExamples` with `reviewStatus = "approved"`
- Join with `requirements` for title/description

**Key Behaviors**:
- Responsive grid (1 col mobile, 2 tablet, 3 desktop)
- Render AppItem for each approved example
- Click to view/open in new tab?
- Handle empty state

**Prototype**: `apps/web/src/app/partner/gallery/`

---

## RESEARCH INSTRUCTIONS

### Phase 1: Context Loading

Read these files:
1. `apps/web/src/app/final/SPECIFICATION.md`
2. `packages/db/src/schema/index.ts` - codeExamples and requirements tables

### Phase 2: Prototype Research

Study: `apps/web/src/app/partner/gallery/`

Focus on:
1. How approved code examples are fetched
2. Grid layout implementation
3. Data joining (codeExample + requirement)
4. Empty state handling

### Phase 3: Interview

**Data Model Questions**:
- What fields needed from codeExample and requirement?
- Any additional filtering (date range, source)?
- Pagination for large galleries?

**UI Behavior Questions**:
- Grid responsive breakpoints match current (1/2/3)?
- Click action on item (open preview? new tab?)?
- Empty state message?

**Integration Questions**:
- Does clicking go to a detail page or open LivePreview?
- Any sorting options?

### Phase 4: Code Example Creation

**Working Directories**:
- Code: `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps/app-grid/`
- Seed: `apps/web/src/app/MANUAL/seed/app-grid/`

### Phase 5: Implementation Guide

Document integration steps for `/final`.
