---
date: 2026-02-01T12:00:47Z
researcher: Claude
git_commit: 51377ba21d0d2d411e9339605a8a08549af82159
branch: main
repository: CodeExtract
topic: "Himanshu folder architecture, pm2-app-mgmt, screenshot/website features, and component gallery"
tags: [research, codebase, himanshu, pm2-app-mgmt, thing-crud, gallery, visual-extraction]
status: complete
last_updated: 2026-02-01
last_updated_by: Claude
---

# Research: Himanshu Folder Architecture & Related Systems

**Date**: 2026-02-01T12:00:47Z
**Researcher**: Claude
**Git Commit**: 51377ba21d0d2d411e9339605a8a08549af82159
**Branch**: main
**Repository**: CodeExtract

## Research Question
Research the codebase specifically the himanshu folder and related pages, focusing on:
1. How generated apps in `created-apps` are created and how ports are spun up via pm2-app-mgmt
2. How the screenshot and website features work, including git clone and Claude executions when jobs get processed
3. How the component gallery displays code_example records (should pull from APPROVED prototypes)
4. Flag separation of concerns violations

## Summary

The codebase contains multiple interrelated systems for component extraction and preview:

1. **Himanshu Page** (`apps/web/src/app/himanshu/`) - Main user-facing extraction interface supporting GitHub repos, screenshots, and live URLs
2. **PM2 App Management** (`apps/web/src/app/partner/backwards/prototypes/pm2-app-mgmt/`) - Process orchestrator for Next.js dev servers with JSON manifest storage
3. **Thing-CRUD** (`apps/web/src/app/partner/backwards/prototypes/thing-crud/`) - Code examples CRUD with database storage (extends pm2-app-mgmt pattern for code examples linked to requirements)
4. **Fetch-Model-And-Req** (`apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/`) - Job queue system for Claude extraction with prompt templates
5. **Component Gallery** (`apps/web/src/app/partner/gallery/`) - Component browser that reads from fetch-model-and-req's created-apps directory (NOT from thing-crud's approved code_examples)

---

## Detailed Findings

### 1. How Generated Apps Are Created & Ports Spun Up (PM2-App-Mgmt)

**Location**: `apps/web/src/app/partner/backwards/prototypes/pm2-app-mgmt/`

#### Architecture Overview

The pm2-app-mgmt prototype uses a **JSON manifest file** as its data store rather than a database:

**Manifest File**: `pm2-app-mgmt/manifest.json`
```json
{
  "version": "1.0.0",
  "portRange": [3100, 3199],
  "apps": {
    "39e1333e": {
      "id": "39e1333e",
      "name": "hello",
      "directory": "./created-apps/39e1333e",
      "port": 3100,
      "pmId": 0,
      "pid": 86635,
      "status": "online",
      ...
    }
  }
}
```

#### File Structure
- `page.tsx` - React dashboard UI with polling every 3 seconds
- `actions.ts` - Server actions (thin wrappers around orchestrator)
- `orchestrator.ts` - Core logic for pm2 management
- `types.ts` - TypeScript interfaces
- `manifest.json` - JSON data store for apps
- `created-apps/` - Directory where scaffolded Next.js apps live
- `logs/` - PM2 log files (stdout/stderr)

#### App Creation Flow (`orchestrator.ts:284-362`)

1. **Generate IDs**: `generateId()` creates 8-char UUID prefix, `generateName()` creates random name
2. **Port Allocation** (`allocatePort()`): Iterates port range [3100, 3199], finds first unused
3. **Scaffold Next.js App**:
   ```bash
   npx create-next-app@latest "${absoluteDir}" --yes --use-npm --ts --tailwind --eslint --app --src-dir --no-import-alias
   ```
4. **Write to Manifest**: Add app entry to `manifest.json`
5. **Start with PM2**:
   ```bash
   npx pm2 start npm --name orch-${id} --namespace app-orchestrator --cwd ${dir} -- run dev
   ```
   Environment: `PORT=<allocated_port>`
6. **Sync State**: Call `sync()` to reconcile manifest with pm2's actual runtime state

#### PM2 Integration

The orchestrator uses **pm2 CLI commands** (not programmatic API) via `child_process.exec`:

