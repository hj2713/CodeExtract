# Research Task: AgentContextModal

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

## REQUIREMENT: AgentContextModal

**Component**: `apps/web/src/app/final/components/working-queue-page/agent-context-modal.tsx`

**Current State**: Layout complete. Contains placeholder ComponentCardList.

**Data Needs**:
- Components from selected source (`source.components`)
- Track multi-selection state

**Key Behaviors**:
- Show list of components from source repo
- Multi-select components to add as context
- "Add Selected" adds to chat context (how? prepend to next message?)
- Selection state clears on close

**Prototype**: `apps/web/src/app/himanshu/`

---

## RESEARCH INSTRUCTIONS

### Phase 1: Context Loading

Read these files:
1. `apps/web/src/app/final/SPECIFICATION.md`
2. `packages/db/src/schema/index.ts` - especially `source.components` field

### Phase 2: Prototype Research

Study: `apps/web/src/app/himanshu/`

Focus on:
1. How components are listed for selection
2. Multi-select UI pattern
3. How selected components are added to chat context
4. Modal open/close behavior

### Phase 3: Interview

**Data Model Questions**:
- Where do component options come from? (`source.components`?)
- What fields does each component have (name, description, filePath)?
- How is "context" represented in the chat?

**UI Behavior Questions**:
- Checkbox or click-to-toggle selection?
- Search/filter components?
- Show component preview on hover?

**Integration Questions**:
- How does "Add Selected" affect the next message?
- Is context prepended to message content or sent separately?
- Does context persist across messages or one-time?

### Phase 4: Code Example Creation

**Working Directories**:
- Code: `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps/agent-context-modal/`
- Seed: `apps/web/src/app/MANUAL/seed/agent-context-modal/`

### Phase 5: Implementation Guide

Document integration steps for `/final`.
