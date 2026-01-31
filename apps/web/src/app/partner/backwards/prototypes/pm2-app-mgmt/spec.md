# Next.js App Orchestrator — Requirements Document

**Version 1.0 · January 31, 2026 · DRAFT**

---

## 0. Project Root

All paths in this document are relative to the `pm2-app-mgmt` directory:

```
apps/web/src/app/partner/backwards/prototypes/pm2-app-mgmt/
```

When the spec refers to `./manifest.json`, it means `pm2-app-mgmt/manifest.json`. When it refers to `./created-apps/`, it means `pm2-app-mgmt/created-apps/`.

---

## 1. Overview

This document specifies a local development tool that programmatically scaffolds, runs, and tears down multiple Next.js applications on a single machine. The system manages up to **20 concurrent dev server instances**, each on a unique auto-assigned port.

The architecture separates concerns into two layers:

- **Manifest file** (`manifest.json`) — the single source of truth for all app state. Every client (dashboard, CLI, API) reads **only** from the manifest. The manifest tracks what apps exist, where they live on disk, their assigned ports, and their current runtime status.
- **pm2** — the runtime process manager. It owns the actual child processes. pm2 is never queried directly by clients. Instead, a **sync function** reads pm2's process table and writes runtime data (status, PID, memory, CPU) back into the manifest.

This means the manifest is a **materialized view** of two data sources: the orchestrator's own records (created at scaffolding time) and pm2's live process data (written back by the sync layer).

---

## 2. Architecture

### 2.1 Components

| Component | Responsibility |
|---|---|
| **Dashboard UI** | Reads manifest via server actions. Renders app list, statuses, controls. Never touches pm2. |
| **Server Actions** | Thin pass-through to the orchestrator module. Trigger create/stop/delete and return manifest data. |
| **Orchestrator Module** | Core logic. Manages the manifest file, calls pm2 programmatically, runs port allocation, handles scaffolding and cleanup. |
| **Sync Function** | Called before every manifest read. Connects to pm2, pulls live process data, updates the manifest's runtime fields, disconnects. |
| **pm2 Daemon** | Background process manager. Spawns/kills Next.js dev servers. The orchestrator talks to it via `require('pm2')`. |

### 2.2 Data Flow Invariant

```
Client reads → Server Action → sync() → pm2.list() → update manifest → read manifest → return to client
```

**No client ever reads pm2 directly.** The sync function is the only bridge between pm2 and the manifest. After sync runs, the manifest contains both static data (name, port, directory, category) and live data (status, PID, memory, CPU). Clients just read the manifest.

---

## 3. Manifest Specification

### 3.1 File Location

```
./manifest.json
```

The manifest is a single JSON file located at the project root (`pm2-app-mgmt/manifest.json`). It is read and written **only** by the orchestrator module. Concurrent writes are not a concern (single orchestrator process).

### 3.2 Schema

```jsonc
{
  "version": "1.0.0",
  "portRange": [3100, 3199],
  "apps": {
    "<app-id>": {
      // ── Static fields (written at creation time, never change) ──
      "id": "abc123",
      "name": "client-preview",
      "category": "demos",
      "directory": "./created-apps/abc123",
      "port": 3101,
      "createdAt": "2026-01-31T14:30:00.000Z",

      // ── Runtime fields (written by sync function from pm2) ──
      "pmId": 7,
      "pid": 48210,
      "status": "online",
      "memoryMB": 247,
      "cpuPercent": 3.2,
      "startedAt": 1738334400000,
      "restarts": 0
    }
  }
}
```

### 3.3 Field Reference

#### Static Fields (set at creation, immutable)

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique app identifier. Generated via `crypto.randomUUID()` or `nanoid()`. Also used as the directory name. |
| `name` | `string` | User-facing display name. Auto-generated if not provided. |
| `category` | `string \| null` | Optional grouping label for dashboard filtering. |
| `directory` | `string` | Relative path to the scaffolded Next.js app (e.g., `./created-apps/<app-id>`). |
| `port` | `number` | Allocated port. Assigned at creation and never changes for the lifetime of the app. |
| `createdAt` | `string` | ISO 8601 timestamp of when the app was scaffolded. |

