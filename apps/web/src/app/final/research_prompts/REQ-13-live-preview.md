# Research Task: LivePreview

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

## REQUIREMENT: LivePreview

**Component**: `apps/web/src/app/final/components/pending-apps-page/live-preview.tsx`

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

**Prototype**: `apps/web/src/app/partner/gallery/`

---

## RESEARCH INSTRUCTIONS

### Phase 1: Context Loading

Read these files:
1. `apps/web/src/app/final/SPECIFICATION.md`
2. `packages/db/src/schema/index.ts` - codeExample.port field

### Phase 2: Prototype Research

Study: `apps/web/src/app/partner/gallery/`

Focus on:
1. How iframe is rendered
2. URL construction from port
3. Responsive sizing logic
4. Loading/error states
5. iframe security attributes

### Phase 3: Interview

**Data Model Questions**:
- URL format? `http://localhost:{port}`?
- How to know if app is running?
- What if port is in use or app crashed?

**UI Behavior Questions**:
- Loading spinner while iframe loads?
- Error message if app not running?
- Refresh button?

**Integration Questions**:
- Does parent pass the codeExample object or just port?
- How does screenSize prop affect width?

### Phase 4: Code Example Creation

**Working Directories**:
- Code: `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps/live-preview/`
- Seed: `apps/web/src/app/MANUAL/seed/live-preview/`

### Phase 5: Implementation Guide

Document integration steps for `/final`.
