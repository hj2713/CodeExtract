# Research Task: ButtonStack Imports

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

## REQUIREMENT: ButtonStack Imports Button

**Component**: `apps/web/src/app/final/components/pending-apps-page/button-stack.tsx`

**Current State**: Logs/Readme/FileSystem open modals. Imports button does nothing.

**Data Needs**:
- Import analysis for the app?
- Package.json dependencies?

**Key Behaviors**:
- What should Imports show? Needs clarification.
- May open another modal or inline display

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
1. What the Imports button does (if implemented)
2. Import/dependency analysis
3. Display format

### Phase 3: Interview

**Critical Questions - Purpose Unclear**:
- What should the Imports button show?
- Is this package.json dependencies?
- Or import statements analysis?
- Or external module usage?

**Data Model Questions**:
- Where is import data stored/derived?
- Analysis done at build time or on-demand?

**UI Behavior Questions**:
- Open a modal like the others?
- Or different display method?

**Integration Questions**:
- API endpoint to get import data?
- How is analysis performed?

### Phase 4: Code Example Creation

**Note**: This requirement may need significant clarification before implementation.

**Working Directories**:
- Code: `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps/imports-button/`
- Seed: `apps/web/src/app/MANUAL/seed/imports-button/`

### Phase 5: Implementation Guide

Document integration steps for `/final` once purpose is clarified.
