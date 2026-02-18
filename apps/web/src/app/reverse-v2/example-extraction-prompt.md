# Example Extraction Prompt

Use this as a template when instructing Claude to build a code example manually.

---

## The Prompt

```
WE ARE WORKING ON:
- {{CREATED_APPS_DIR}}/{{SLUG_NAME}} (the code)
- apps/web/src/app/MANUAL/seed/{{SLUG_NAME}}/ (the seed script)

IMPORTANT: You must do your best to not modify or create folders outside these working directories!

Your job is to BOTH:
1. Execute the extraction instruction below (build the actual code)
2. When done, create a seed script at `apps/web/src/app/MANUAL/seed/{{SLUG_NAME}}/seed.ts` with the database records that would exist if this feature was created through the normal queue system

Read the skill document at `apps/web/src/app/MANUAL/AGENT-WORKING-QUEUE.md` to understand:
- What records to create (sources, requirements, jobs, codeExamples)
- What data goes in each column
- The correct status values and payload structure

---

## Extraction Request

**Source**: {{GITHUB_URL or "ai_prototype" if building from scratch}}

**Title**: {{SHORT_TITLE}}

**Requirement**:
{{DETAILED_REQUIREMENT}}

**Context**:
{{ADDITIONAL_CONTEXT}}

---

## Seed Script

Create `apps/web/src/app/MANUAL/seed/{{SLUG_NAME}}/seed.ts` that:
1. Can be run standalone with `npx tsx seed.ts`
2. Inserts a `source` (if not already present for this repo)
3. Inserts a `requirement` with the spec above
4. Inserts a `job` with status "completed" and full payload
5. Inserts a `codeExample` pointing to the created folder with an allocated port

Use the naming convention: `extract-the-{slugified-title}`
```

---

## Concrete Example

Here's a filled-in version:

```
WE ARE WORKING ON:
- apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps/extract-the-kanban-board (the code)
- apps/web/src/app/MANUAL/seed/extract-the-kanban-board/ (the seed script)

IMPORTANT: You must do your best to not modify or create folders outside these working directories!

Your job is to BOTH:
1. Execute the extraction instruction below (build the actual code)
2. When done, create a seed script at `apps/web/src/app/MANUAL/seed/extract-the-kanban-board/seed.ts` with the database records that would exist if this feature was created through the normal queue system

Read the skill document at `apps/web/src/app/MANUAL/AGENT-WORKING-QUEUE.md` to understand:
- What records to create (sources, requirements, jobs, codeExamples)
- What data goes in each column
- The correct status values and payload structure

---

## Extraction Request

**Source**: https://github.com/trello/trello-web

**Title**: Kanban Board with Drag & Drop

**Requirement**:
Extract the main Kanban board component with full drag-and-drop functionality. Include:
- Column containers that accept dropped cards
- Draggable card components with title, labels, and assignee avatar
- The "Add Card" button and inline card creation form
- Column headers with card count and collapse toggle
- Drag preview/ghost styling during drag operations

Mock the API with static fixture data representing 3 columns (To Do, In Progress, Done) with 2-3 cards each.

**Context**:
Uses @dnd-kit for drag and drop. Cards have a hover state that shows quick actions (edit, archive). The board should be horizontally scrollable on smaller screens. Colors for labels come from a predefined palette.

---

## Seed Script

Create `apps/web/src/app/MANUAL/seed/extract-the-kanban-board/seed.ts` that:
1. Can be run standalone with `npx tsx seed.ts`
2. Inserts a `source` for trello/trello-web
3. Inserts a `requirement` with the Kanban board spec
4. Inserts a `job` with status "completed" and full payload
5. Inserts a `codeExample` pointing to `created-apps/extract-the-kanban-board` with port 4003
```

---

## Minimal Version (AI Prototype)

For components built from scratch (not extracted from a repo):

```
WE ARE WORKING ON:
- apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps/extract-the-command-palette (the code)
- apps/web/src/app/MANUAL/seed/extract-the-command-palette/ (the seed script)

IMPORTANT: You must do your best to not modify or create folders outside these working directories!

Your job is to BOTH:
1. Execute the extraction instruction below (build the actual code)
2. When done, create a seed script at `apps/web/src/app/MANUAL/seed/extract-the-command-palette/seed.ts`

Read the skill document at `apps/web/src/app/MANUAL/AGENT-WORKING-QUEUE.md` to understand the records needed.

---

## Extraction Request

**Source**: ai_prototype (building from scratch)

**Title**: Command Palette (⌘K)

**Requirement**:
Build a command palette component similar to VS Code's or Linear's. Include:
- Keyboard shortcut trigger (⌘K / Ctrl+K)
- Fuzzy search input with instant filtering
- Categorized results (Actions, Pages, Settings)
- Keyboard navigation (up/down arrows, enter to select)
- Recent items section at the top

**Context**:
Use cmdk library as the foundation. Style with Tailwind to match a dark theme. Include smooth open/close animations.

---

## Seed Script

Create `apps/web/src/app/MANUAL/seed/extract-the-command-palette/seed.ts` with:
- source.type = "ai_prototype"
- source.originUrl = null
- All other records as normal
```

---

## Running the Seed Script

After extraction is complete, run the seed script manually:

```bash
cd apps/web/src/app/MANUAL/seed/extract-the-kanban-board
npx tsx seed.ts
```