#### Runtime Fields (written by sync function)

| Field | Type | Description |
|---|---|---|
| `pmId` | `number \| null` | pm2's internal process ID. `null` if the app has never been started or pm2 lost track of it. |
| `pid` | `number` | OS process ID. `0` if not running. |
| `status` | `string` | One of: `online`, `stopped`, `errored`, `launching`, `unknown`. See Section 3.4. |
| `memoryMB` | `number` | Current memory usage in MB. `0` if not running. |
| `cpuPercent` | `number` | Current CPU usage percentage. `0` if not running. |
| `startedAt` | `number \| null` | Timestamp (ms) of last process start. `null` if never started. |
| `restarts` | `number` | Number of times pm2 has restarted this process. |

### 3.4 Status State Machine

```
                 ┌──────────┐
    create ──►   │ stopped  │ ◄── stop()
                 └────┬─────┘
                      │ start()
                      ▼
                 ┌──────────┐
                 │launching │
                 └────┬─────┘
                      │ dev server binds to port
                      ▼
                 ┌──────────┐
    restart() ──►│  online  │
                 └────┬─────┘
                      │ crash / port conflict
                      ▼
                 ┌──────────┐
                 │ errored  │
                 └──────────┘

    "unknown" ── pm2 has no record of this app (daemon reset, manual pm2 delete, etc.)
```

When an app is first scaffolded and added to the manifest, its status is `stopped` and all runtime fields are zeroed/null. The status only becomes `online` after `start()` is called and the sync function picks up the running process from pm2.

The `unknown` status is special: it means the app exists in the manifest but pm2 has no corresponding process. This happens after a pm2 daemon reset or if someone manually runs `pm2 delete` outside the orchestrator. The dashboard should surface this and offer to re-start or delete the app.

---

## 4. Sync Function

### 4.1 Purpose

The sync function is the **only code path** that reads from pm2 and writes runtime data into the manifest. It ensures the manifest always reflects pm2's current state before any client reads it.

### 4.2 When It Runs

The sync function runs **before every manifest read** that will be returned to a client. Specifically:

- Before `listApps()` returns data to the dashboard.
- Before `getApp(id)` returns data for a detail view.
- NOT before write operations (create, stop, delete) — those write to the manifest directly after performing the pm2 operation.

For a polling dashboard hitting `listApps()` every 3 seconds, this means sync runs every 3 seconds. This is fine — `pm2.list()` for 20 processes takes sub-millisecond.

### 4.3 Algorithm

```
sync():
  1. Read manifest from disk.
  2. pm2.connect()
  3. pm2.list() → get all processes.
  4. Filter to namespace "app-orchestrator".
  5. Build a lookup map: port → pm2 process data.
  6. For each app in manifest.apps:
     a. Look up the app's port in the pm2 map.
     b. If found:
        - Write pmId, pid, status, memoryMB, cpuPercent, startedAt, restarts
          from the pm2 process into the manifest entry.
     c. If NOT found:
        - Set status to "unknown".
        - Set pid to 0, memoryMB to 0, cpuPercent to 0.
        - Preserve pmId as null.
  7. Write manifest to disk.
  8. pm2.disconnect()
```

### 4.4 Matching Strategy

Apps are matched between manifest and pm2 by **port number**, not by name or pmId. Rationale:

- Port is assigned by the orchestrator at creation time and stored in both the manifest (`port` field) and pm2 (`env.PORT`). It is stable and unique within the orchestrator's namespace.
- pmId can change if a process is deleted and re-created in pm2.
- Name could theoretically collide if a user picks the same name twice (though the orchestrator should prevent this).

The sync function matches `manifestApp.port` against `pm2Process.pm2_env.PORT` (parsed as number).

### 4.5 Conflict Resolution

| Scenario | Resolution |
|---|---|
| App in manifest, found in pm2 | Normal case. Write runtime fields from pm2. |
| App in manifest, NOT in pm2 | Set status to `unknown`. Runtime fields zeroed. |
| App in pm2 (correct namespace), NOT in manifest | **Orphan.** This shouldn't happen in normal operation. Log a warning. Do not add it to the manifest. It can be cleaned up manually with `pm2 delete`. |
| App in pm2 with wrong namespace | Ignored entirely. Not our process. |

