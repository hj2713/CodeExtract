# Research Agent Boilerplate

This document is a template for research agents. Combine this with:
1. The PREAMBLE section from REQUIREMENTS.md (domain context)
2. A specific requirement from REQUIREMENTS.md
3. A prototype path (provided by user)

---

## Template Variables

Replace these when constructing the full prompt:

- `{{COMPONENT_NAME}}` - The component being implemented (e.g., "MessagesArea")
- `{{COMPONENT_PATH}}` - Path to the placeholder in /final (e.g., "working-queue-page/messages-area.tsx")
- `{{PROTOTYPE_PATH}}` - Path to prototype with solution code (provided by user)
- `{{SLUG_NAME}}` - Slugified name for created-apps folder (e.g., "messages-area-with-streaming")
- `{{CREATED_APPS_DIR}}` - Usually `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps`

---

## Full Prompt Template

```
# Research Task: {{COMPONENT_NAME}}

## Phase 1: Context Loading

Read these files to understand the system:
1. `apps/web/src/app/final/SPECIFICATION.md` - UI specification
2. `apps/web/src/app/MANUAL/AGENT-WORKING-QUEUE.md` - Database records and seed scripts
3. `packages/db/src/schema/index.ts` - Data models (NOT archive tables)

## Phase 2: Prototype Research

Study the prototype at: `{{PROTOTYPE_PATH}}`

Your goal is to understand:
1. How this feature is currently implemented
2. What files are involved (components, API routes, types, utils)
3. What data flows in and out
4. What dependencies it has
5. How it connects to the database

Create a research report covering:
- **Files to copy/adapt**: List every file relevant to this feature
- **API routes needed**: What endpoints exist or need to be created
- **Data model usage**: Which tables/columns are used
- **Dependencies**: npm packages, internal imports
- **Integration points**: How it connects to other components

## Phase 3: Interview

Interview the user to clarify:

### Data Model Questions
- What exact fields from the database does this component need?
- Are there any computed/derived fields?
- What's the expected data shape for props?

### UI Behavior Questions
- What are the loading states?
- What are the error states?
- What happens on empty data?
- Are there any animations/transitions?

### Integration Questions
- How does this component receive data? (props, API call, real-time?)
- Does it need to update any parent state?
- Are there any side effects (other API calls, state updates)?

### Edge Cases
- What happens with large datasets?
- Are there pagination/virtualization needs?
- Mobile/responsive considerations?

## Phase 4: Code Example Creation

After research and interview, create a minimal code example.

### Working Directories
- Code: `{{CREATED_APPS_DIR}}/{{SLUG_NAME}}/`
- Seed: `apps/web/src/app/MANUAL/seed/{{SLUG_NAME}}/`

### Requirements
1. **Standalone**: Must run independently as a Next.js app
2. **Minimal**: Only include what's needed for this feature
3. **Mock data**: Replace API calls with fixtures where appropriate
4. **Copy-paste friendly**: Avoid cross-cutting abstractions

### Output Structure
```
{{SLUG_NAME}}/
├── package.json
├── next.config.js (if needed)
├── src/
│   ├── app/
│   │   ├── page.tsx (demo page)
│   │   └── api/ (if API routes needed)
│   ├── components/
│   │   └── {{component-files}}
│   └── lib/ (utils, types)
└── README.md (brief usage notes)
```

### Seed Script

Create `apps/web/src/app/MANUAL/seed/{{SLUG_NAME}}/seed.ts` that:
1. Can run standalone with `npx tsx seed.ts`
2. Inserts appropriate `source` record
3. Inserts `requirement` with the extraction spec
4. Inserts `job` with status "completed" and full payload
5. Inserts `codeExample` pointing to the created folder

Use naming convention: `extract-the-{{slugified-name}}`

## Phase 5: Implementation Guide

Document how a coding agent should integrate this into /final:

1. **Files to create/modify** in `apps/web/src/app/final/`
2. **API routes to add** (if any)
3. **Props interface changes**
4. **State management updates** (what state to add to parent)
5. **Import changes**

### Integration Checklist
- [ ] Component file updated
- [ ] Types defined
- [ ] API route created (if needed)
- [ ] Parent component updated to pass data
- [ ] Error handling added
- [ ] Loading states added
```

---

## Interview Best Practices

### DO:
- Ask specific, concrete questions
- Confirm assumptions before proceeding
- Ask about edge cases
- Understand the "why" behind behaviors
- Map features to specific prototype files

### DON'T:
- Make assumptions about data shapes
- Skip asking about error states
- Ignore mobile/responsive needs
- Forget about loading states
- Assume API routes exist

---

## Output Expectations

The research agent should produce:

1. **Research Report** (markdown)
   - Prototype file analysis
   - Data flow diagram (text-based)
   - Dependency list
   - Integration points

2. **Interview Summary** (markdown)
   - Questions asked
   - Answers received
   - Decisions made

3. **Code Example** (working Next.js app)
   - In created-apps folder
   - With seed script
   - With README

4. **Implementation Guide** (markdown)
   - Step-by-step integration instructions
   - Files to modify
   - Code snippets for key changes
