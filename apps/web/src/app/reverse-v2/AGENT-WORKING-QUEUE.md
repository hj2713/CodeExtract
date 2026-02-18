# Agent Skill: Working with the Queue System

This document teaches Claude how to work with the CodeExtract queue system. When you manually build a code example, you must also create the database records that would exist if the system had created it through normal operation.

---

## 1. The Big Picture: What Is This System For?

CodeExtract is a **component extraction gallery**. Users:

1. **Find a source** (GitHub repo, screenshot, or live URL)
2. **Describe what they want** (a "requirement" — e.g., "Extract the floating action bar")
3. **Queue an extraction job** that runs Claude to build a standalone, runnable version
4. **Review the result** as a code example in the gallery

When YOU manually build a code example (instead of letting the queue process it), you're essentially doing what the worker would do. **You must also create the database records** so the gallery UI can display and track your work.

### Why This Matters

Without the records:
- The code example won't appear in the gallery
- There's no audit trail of what was extracted
- The requirement/job history is incomplete
- Ports can't be properly allocated

---

## 2. The Four Tables and Their Purpose

```
┌─────────────────────────────────────────────────────────────────────┐
│ sources                                                             │
│ "Where did the code come from?"                                     │
│ - GitHub repos, local directories, screenshots, live URLs           │
└─────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ requirements                                                        │
│ "What specific thing should be extracted?"                          │
│ - The detailed spec written by user or AI interview                 │
│ - Links to source AND job                                           │
└─────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ jobs                                                                │
│ "What work was done to fulfill the requirement?"                    │
│ - Queue entry that gets claimed by workers                          │
│ - Contains the full prompt sent to Claude                           │
└─────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ codeExamples                                                        │
│ "What was produced?"                                                │
│ - Points to the created-apps folder                                 │
│ - Has allocated port for preview server                             │
│ - Review status for gallery display                                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. What Goes In Each Text Column

### sources

| Column | What It Contains | Example |
|--------|-----------------|---------|
| `name` | Short identifier, usually repo name or component name | `"chatbot-ui"`, `"vercel-dashboard"` |
| `type` | One of: `"github_repo"`, `"local_directory"`, `"ai_prototype"` | `"github_repo"` |
| `originUrl` | Full GitHub clone URL | `"https://github.com/mckaywrigley/chatbot-ui"` |
| `description` | 1-2 sentences describing the source codebase | `"A ChatGPT-style chat interface built with Next.js and Tailwind"` |
| `localPath` | Where it was cloned (usually null for manual work) | `null` or `"/tmp/repos/chatbot-ui"` |
| `inputType` | How user provided it: `"github"`, `"screenshot"`, `"live_url"` | `"github"` |

### requirements

| Column | What It Contains | Example |
|--------|-----------------|---------|
| `requirement` | **THE DETAILED EXTRACTION SPEC** — Multiple sentences describing exactly what component/feature to extract, what it should do, what to include/exclude | `"Extract the floating action bar from the folder title area. It should include the share button, settings menu, and collapse toggle. The bar should float fixed at the top when scrolling. Include hover states and dropdown menus. Mock any API calls with static data."` |
| `context` | Additional background info — tech stack notes, gotchas, things to watch out for | `"Uses Radix UI for dropdowns. The settings menu has a sub-menu that needs to work. Icons are from lucide-react."` |
| `title` | Short display title (shown in UI lists) | `"Floating Action Bar"` |
| `status` | Current state: `"draft"` → `"saved"` → `"extracting"` → `"completed"` | `"completed"` |

### jobs

| Column | What It Contains | Example |
|--------|-----------------|---------|
| `type` | Always `"claude_extraction"` for extraction work | `"claude_extraction"` |
| `payload` | **JSON string** containing the full ClaudeExtractionPayload (see below) | See payload section |
| `status` | Queue state: `"pending"` → `"claimed"` → `"completed"` / `"failed"` | `"completed"` |
| `idempotencyKey` | Prevents duplicate jobs: `"extraction-{requirementId}"` | `"extraction-abc-123-def"` |
| `lastError` | If failed, the error message | `"Error: Repository requires authentication"` |

### codeExamples

| Column | What It Contains | Example |
|--------|-----------------|---------|
| `path` | Relative path to the created-apps folder | `"created-apps/extract-the-floating-action-bar"` |
| `port` | Unique port number for dev server (4001-4999 range) | `4001` |
| `reviewStatus` | Gallery display state: `"pending"`, `"approved"`, `"rejected"` | `"approved"` |

---

## 4. The Job Payload: What Prompt Was Sent to Claude?

The `payload` column in `jobs` is a JSON string containing everything needed to reproduce the extraction:

```typescript
type ClaudeExtractionPayload = {
  type: "claude_extraction";

  // Slugified name for the output folder (max 50 chars)
  // Format: "extract-the-{component-name}"
  name: string;

  // THE FULL PROMPT sent to Claude
  // This is the requirement + context combined with the prompt template
  prompt: string;

  // Where to output (usually null, worker decides)
  targetPath: string | null;

  // GitHub URL for cloning (can be null for non-GitHub sources)
  originUrl: string | null;

  // Back-reference to requirement
  requirementId: string | null;

  // Hash of prompt for deduplication
  promptHash: string;
};
```

### What Goes in the `prompt` Field?

The prompt is what would be sent to Claude to do the extraction. It should include:

1. **The requirement** (what to extract)
2. **The context** (additional notes)
3. **Instructions** for how to build it standalone

Example prompt content:
```
Extract the floating action bar from the folder title area of the Vercel dashboard.

