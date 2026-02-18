# Research Task: MessagesArea

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

The ChatWindow (containing MessagesArea) is scoped to `selectedSource`. When the source changes via GithubSwitcher, the conversation context changes.

---

## REQUIREMENT: MessagesArea

**Component**: `apps/web/src/app/final/components/working-queue-page/messages-area.tsx`

**Current State**: Placeholder text only.

**Data Needs**:
- Fetch `messages` for current `conversation`
- Conversation is scoped to `selectedSource`
- Messages have `role` (user/assistant) and `content`

**Key Behaviors**:
- Display message bubbles (different styling for user vs assistant)
- Auto-scroll to bottom on new messages
- Handle streaming responses (if AI responses stream)
- Empty state for new conversations

**Prototype**: `apps/web/src/app/himanshu/` (with all its complexity)

---

## RESEARCH INSTRUCTIONS

### Phase 1: Context Loading

Read these files:
1. `apps/web/src/app/final/SPECIFICATION.md`
2. `packages/db/src/schema/index.ts` - especially `conversations` and `messages` tables

### Phase 2: Prototype Research

Study: `apps/web/src/app/himanshu/`

**WARNING**: This prototype is complex. Focus specifically on:
1. How messages are fetched and displayed
2. Message bubble styling (user vs assistant)
3. Scrolling behavior
4. Streaming response handling (if present)
5. Conversation state management

### Phase 3: Interview

**Data Model Questions**:
- How is the current conversation determined from `selectedSource`?
- Is there one conversation per source, or multiple?
- Are messages fetched on load or real-time?

**UI Behavior Questions**:
- Streaming text animation for AI responses?
- Markdown rendering in messages?
- Code block syntax highlighting?
- Loading skeleton while fetching?

**Integration Questions**:
- How does MessagesArea receive new messages from ChatInput?
- Does it poll, use WebSocket, or optimistic updates?

### Phase 4: Code Example Creation

**Working Directories**:
- Code: `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps/messages-area/`
- Seed: `apps/web/src/app/MANUAL/seed/messages-area/`

### Phase 5: Implementation Guide

Document integration steps for `/final`.
