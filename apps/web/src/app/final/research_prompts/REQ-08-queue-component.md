# Research Task: QueueComponent

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

### Architecture Note

QueueScreen shows ALL jobs regardless of selected source. The queue is global.

---

## REQUIREMENT: QueueComponent

**Component**: `apps/web/src/app/final/components/working-queue-page/queue-component.tsx`

**Current State**: Placeholder text only.

**Data Needs**:
- Fetch `jobs` with status "pending" or "claimed"
- Job has `type`, `payload`, `status`, `priority`, `createdAt`

**Key Behaviors**:
- List of queued jobs with status indicators (StatusDot)
- Click job to view details?
- Real-time updates (polling or WebSocket)
- Show job name from payload
- May need to show position in queue

**Prototype**: `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/`

---

## RESEARCH INSTRUCTIONS

### Phase 1: Context Loading

Read these files:
1. `apps/web/src/app/final/SPECIFICATION.md`
2. `apps/web/src/app/MANUAL/AGENT-WORKING-QUEUE.md` - job payload structure
3. `packages/db/src/schema/index.ts` - jobs table

### Phase 2: Prototype Research

Study: `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/`

Focus on:
1. How jobs are fetched
2. Job list rendering
3. Status indicators
4. Real-time update mechanism
5. Worker integration

### Phase 3: Interview

**Data Model Questions**:
- What fields from job payload to display?
- Filter by status (pending only? pending + claimed?)?
- Sort order (priority? createdAt?)?

**UI Behavior Questions**:
- Click action on job item?
- Status color mapping?
- Queue position indicator?

**Integration Questions**:
- Polling interval for updates?
- Does clicking a job affect ActiveJobComponent?

### Phase 4: Code Example Creation

**Working Directories**:
- Code: `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps/queue-component/`
- Seed: `apps/web/src/app/MANUAL/seed/queue-component/`

### Phase 5: Implementation Guide

Document integration steps for `/final`.
