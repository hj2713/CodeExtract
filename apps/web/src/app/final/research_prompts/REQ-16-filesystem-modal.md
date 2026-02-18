# Research Task: FileSystemModal Content

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

## REQUIREMENT: FileSystemModal Content

**Component**: `apps/web/src/app/final/components/pending-apps-page/file-system-modal.tsx`

**Current State**: Modal wrapper works, content is placeholder.

**Data Needs**:
- File tree for `codeExample.path`

**Key Behaviors**:
- Expandable tree view
- Click to view file contents?
- Read-only or allow edits?
- Show file sizes?

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
1. How file tree is fetched
2. Tree component rendering
3. Expand/collapse behavior
4. File content viewing (if any)
5. File type icons

### Phase 3: Interview

**Data Model Questions**:
- API endpoint to list directory contents?
- Does it return full tree or lazy-load?
- File metadata (size, modified date)?

**UI Behavior Questions**:
- Click file → view content in modal?
- File type icons?
- Search/filter files?

**Integration Questions**:
- Read-only or allow editing?
- Syntax highlighting for code files?

### Phase 4: Code Example Creation

**Working Directories**:
- Code: `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps/filesystem-modal/`
- Seed: `apps/web/src/app/MANUAL/seed/filesystem-modal/`

### Phase 5: Implementation Guide

Document integration steps for `/final`.