REQUIREMENT:
Extract the floating action bar from the folder title area. It should include the share button, settings menu, and collapse toggle. The bar should float fixed at the top when scrolling. Include hover states and dropdown menus. Mock any API calls with static data.

CONTEXT:
Uses Radix UI for dropdowns. The settings menu has a sub-menu that needs to work. Icons are from lucide-react.

Build this as a standalone Next.js app that runs independently. Replace any API calls with mock/fixture data. Include all necessary components and styles.
```

---

## 5. Status Combinations: What State Should Everything Be In?

When you **manually complete** an extraction, use these statuses:

| What Happened | requirement.status | job.status | codeExample.reviewStatus |
|--------------|-------------------|------------|-------------------------|
| You built it successfully | `"completed"` | `"completed"` | `"pending"` or `"approved"` |
| Built but needs review | `"completed"` | `"completed"` | `"pending"` |
| Built and verified working | `"completed"` | `"completed"` | `"approved"` |

---

## 6. Complete Example: Seed Script for Manual Build

After you create code in `created-apps/extract-the-floating-action-bar/`, create a standalone seed script:

**Path**: `apps/web/src/app/MANUAL/seed/extract-the-floating-action-bar/seed.ts`

```typescript
/**
 * Seed script for: extract-the-floating-action-bar
 * Run with: npx tsx seed.ts
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { randomUUID } from "crypto";
import { sources, requirements, jobs, codeExamples } from "@my-better-t-app/db/schema";

// Connect to the database (adjust path as needed)
const client = createClient({
  url: "file:../../../../../../packages/db/local.db",
});

const db = drizzle({ client });

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

async function seed() {
  console.log("🌱 Seeding: extract-the-floating-action-bar");

  const now = new Date().toISOString();

  // Generate all IDs upfront
  const sourceId = randomUUID();
  const requirementId = randomUUID();
  const jobId = randomUUID();
  const codeExampleId = randomUUID();

  // 1. SOURCE - Where did the code come from?
  await db.insert(sources).values({
    id: sourceId,
    name: "vercel-dashboard",
    type: "github_repo",
    originUrl: "https://github.com/vercel/vercel",
    description: "Vercel's dashboard UI components including file browser and action bars",
    inputType: "github",
  });

  // 2. REQUIREMENT - What was the extraction spec?
  await db.insert(requirements).values({
    id: requirementId,
    sourceId: sourceId,
    jobId: jobId,
    title: "Floating Action Bar",
    requirement: "Extract the floating action bar from the folder title area. It should include the share button, settings menu, and collapse toggle. The bar should float fixed at the top when scrolling. Include hover states and dropdown menus. Mock any API calls with static data.",
    context: "Uses Radix UI for dropdowns. The settings menu has a sub-menu that needs to work. Icons are from lucide-react.",
    status: "completed",
  });

  // 3. JOB - What work was done?
  const prompt = `Extract the floating action bar from the folder title area of the Vercel dashboard.

REQUIREMENT:
Extract the floating action bar from the folder title area. It should include the share button, settings menu, and collapse toggle. The bar should float fixed at the top when scrolling. Include hover states and dropdown menus. Mock any API calls with static data.

CONTEXT:
Uses Radix UI for dropdowns. The settings menu has a sub-menu that needs to work. Icons are from lucide-react.

Build this as a standalone Next.js app that runs independently. Replace any API calls with mock/fixture data.`;

  await db.insert(jobs).values({
    id: jobId,
    type: "claude_extraction",
    payload: JSON.stringify({
      type: "claude_extraction",
      name: "extract-the-floating-action-bar",
      prompt: prompt,
      targetPath: null,
      originUrl: "https://github.com/vercel/vercel",
      requirementId: requirementId,
      promptHash: hashString(prompt),
    }),
    status: "completed",
    priority: 0,
    attempts: 1,
    maxAttempts: 3,
    createdAt: now,
    claimedAt: now,
    completedAt: now,
    idempotencyKey: `extraction-${requirementId}`,
  });

  // 4. CODE EXAMPLE - What was produced?
  await db.insert(codeExamples).values({
    id: codeExampleId,
    requirementId: requirementId,
    path: "created-apps/extract-the-floating-action-bar",
    port: 4002,  // Pick next available port
    reviewStatus: "approved",
  });

  console.log("✅ Seeding complete!");
  console.log(`   Source ID: ${sourceId}`);
  console.log(`   Requirement ID: ${requirementId}`);
  console.log(`   Job ID: ${jobId}`);
  console.log(`   Code Example ID: ${codeExampleId}`);

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
```

### Running the Seed Script

```bash
cd apps/web/src/app/MANUAL/seed/extract-the-floating-action-bar
npx tsx seed.ts
```

---

## 7. Naming Conventions

| Thing | Format | Example |
|-------|--------|---------|
| Folder name | `extract-the-{slugified-description}` | `extract-the-floating-action-bar` |
| Job name (in payload) | Same as folder name, max 50 chars | `extract-the-floating-action-bar` |
| Idempotency key | `extraction-{requirementId}` | `extraction-abc-123-def` |
| Port numbers | Sequential starting from 4001 | `4001`, `4002`, `4003` |

---

## 8. Seed Script Location

Create a standalone seed script for each extraction:

**Path pattern**: `apps/web/src/app/MANUAL/seed/{slug-name}/seed.ts`

Each script is self-contained and can be run independently after the code is built.

---

## Files Referenced

- `packages/db/src/schema/index.ts` - Table schemas
- `packages/db/src/seed.ts` - Seed script to modify
- `apps/web/src/app/partner/backwards/prototypes/jobs-queue/queue/types.ts` - Payload types
- `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/actions.ts` - How jobs get queued normally
