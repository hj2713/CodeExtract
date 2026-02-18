# Research Task: ReadmeModal Content

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

## REQUIREMENT: ReadmeModal Content

**Component**: `apps/web/src/app/final/components/pending-apps-page/readme-modal.tsx`

**Current State**: Modal wrapper works, content is placeholder.

**Data Needs**:
- README.md content from `codeExample.path`

**Key Behaviors**:
- Fetch and render markdown
- Syntax highlighting for code blocks
- Handle missing README

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
1. How README is fetched (API route? direct file read?)
2. Markdown rendering library
3. Code block syntax highlighting
4. Styling to match design system

### Phase 3: Interview

**Data Model Questions**:
- Is README always at `{codeExample.path}/README.md`?
- Fallback if no README exists?

**UI Behavior Questions**:
- Markdown styles (headers, lists, code)?
- Link handling (open in new tab)?
- Image rendering?

**Integration Questions**:
- API endpoint to fetch README content?
- Caching?

### Phase 4: Code Example Creation

**Working Directories**:
- Code: `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps/readme-modal/`
- Seed: `apps/web/src/app/MANUAL/seed/readme-modal/`

### Phase 5: Implementation Guide

Document integration steps for `/final`.
