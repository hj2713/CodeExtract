# Research Task: DenyModal

## PREAMBLE: Domain Context

CodeExtract has 6 core entities. See `packages/db/src/schema/index.ts` (ignore archive tables):

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| **Source** | A GitHub repository to extract from | `id`, `name`, `originUrl`, `type`, `githubMetadata`, `components` |
| **Conversation** | A chat session scoped to a source | `id`, `sourceId`, `title` |
| **Message** | Individual chat messages | `id`, `conversationId`, `role`, `content` |
| **Requirement** | Extraction spec from a conversation | `id`, `sourceId`, `conversationId`, `requirement`, `context`, `title`, `status` |
| **Job** | Queue item with prompt payload | `id`, `type`, `payload`, `status`, `priority` |
| **CodeExample** | Output in created-apps folder | `id`, `requirementId`, `path`, `port`, `reviewStatus`, `rejectionReason`, `rejectionNotes` |

### Rejection Flow

When an app is rejected:
1. `codeExample.reviewStatus` → "rejected"
2. `rejectionReason` and `rejectionNotes` are saved
3. Optionally: modify prompt and re-queue as new job

---

## REQUIREMENT: DenyModal

**Component**: `apps/web/src/app/final/components/pending-apps-page/deny-modal.tsx`

**Current State**: Layout with Cancel/Confirm buttons. No input, no action.

**Data Needs**:
- Update `codeExample.reviewStatus` to "rejected"
- May need `rejectionReason` and `rejectionNotes`

**Key Behaviors**:
- Input for denial reason (select or text)
- Input for notes
- Confirm → update record, may re-queue with modified prompt
- Move to next pending app after denial

**Prototype**: `apps/web/src/app/partner/gallery/`

---

## RESEARCH INSTRUCTIONS

### Phase 1: Context Loading

Read these files:
1. `apps/web/src/app/final/SPECIFICATION.md`
2. `packages/db/src/schema/index.ts` - codeExamples table, rejectionReason enum

### Phase 2: Prototype Research

Study: `apps/web/src/app/partner/gallery/`

Focus on:
1. Rejection form implementation
2. Reason selection (enum values: does_not_run, incorrect, not_minimal, other)
3. Notes input
4. API call to update codeExample
5. Re-queue logic (if any)

### Phase 3: Interview

**Data Model Questions**:
- What rejection reasons are available?
- Is re-queuing automatic or manual?
- How is prompt modified for re-queue?

**UI Behavior Questions**:
- Dropdown for reason or radio buttons?
- Required notes for "other" reason?
- Confirmation before rejection?

**Integration Questions**:
- API endpoint for rejection?
- After rejection: auto-navigate to next app?
- Toast/feedback on success?

### Phase 4: Code Example Creation

**Working Directories**:
- Code: `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps/deny-modal/`
- Seed: `apps/web/src/app/MANUAL/seed/deny-modal/`

### Phase 5: Implementation Guide

Document integration steps for `/final`.
