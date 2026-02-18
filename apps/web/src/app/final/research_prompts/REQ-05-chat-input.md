# Research Task: ChatInput

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

## REQUIREMENT: ChatInput

**Component**: `apps/web/src/app/final/components/working-queue-page/chat-input.tsx`

**Current State**: Placeholder div (not real textarea). Plus button works. Send button does nothing.

**Data Needs**:
- POST new message to current conversation
- May need to trigger AI response

**Key Behaviors**:
- Actual textarea with auto-resize
- Send on button click
- Send on Enter (Shift+Enter for newline?)
- Disable while sending
- Plus button opens AgentContextModal

**Prototype**: `apps/web/src/app/himanshu/` (with all its complexity)

---

## RESEARCH INSTRUCTIONS

### Phase 1: Context Loading

Read these files:
1. `apps/web/src/app/final/SPECIFICATION.md`
2. `packages/db/src/schema/index.ts`

### Phase 2: Prototype Research

Study: `apps/web/src/app/himanshu/`

Focus on:
1. Textarea implementation (auto-resize?)
2. Send message API call
3. Keyboard handling (Enter vs Shift+Enter)
4. Loading/disabled state while sending
5. How AI response is triggered

### Phase 3: Interview

**Data Model Questions**:
- What endpoint receives the message?
- Does sending a message automatically trigger AI response?
- How is conversation ID determined?

**UI Behavior Questions**:
- Auto-resize textarea behavior?
- Character limit?
- Send button disabled states?

**Integration Questions**:
- How does ChatInput communicate with MessagesArea?
- Does the plus button add context to the message or separately?

### Phase 4: Code Example Creation

**Working Directories**:
- Code: `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps/chat-input/`
- Seed: `apps/web/src/app/MANUAL/seed/chat-input/`

### Phase 5: Implementation Guide

Document integration steps for `/final`.
