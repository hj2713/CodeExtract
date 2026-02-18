# Research Task: LogsModal Content

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

## REQUIREMENT: LogsModal Content

**Component**: `apps/web/src/app/final/components/pending-apps-page/logs-modal.tsx`

**Current State**: Modal wrapper works, content is placeholder.

**Data Needs**:
- Logs for current pending app
- Build logs? Runtime logs? Agent logs?

**Key Behaviors**:
- Scrollable, monospace log display
- Auto-scroll to bottom?
- May need filtering/search
- Download option?

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
1. Where logs are stored/fetched from
2. Log display component
3. Formatting and styling
4. Any filtering capabilities

### Phase 3: Interview

**Data Model Questions**:
- Where are logs stored? File? Database? Job record?
- What types of logs (build, runtime, agent)?
- Log format (plain text, structured JSON)?

**UI Behavior Questions**:
- Terminal-like appearance?
- Color coding for log levels?
- Search functionality?
- Copy/download buttons?

**Integration Questions**:
- API endpoint to fetch logs?
- Real-time streaming or fetch-on-open?

### Phase 4: Code Example Creation

**Working Directories**:
- Code: `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps/logs-modal/`
- Seed: `apps/web/src/app/MANUAL/seed/logs-modal/`

### Phase 5: Implementation Guide

Document integration steps for `/final`.
