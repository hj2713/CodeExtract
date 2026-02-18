# Research Task: AppItem

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

## REQUIREMENT: AppItem

**Component**: `apps/web/src/app/final/components/pending-apps-page/app-item.tsx`

**Current State**: Placeholder text only.

**Data Needs**:
- CodeExample: `path`, `port`, `reviewStatus`
- Requirement: `title`, `requirement`

**Key Behaviors**:
- Display app name/title
- Thumbnail or preview image?
- Show status badge
- Click action (view details? open preview?)

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
1. App card rendering
2. Thumbnail generation/display
3. Title and metadata display
4. Click behavior

### Phase 3: Interview

**Data Model Questions**:
- Is there a thumbnail field or generated on-the-fly?
- What metadata to show (date, source, port)?

**UI Behavior Questions**:
- Card aspect ratio?
- Hover effects?
- Badge styling for status?

**Integration Questions**:
- Click opens new tab to `localhost:{port}`?
- Or opens inline preview?

### Phase 4: Code Example Creation

**Working Directories**:
- Code: `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps/app-item/`
- Seed: `apps/web/src/app/MANUAL/seed/app-item/`

### Phase 5: Implementation Guide

Document integration steps for `/final`.
