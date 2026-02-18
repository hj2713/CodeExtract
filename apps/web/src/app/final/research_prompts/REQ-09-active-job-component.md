# Research Task: ActiveJobComponent

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

### Worker Context

The worker claims a job, creates a sandbox Next.js app in `created-apps`, and runs Claude Code inside it. This component shows the active job's progress.

---

## REQUIREMENT: ActiveJobComponent

**Component**: `apps/web/src/app/final/components/working-queue-page/active-job-component.tsx`

**Current State**: Placeholder text only.

**Data Needs**:
- Currently running job (status = "claimed")
- Job progress/logs (if available)

**Key Behaviors**:
- Show active job details
- Stream logs/progress in real-time
- Show job actions (cancel?)
- Empty state when no active job
- May show multiple if parallel workers

**Prototype**: `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/`

---

## RESEARCH INSTRUCTIONS

### Phase 1: Context Loading

Read these files:
1. `apps/web/src/app/final/SPECIFICATION.md`
2. `apps/web/src/app/MANUAL/AGENT-WORKING-QUEUE.md`
3. `packages/db/src/schema/index.ts`

### Phase 2: Prototype Research

Study: `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/`

Focus on:
1. How active job is identified
2. Progress/log streaming
3. Job detail display
4. Cancel functionality (if any)
5. Multiple active jobs handling

### Phase 3: Interview

**Data Model Questions**:
- How are logs stored/streamed?
- Is there a progress percentage or just logs?
- Can there be multiple active jobs (multiple workers)?

**UI Behavior Questions**:
- Log display format (terminal-like?)?
- Auto-scroll for logs?
- Progress indicator style?

**Integration Questions**:
- How does this component know which job is active?
- Real-time update mechanism?

### Phase 4: Code Example Creation

**Working Directories**:
- Code: `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps/active-job-component/`
- Seed: `apps/web/src/app/MANUAL/seed/active-job-component/`

### Phase 5: Implementation Guide

Document integration steps for `/final`.
