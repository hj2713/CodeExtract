# Research Task: Header Worker Count

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

## REQUIREMENT: Header Worker Count

**Component**: `apps/web/src/app/final/components/working-queue-page/header.tsx`

**Current State**: Hardcoded "1" for worker count.

**Data Needs**:
- Number of active workers
- Worker status (online/offline)

**Key Behaviors**:
- Display current worker count
- May need real-time updates
- StatusDot for worker health?

**Prototype**: `NONE - needs to be built from scratch`

---

## RESEARCH INSTRUCTIONS

### Phase 1: Context Loading

Read these files:
1. `apps/web/src/app/final/SPECIFICATION.md`
2. `packages/db/src/schema/index.ts`

### Phase 2: Design Research

Since no prototype exists, research how workers are tracked in the system:

1. Check `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/` for worker logic
2. Look for any worker registration/heartbeat mechanism
3. Determine if workers are tracked in DB or in-memory

### Phase 3: Interview

**Data Model Questions**:
- How are workers registered in the system?
- Is there a workers table or derived from jobs.lockedBy?
- What defines an "active" worker?

**UI Behavior Questions**:
- Just a count, or list of workers?
- Real-time updates needed?
- What to show if no workers?

**Integration Questions**:
- API endpoint to get worker count?
- Polling interval?

### Phase 4: Code Example Creation

**Working Directories**:
- Code: `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps/worker-count/`
- Seed: `apps/web/src/app/MANUAL/seed/worker-count/`

**Note**: This may be a simple feature that doesn't need a full code example. Consider if a minimal implementation in-place is sufficient.

### Phase 5: Implementation Guide

Document how to add worker count to header.
