# Research Task: ComponentCardList

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

## REQUIREMENT: ComponentCardList

**Component**: `apps/web/src/app/final/components/working-queue-page/component-card-list.tsx`

**Current State**: Placeholder text only.

**Data Needs**:
- Array of components: `{ name, description, filePath }`
- From `source.components` field

**Key Behaviors**:
- Render cards for each component
- Cards are selectable (checkbox or highlight)
- Track selection in parent (AgentContextModal)
- Show component name, description, file path

**Prototype**: `apps/web/src/app/himanshu/`

---

## RESEARCH INSTRUCTIONS

### Phase 1: Context Loading

Read these files:
1. `apps/web/src/app/final/SPECIFICATION.md`
2. `packages/db/src/schema/index.ts`

### Phase 2: Prototype Research

Study: `apps/web/src/app/himanshu/`

Focus on:
1. Component card rendering
2. Selection state management
3. Card styling (selected vs unselected)
4. How selection is communicated to parent

### Phase 3: Interview

**Data Model Questions**:
- Exact shape of component objects?
- Any additional fields (type, size, dependencies)?

**UI Behavior Questions**:
- Card layout (grid or list)?
- Visual feedback for selection (border, background, checkbox)?
- Hover states?

**Integration Questions**:
- Does this component manage its own selection state or receive from parent?
- Callback signature for selection changes?

### Phase 4: Code Example Creation

**Working Directories**:
- Code: `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps/component-card-list/`
- Seed: `apps/web/src/app/MANUAL/seed/component-card-list/`

### Phase 5: Implementation Guide

Document integration steps for `/final`.
