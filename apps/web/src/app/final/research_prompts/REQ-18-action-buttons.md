# Research Task: ActionButtons

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

### Approval Flow

When an app is approved:
1. `codeExample.reviewStatus` → "approved"
2. App becomes visible in AppGrid gallery
3. Navigate to next pending app

---

## REQUIREMENT: ActionButtons

**Component**: `apps/web/src/app/final/components/pending-apps-page/action-buttons.tsx`

**Current State**: Approve does nothing. Deny opens modal.

**Data Needs**:
- Update `codeExample.reviewStatus` to "approved" or "rejected"

**Key Behaviors**:
- Approve: update status, move to next app
- Deny: open DenyModal
- Disable while processing
- Success/error feedback

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
1. Approve button implementation
2. API call for status update
3. Loading/disabled states
4. Navigation after action
5. Success/error feedback

### Phase 3: Interview

**Data Model Questions**:
- Just status update or any other fields?
- Does approval trigger any side effects?

**UI Behavior Questions**:
- Disable both buttons while processing?
- Toast notification on success?
- Optimistic update or wait for API?

**Integration Questions**:
- API endpoint for approval?
- How to navigate to next app after action?
- What if this was the last pending app?

### Phase 4: Code Example Creation

**Working Directories**:
- Code: `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps/action-buttons/`
- Seed: `apps/web/src/app/MANUAL/seed/action-buttons/`

### Phase 5: Implementation Guide

Document integration steps for `/final`.