---

## 5. Port Allocation

### 5.1 Strategy

The orchestrator owns a configurable port range (default `3100–3199`, giving 100 slots). Port allocation reads from the **manifest**, not from pm2:

```
allocatePort():
  1. Read manifest.
  2. Collect all ports currently assigned (from manifest.apps.*.port).
     This includes stopped and unknown apps — their ports are still reserved.
  3. Iterate through portRange[0]..portRange[1].
  4. Return the first port NOT in the occupied set.
  5. If no port is available, throw an error.
```

Because the manifest tracks apps across their full lifecycle (including stopped and unknown), ports are never double-allocated even if pm2 has lost track of the process.

### 5.2 Port Lifecycle

| Event | Port State |
|---|---|
| App created | Port allocated and reserved in manifest. |
| App running | Port in use by Next.js dev server. |
| App stopped | Port reserved in manifest but not in use on the OS. |
| App status is `unknown` | Port still reserved in manifest. Not freed until explicit delete. |
| App deleted | Port removed from manifest. Available for reallocation. |

### 5.3 Edge Case: Port Stolen by External Process

If an external process binds to a port that the orchestrator has allocated, the Next.js dev server will fail to start. pm2 will report `errored` status, which sync will write into the manifest. The dashboard surfaces the error. The user can delete the app (freeing the port in the manifest) and create a new one (which will get a different port).

The orchestrator does NOT probe whether a port is actually free at the OS level before allocating. It trusts its own manifest. This is a deliberate simplicity tradeoff — the port range is chosen to avoid collisions with common services.

---

## 6. Orchestrator Module API

Each function connects to pm2 internally (when needed), performs its operation, updates the manifest, and disconnects. Clients call these functions through server actions.

### 6.1 `createApp(options)`

**Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `name` | `string?` | Auto-generated | Display name for the app. |
| `category` | `string?` | `null` | Grouping label. |

**Procedure:**

1. Allocate port from manifest (Section 5.1).
2. Generate unique app ID.
3. Run `npx create-next-app@latest <dir> --yes --use-npm`.
4. Write static fields to manifest with `status: "stopped"`, runtime fields zeroed.
5. Call `pm2.start()` with `script: "npm"`, `args: "run dev"`, `cwd: <dir>`, `namespace: "app-orchestrator"`, `env: { PORT: <port>, CATEGORY: <category> }`.
6. Run sync to pick up the new process and write runtime fields.
7. Return the app entry from the manifest.

**If scaffolding fails:** clean up the partial directory, do not write to manifest, return error.
**If pm2.start() fails:** the app is still in the manifest with `status: "stopped"`. Dashboard shows it. User can retry or delete.

### 6.2 `listApps()`

1. Run sync (Section 4.3).
2. Read manifest.
3. Return `manifest.apps` as an array, sorted by `createdAt` descending.

This is the primary dashboard data source. Every call returns fresh runtime data.

### 6.3 `getApp(id)`

1. Run sync.
2. Read manifest.
3. Return `manifest.apps[id]` or `null`.

### 6.4 `stopApp(id)`

1. Read manifest. Get the app's `pmId`.
2. If `pmId` is null or status is `unknown`, return error (nothing to stop).
3. Call `pm2.stop(pmId)`.
4. Run sync (will write `status: "stopped"` into manifest).
5. Return updated app entry.

### 6.5 `restartApp(id)`

1. Read manifest. Get the app's `pmId`.
2. If `pmId` is null or status is `unknown`:
   - Re-start from scratch: call `pm2.start()` with the app's directory and port from the manifest.
3. Else: call `pm2.restart(pmId)`.
4. Run sync.
5. Return updated app entry.

This handles the `unknown` recovery case — if pm2 lost track of the app, `restartApp` re-registers it with pm2 using the port and directory the manifest already has.

### 6.6 `deleteApp(id, options?)`

| Parameter | Type | Default | Description |
|---|---|---|---|
| `id` | `string` | — | The app ID to delete. |
| `cleanup` | `boolean?` | `true` | If true, `rm -rf` the app directory. |