- `pm2List()`: Uses `npx pm2 jlist` to get JSON process list, filters by namespace `app-orchestrator`
- `pm2Start()`: Builds command string with all flags
- `pm2Stop(pmId)`, `pm2Restart(pmId)`, `pm2Delete(pmId)`: Simple CLI calls

**Key Pattern**: The `sync()` function bridges pm2 runtime state to manifest state by matching on `port`:
- Reads manifest
- Gets pm2 process list filtered by namespace
- For each app in manifest, finds matching pm2 process by port
- Updates runtime fields (pmId, pid, status, memoryMB, cpuPercent, startedAt, restarts)
- Writes manifest back

#### Data Model (`types.ts`)

```typescript
interface AppInfo {
  // Static (set at creation)
  id: string;
  name: string;
  category: string | null;
  directory: string;
  port: number;
  createdAt: string;

  // Runtime (written by sync)
  pmId: number | null;
  pid: number;
  status: "online" | "stopped" | "errored" | "launching" | "unknown";
  memoryMB: number;
  cpuPercent: number;
  startedAt: number | null;
  restarts: number;
}
```

---

### 2. Screenshot & Website Feature Flow

**Location**: Multiple files across the codebase

#### Input Flow (Himanshu Page)

The himanshu page (`apps/web/src/app/himanshu/page.tsx`) supports three input modes:
- `"github"` - GitHub repository URL
- `"screenshot"` - Direct image upload (supports multiple)
- `"live_url"` - Website URL (with optional screenshots)

#### Screenshot/Live URL Analysis Pipeline

**Step 1: User Input** (`page.tsx:375-509`)
- Multiple images stored in `screenshotPreviews: string[]` (base64)
- Live URL stored in `liveUrl: string`
- Calls `POST /api/analyze-visual`

**Step 2: Visual Analysis API** (`apps/web/src/app/api/analyze-visual/route.ts`)

1. Receives: `{ imageBase64, url, inputType, sourceId, allImages }`
2. For live_url mode: Attempts to fetch HTML from URL for context
3. Calls `analyzeImage(base64Image)` - uses **Gemini Vision** to extract:
   - componentType, description
   - layout, colors, typography, spacing
   - borders, shadows, interactions, animations
   - responsive behavior, accessibility, assets
   - inferredTechStack
4. Calls `generateVisualAnalysisMarkdownLLM()` - generates detailed ANALYSIS.md using Gemini
5. Writes ANALYSIS.md to disk: `analysis-output/${sourceId}/ANALYSIS.md`
6. Creates/updates `sources` record in database with:
   - `inputType`, `visualData`, `visionAnalysis`
   - `analysisStatus: "analyzed"`
   - `analysisMarkdown` (full content)

**Vision Analyzer** (`apps/web/src/lib/ai/vision-analyzer.ts`):
- Uses `google("gemini-2.0-flash")` model
- `analyzeImage()`: Structured object extraction via `generateObject()`
- `generateVisualAnalysisMarkdownLLM()`: Full markdown generation via `generateText()`

#### GitHub Analysis Pipeline

**Step 1: User submits GitHub URL** (`page.tsx:300-372`)
- Calls `getOrCreateSource(githubUrl)` - creates `sources` DB record
- Calls `POST /api/analyze-stream` for streaming analysis

**Step 2: Streaming Analysis API** (`apps/web/src/app/api/analyze-stream/route.ts`)

1. Parses URL: `GitHubService.parseUrl(url)` extracts owner/repo/branch
2. Fetches repo tree: `GitHubService.getRepoTree()` - uses GitHub API recursive tree
3. Filters relevant files: configs, docs, components (TSX/JSX/Vue/Svelte, max 50)
4. Fetches file contents via **jsDelivr CDN** (fast) or GitHub API (fallback)
5. AI Analysis (parallel):
   - `generateText()` with detailed prompt for ANALYSIS.md
   - `generateObject()` for structured metadata (techStack, dependencies, components)
6. Writes ANALYSIS.md to disk
7. Updates `sources` DB record

**Git Cloner** (`apps/web/src/lib/git/cloner.ts`):
- Uses `simple-git` library
- Clones to `.sources/${sourceId}/${repoName}`
- Updates `sources.localPath` and `analysisStatus`
- Note: This appears to be an alternative/older path - the streaming API doesn't use it directly

#### Job Processing (Claude Extractions)

