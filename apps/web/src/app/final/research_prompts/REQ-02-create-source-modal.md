# Research Task: CreateSourceModal

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

---

## REQUIREMENT: CreateSourceModal

**Component**: `apps/web/src/app/final/components/working-queue-page/create-source-modal.tsx`

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

**Prototype**: `apps/web/src/app/partner/backwards/prototypes/crud-prompt-github/`

---

## RESEARCH INSTRUCTIONS

### Phase 1: Context Loading

Read these files:
1. `apps/web/src/app/final/SPECIFICATION.md`
2. `apps/web/src/app/MANUAL/AGENT-WORKING-QUEUE.md`
3. `packages/db/src/schema/index.ts`

### Phase 2: Prototype Research

Study: `apps/web/src/app/partner/backwards/prototypes/crud-prompt-github/`

Focus on:
1. How sources are created (form handling, API call)
2. GitHub URL parsing logic
3. What happens after source creation
4. Validation patterns

### Phase 3: Interview

**Data Model Questions**:
- What fields are required to create a source?
- Should we fetch GitHub metadata (stars, description) on creation?
- Does creation trigger any background jobs (analysis)?

**UI Behavior Questions**:
- What validation messages to show?
- Loading state during creation?
- Success feedback (toast, close modal, redirect)?

**Integration Questions**:
- Should newly created source auto-select in GithubSwitcher?
- Does GithubRepoTree show immediately or after analysis?

### Phase 4: Code Example Creation

**Working Directories**:
- Code: `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps/create-source-modal/`
- Seed: `apps/web/src/app/MANUAL/seed/create-source-modal/`

### Phase 5: Implementation Guide

Document integration steps for `/final`.