**Procedure:**

1. Read manifest. Get the app entry.
2. If `pmId` is not null, call `pm2.delete(pmId)`. Ignore errors (process may already be gone).
3. If `cleanup` is true, remove the directory from disk.
4. Remove the app from `manifest.apps`.
5. Write manifest.
6. Return success.

**Deletion is driven by the manifest.** Even if pm2 has no record of the app, the manifest entry and directory are still cleaned up. This is the key advantage over using pm2 as source of truth.

### 6.7 `getAppLogs(id)`

**Returns:** `{ stdout: string, stderr: string }` — recent log output.

Read from pm2's log files at `./logs/<name>-out.log` and `./logs/<name>-error.log`. The log directory is configured when starting pm2 processes (see Section 7.2). The log file names are based on the pm2 process name, which the orchestrator controls.

### 6.8 Types

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

interface Manifest {
  version: string;
  portRange: [number, number];
  apps: Record<string, AppInfo>;
}

interface CreateAppOptions {
  name?: string;
  category?: string;
}

interface DeleteAppOptions {
  cleanup?: boolean;
}
```

---

## 7. pm2 Configuration

### 7.1 Namespace

All processes MUST be started with `namespace: "app-orchestrator"`. The sync function filters `pm2.list()` results by this namespace. This isolates the orchestrator from any other pm2 processes on the machine.

### 7.2 pm2.start() Options

| Option | Value | Rationale |
|---|---|---|
| `script` | `"npm"` | Use npm as the runner. |
| `args` | `"run dev"` | Runs `next dev` via package.json. |
| `name` | `"orch-<app-id>"` | Prefixed to avoid name collisions with non-orchestrator pm2 processes. |
| `cwd` | `<app-directory>` | The scaffolded app's root (resolved to absolute path at runtime). |
| `namespace` | `"app-orchestrator"` | Isolation. |
| `env.PORT` | `<allocated-port>` | The port Next.js will bind to. |
| `env.CATEGORY` | `<category>` | Metadata passthrough. |
| `output` | `./logs/<name>-out.log` | Stdout log file (resolved to absolute path). |
| `error` | `./logs/<name>-error.log` | Stderr log file (resolved to absolute path). |
| `autorestart` | `false` | Don't auto-restart crashed servers. Surface errors. |
| `watch` | `false` | Next.js has its own HMR. pm2 watch is redundant and causes double-restarts. |
| `max_restarts` | `0` | Reinforces no auto-restart. |

### 7.3 Connection Pattern

Every orchestrator function that touches pm2 follows this pattern:

```typescript
function withPm2<T>(fn: (pm2: PM2) => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    pm2.connect((err) => {
      if (err) return reject(err);
      fn(pm2)
        .then(resolve)
        .catch(reject)
        .finally(() => pm2.disconnect());
    });
  });
}
```

Connect, do work, always disconnect. Never leave connections open.

---

## 8. App Scaffolding

### 8.1 Workspace Layout

```
pm2-app-mgmt/
  manifest.json
  logs/
    orch-abc123-out.log
    orch-abc123-error.log
    ...
  created-apps/
    abc123/
      package.json
      next.config.js
      app/
      ...
    def456/
      ...
  page.tsx
  actions.ts
  orchestrator.ts
  types.ts
  spec.md
```

### 8.2 Scaffolding Command

```bash
npx create-next-app@latest ./created-apps/<app-id> \
  --yes \
  --use-npm \
  --ts \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --no-import-alias
```

The command is run from the `pm2-app-mgmt` directory. Flags are opinionated defaults and can be made configurable later. The `--yes` flag skips interactive prompts. Scaffolding takes 10–30 seconds depending on network speed and npm cache state.

### 8.3 Cleanup

When `deleteApp(id, { cleanup: true })` is called:

```bash
rm -rf ./created-apps/<app-id>
```

The orchestrator should verify the path starts with `./created-apps/` before deleting, to prevent accidental deletion of unrelated directories.

---

## 9. Dashboard UI Requirements

### 9.1 App List View

The dashboard reads `listApps()` and renders a table or card grid, grouped by category. Each entry shows:

| Field | Display |
|---|---|
| Name | Clickable label. Opens `http://localhost:<port>` in new tab. |
| Port | Port number. |
| Status | Color-coded badge: green (online), yellow (launching), red (errored), gray (stopped), orange (unknown). |
| Uptime | Human-readable duration since `startedAt`. |
| Memory | Formatted as MB. |
| CPU | Percentage. |
| Category | Grouping label. Used for filter/sort. |