**Location**: `apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/`

The job queue system processes extraction requests:

1. **Queue Job** (`actions.ts:139-208`):
   - Gets requirement from DB
   - Reads prompt template from `prompt-template.md`
   - Replaces `{{VARIABLE_REQUIREMENT}}` and `{{VARIABLE_CONTEXT}}`
   - Calls `enqueue()` with `ClaudeExtractionPayload`

2. **Job Processing** (implied by types):
   - Jobs have status: pending → claimed → completed/failed
   - Uses idempotency keys: `extraction-${requirement.id}`
   - Progress tracked in `job-progress/{jobId}.json`
   - Logs stored separately

3. **Created Apps**: Live in `fetch-model-and-req/created-apps/` with directories named by slugified requirement text

---

### 3. Component Gallery Implementation

**Location**: `apps/web/src/app/partner/gallery/`

#### Current Gallery Behavior

**Gallery List Page** (`gallery/page.tsx`):
- Fetches from `GET /api/components/list`
- Displays cards with name, description, createdAt

**Component Viewer** (`gallery/[componentId]/page.tsx`):
- Calls `POST /api/components/preview` with `{ componentId, action: 'start' }`
- Renders iframe pointing to `http://localhost:${port}/extracted`

#### API Implementation

**List API** (`apps/web/src/app/api/components/list/route.ts:1-72`):

**CRITICAL FINDING**: The gallery reads from **fetch-model-and-req's created-apps**:
```typescript
const createdAppsPath = path.join(
  process.cwd(),
  'src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps'
);
```

It does NOT:
- Query the database for `code_examples` records
- Filter by `reviewStatus === "approved"`
- Use thing-crud's created-apps directory

**What it does**:
1. Reads directories from fetch-model-and-req/created-apps
2. Looks for `extraction-result.json` for metadata
3. Looks for `SUMMARY.md` for description
4. Checks if `src/app/extracted/page.tsx` exists
5. Returns all components (no approval filtering)

**Preview API** (`apps/web/src/app/api/components/preview/route.ts`):
- Maintains in-memory map of running servers
- Uses ports starting at 4000
- Runs `bun install` then `bun run dev --port ${port}`
- Also reads from fetch-model-and-req/created-apps

---

### 4. Thing-CRUD System (Code Examples with Review Status)

**Location**: `apps/web/src/app/partner/backwards/prototypes/thing-crud/`

This is a **separate system** from the gallery that DOES have approval status:

#### Database Schema (`packages/db/src/schema/index.ts:232-258`)

```typescript
export const codeExamples = sqliteTable("code_examples", {
  id: text("id").primaryKey(),
  requirementId: text("requirement_id").notNull().references(() => requirements.id),
  path: text("path").notNull(),
  port: integer("port").notNull(),
  reviewStatus: text("review_status", {
    enum: ["pending", "approved", "rejected"],
  }).notNull().default("pending"),
  rejectionReason: text("rejection_reason", {
    enum: ["does_not_run", "incorrect", "not_minimal", "other"],
  }),
  rejectionNotes: text("rejection_notes"),
  createdAt: text("created_at"),
});
```

#### Thing-CRUD Orchestrator Flow (`orchestrator.ts`)

