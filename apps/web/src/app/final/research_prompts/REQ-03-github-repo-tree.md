# Research Task: GithubRepoTree

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

## REQUIREMENT: GithubRepoTree

**Component**: `apps/web/src/app/final/components/working-queue-page/github-repo-tree.tsx`

**Current State**: Placeholder text only.

**Data Needs**:
- GitHub repository tree (files/folders)
- May come from `source.components` or live GitHub API

**Key Behaviors**:
- Expandable tree view of repository structure
- Purpose unclear: viewing only? Or selecting files for context?
- Should lazy-load deep directories

**Prototype**: `apps/web/src/app/partner/backwards/prototypes/crud-prompt-github/`

---

## RESEARCH INSTRUCTIONS

### Phase 1: Context Loading

Read these files:
1. `apps/web/src/app/final/SPECIFICATION.md`
2. `packages/db/src/schema/index.ts`

### Phase 2: Prototype Research

Study: `apps/web/src/app/partner/backwards/prototypes/crud-prompt-github/`

Focus on:
1. How repository tree data is fetched
2. Tree rendering component
3. Expand/collapse behavior
4. File selection (if any)

### Phase 3: Interview

**Data Model Questions**:
- Does tree come from GitHub API or stored in `source.components`?
- What depth to fetch initially?
- Should file contents be viewable?

**UI Behavior Questions**:
- Lazy loading for nested directories?
- File type icons?
- Search/filter within tree?

**Integration Questions**:
- Is this for viewing only or selecting files?
- If selecting, how does selection integrate with CreateSourceModal?

### Phase 4: Code Example Creation

**Working Directories**:
- Code: `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps/github-repo-tree/`
- Seed: `apps/web/src/app/MANUAL/seed/github-repo-tree/`

### Phase 5: Implementation Guide

Document integration steps for `/final`.