### 9.2 Actions Per App

| Action | Behavior |
|---|---|
| **Open** | Navigate to `http://localhost:<port>` in new tab. Only enabled when status is `online`. |
| **Stop** | Calls `stopApp(id)`. |
| **Restart** | Calls `restartApp(id)`. Also recovers apps in `unknown` status. |
| **Delete** | Confirmation dialog → calls `deleteApp(id, { cleanup: true })`. |
| **View Logs** | Opens panel/modal with stdout/stderr from `getAppLogs(id)`. |

### 9.3 Create App

A "Create App" button opens a form with:

- **Name** — text input, optional, auto-generated if blank.
- **Category** — dropdown or text input, optional.

On submit, the UI shows a loading state during the 10–30 second scaffolding phase. On success, the new app appears in the list.

### 9.4 Data Freshness

The dashboard polls `listApps()` every **3 seconds**. Each poll triggers a sync, so runtime data is at most 3 seconds stale. This is acceptable for a local dev tool.

If polling proves insufficient later, the sync layer can be replaced with `pm2.launchBus()` for push-based event streaming, but this is out of scope for v1.

---

## 10. Error Handling

| Failure | Detection | Manifest Impact | User-Facing Response |
|---|---|---|---|
| `create-next-app` fails | Non-zero exit code. | Nothing written. | Error toast. No app appears in list. |
| `pm2.start()` fails | pm2 returns error. | App is in manifest with `status: stopped`. | App appears as stopped. User can retry or delete. |
| Port conflict at runtime | pm2 reports `errored`. Sync writes it. | `status: errored` in manifest. | Red badge. User deletes and retries. |
| pm2 daemon dies/resets | Sync finds no matching pm2 processes. | All apps go to `status: unknown`. | Orange badges. User can restart-all or delete. |
| `rm -rf` fails on delete | Directory removal throws. | App is removed from manifest regardless. | Warning that directory may need manual cleanup. |
| Disk full during scaffolding | `create-next-app` or `npm install` fails. | Nothing written. Partial dir cleaned up. | Error toast. |
| User manually `pm2 delete`s a process | Sync finds no pm2 match. | `status: unknown`. | Orange badge. Restart re-registers with pm2. |

---

## 11. Constraints

- Maximum 20 concurrent instances.
- Single machine, local-only, localhost only.
- Node.js >= 18 and npm pre-installed.
- pm2 installed as a project dependency (`npm install pm2`).
- State does not survive pm2 daemon resets (runtime fields go to `unknown`), but the manifest itself survives everything short of manual deletion.
- Port range default: `3100–3199`. Configurable in manifest.
- Each Next.js dev server uses ~200–400 MB RAM. 20 instances requires 4–8 GB dedicated.

---

## 12. Non-Goals (v1)

- Production deployment.
- Custom templates (vanilla `create-next-app` only).
- Authentication or multi-user.
- Build/export of scaffolded apps.
- Automatic scaling.
- Push-based real-time updates (polling is sufficient).
- Persistent logs beyond pm2's default log rotation.

---

## 13. Future Considerations

- **`pm2.launchBus()`** — replace polling with event-driven sync. pm2 fires events on process start/stop/crash which could trigger manifest writes immediately.
- **Custom templates** — scaffold from a repo URL or local template directory instead of vanilla `create-next-app`.
- **Bulk operations** — stop-all, delete-all, restart-all, filtered by category.
- **Port health checks** — after start, HTTP ping `localhost:<port>` to confirm the dev server is accepting connections before marking `online`.
- **App metadata extensions** — git branch, user notes, last accessed time.
- **Manifest backup** — periodic snapshots of manifest.json in case of corruption.
- **Log streaming** — WebSocket-based real-time log tailing via `pm2.launchBus()`.