1. **createCodeExample()**: Similar to pm2-app-mgmt but:
   - Requires `requirementId` (validates exists in DB)
   - Uses port range [3200, 3299] (different from pm2-app-mgmt's 3100-3199)
   - Stores in SQLite database (not manifest.json)
   - pm2 namespace: `code-examples`

2. **enrichWithRuntime()**: Like pm2-app-mgmt's sync(), bridges DB records with pm2 state

3. **updateReviewStatus()**: Sets reviewStatus, rejectionReason, rejectionNotes

4. **Dashboard** (`page.tsx`): Groups by reviewStatus (pending/approved/rejected)

---

## Separation of Concerns Violations & Issues

### VIOLATION 1: Multiple Created-Apps Directories (Fragmented Data)

| System | created-apps Location | Data Store | Port Range |
|--------|----------------------|------------|------------|
| pm2-app-mgmt | `pm2-app-mgmt/created-apps/` | manifest.json | 3100-3199 |
| thing-crud | `thing-crud/created-apps/` | SQLite (code_examples) | 3200-3299 |
| fetch-model-and-req | `fetch-model-and-req/created-apps/` | Jobs queue | N/A (uses preview API) |
| Gallery Preview | Reads from fetch-model-and-req | In-memory map | 4000+ |

**Problem**: Four separate locations for "created apps", each with different storage mechanisms.

### VIOLATION 2: Gallery Ignores code_examples Table

The gallery API (`/api/components/list`) directly reads from filesystem:
```typescript
// In route.ts - HARDCODED to fetch-model-and-req
const createdAppsPath = path.join(
  process.cwd(),
  'src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps'
);
```

**Expected Behavior** (per user's description):
- Should query `code_examples` table
- Should filter by `reviewStatus === "approved"`
- Should copy `/extracted` folder to gallery subfolder

**Actual Behavior**:
- Reads all directories from fetch-model-and-req/created-apps
- No approval filtering
- No database integration

### VIOLATION 3: PM2 Management Duplicated

Both `pm2-app-mgmt/orchestrator.ts` and `thing-crud/orchestrator.ts` contain nearly identical pm2 wrapper functions:
- `pm2Command()`, `pm2List()`, `pm2Start()`, `pm2Stop()`, `pm2Restart()`, `pm2Delete()`
- `mapPm2Status()`
- `ensureDirectories()`
- `generateId()`, `generateName()`

**No shared utility** - code is copy-pasted between prototypes.

### VIOLATION 4: Process Management State Split

- **pm2-app-mgmt**: Uses `manifest.json` for app records, syncs with pm2
- **thing-crud**: Uses SQLite `code_examples` table, syncs with pm2
- Both sync pm2 state by **port number matching**
- Neither is aware of the other's port range

**Risk**: If both systems run on same machine, they could accidentally try to manage each other's processes if ranges overlapped.

### VIOLATION 5: Gallery Preview Uses Different Port Range

The preview API (`/api/components/preview`) uses:
```typescript
const BASE_PORT = 4000;
const port = BASE_PORT + runningServers.size;
```

This is completely separate from:
- pm2-app-mgmt: 3100-3199
- thing-crud: 3200-3299

**No coordination** between these systems.

### VIOLATION 6: Inconsistent Data Models

| Field | pm2-app-mgmt | thing-crud | fetch-model-and-req |
|-------|--------------|------------|---------------------|
| Review Status | `reviewStatus` in manifest.json (optional) | `reviewStatus` in DB | None |
| Creation Linked To | Nothing | `requirementId` | `requirementId` via jobs |
| Directory Name | UUID prefix (8 chars) | UUID prefix (8 chars) | Slugified requirement text |

### VIOLATION 7: Visual Analysis Disconnected from Code Generation

The visual analysis flow:
1. Screenshot → Gemini Vision → ANALYSIS.md → `sources` table

But code generation uses:
1. `requirements` table → job queue → Claude → fetch-model-and-req/created-apps

**No direct connection** between visual analysis and code example generation. The `visionAnalysis` data in the sources table isn't used by the job queue.

---

## Code References

### Key Files

| File | Line | Description |
|------|------|-------------|
| `apps/web/src/app/himanshu/page.tsx` | 1-1208 | Main extraction UI |
| `apps/web/src/app/himanshu/actions.ts` | 1-194 | Server actions for source/requirement CRUD |
| `apps/web/src/app/partner/backwards/prototypes/pm2-app-mgmt/orchestrator.ts` | 1-535 | PM2 process orchestrator |
| `apps/web/src/app/partner/backwards/prototypes/pm2-app-mgmt/manifest.json` | 1-55 | JSON data store for apps |
| `apps/web/src/app/partner/backwards/prototypes/thing-crud/orchestrator.ts` | 1-524 | Code examples orchestrator |
| `apps/web/src/app/partner/gallery/page.tsx` | 1-216 | Gallery list page |
| `apps/web/src/app/api/components/list/route.ts` | 1-72 | Gallery list API (reads from fetch-model-and-req) |
| `apps/web/src/app/api/components/preview/route.ts` | 1-168 | Component preview server manager |
| `apps/web/src/app/api/analyze-visual/route.ts` | 1-210 | Visual analysis API |
| `apps/web/src/app/api/analyze-stream/route.ts` | 1-410 | Streaming GitHub analysis |
| `apps/web/src/lib/ai/vision-analyzer.ts` | 1-535 | Gemini vision analysis |
| `apps/web/src/lib/github/service.ts` | 1-129 | GitHub API service |
| `apps/web/src/lib/git/cloner.ts` | 1-55 | Simple-git cloner |
| `packages/db/src/schema/index.ts` | 232-262 | code_examples table schema |

---

## Architecture Documentation

### Current Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INPUT                                   │
├─────────────────────┬─────────────────────┬─────────────────────────┤
│    GitHub URL       │    Screenshot       │      Live URL           │
└─────────┬───────────┴─────────┬───────────┴───────────┬─────────────┘
          │                     │                       │
          ▼                     ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      HIMANSHU PAGE                                   │
│   apps/web/src/app/himanshu/page.tsx                                │
└─────────┬───────────────────────────────────────────────────────────┘
          │
          ├──────────────────────────────────────────────────────────┐
          │                                                          │
          ▼                                                          ▼
┌─────────────────────────┐                              ┌───────────────────────┐
│  /api/analyze-stream    │                              │  /api/analyze-visual  │
│  (GitHub repos)         │                              │  (Screenshots/URLs)   │
└─────────┬───────────────┘                              └───────────┬───────────┘
          │                                                          │
          │ Uses: GitHubService, Gemini                              │ Uses: Gemini Vision
          │                                                          │
          ▼                                                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    sources TABLE (SQLite)                           │
│   - analysisMarkdown, visionAnalysis, visualData                    │
└─────────────────────────────────────────────────────────────────────┘
          │
          │ Interview → Save requirement
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  requirements TABLE (SQLite)                        │
└─────────┬───────────────────────────────────────────────────────────┘
          │
          │ Two separate paths:
          │
          ├────────────────────────────────────────────────────────────┐
          │                                                            │
          ▼                                                            ▼
┌─────────────────────────────┐                    ┌───────────────────────────────┐
│  fetch-model-and-req        │                    │       thing-crud              │
│  (Job Queue System)         │                    │   (Code Examples CRUD)        │
├─────────────────────────────┤                    ├───────────────────────────────┤
│ - Prompt template injection │                    │ - DB: code_examples table     │
│ - Claude execution          │                    │ - PM2 namespace: code-examples│
│ - created-apps/ (slugified) │                    │ - Port range: 3200-3299       │
│ - NO approval status        │                    │ - HAS reviewStatus column     │
└─────────┬───────────────────┘                    └─────────┬─────────────────────┘
          │                                                  │
          │ ← Gallery reads from here                        │ ← NOT used by gallery
          ▼                                                  ▼
┌─────────────────────────────┐                    ┌───────────────────────────────┐
│  /partner/gallery           │                    │  /partner/backwards/prototypes│
│  - Reads fetch-model-and-req│                    │  /thing-crud (Dashboard)      │
│  - Preview port: 4000+      │                    │                               │
│  - NO approval filtering    │                    │                               │
└─────────────────────────────┘                    └───────────────────────────────┘
```

### PM2 Namespaces & Port Ranges

| System | PM2 Namespace | Port Range | Data Store |
|--------|---------------|------------|------------|
| pm2-app-mgmt | `app-orchestrator` | 3100-3199 | manifest.json |
| thing-crud | `code-examples` | 3200-3299 | SQLite `code_examples` |
| Gallery Preview | (none - uses child_process) | 4000+ | In-memory Map |

---

## Related Research

None found in thoughts/shared/research/

---

## Open Questions

1. **Why are there three separate created-apps directories?** Were they meant to be consolidated?

2. **What is the intended relationship between thing-crud and fetch-model-and-req?**
   - Both reference `requirements` table
   - thing-crud has approval workflow
   - fetch-model-and-req has job queue
   - Are they competing implementations or meant to work together?

3. **Should the gallery use code_examples table with approval filtering?**
   - Per user's description, yes
   - Current implementation: NO

4. **What triggers job processing in fetch-model-and-req?**
   - `queueExtractionJob()` adds to queue
   - Worker processing mechanism not clearly documented
   - `run-worker.ts` and `worker-main.ts` exist but weren't fully analyzed

5. **Is there a planned consolidation of process management?**
   - Duplicated pm2 code suggests no shared library exists
   - Port ranges are non-overlapping (intentional?)
