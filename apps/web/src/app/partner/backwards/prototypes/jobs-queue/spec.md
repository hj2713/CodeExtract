# Functional Spec: Unified Job Queue System

**SQLite-backed job queue with outbox pattern for reliable side-effect execution**

Author: Daren · Date: January 2026 · Status: Draft

---

## 1. Problem Statement

The system currently stores data models as JSON files on the local filesystem. Many operations require updating a data model and performing a side effect in a single logical operation — creating a database record linked to an AWS job, writing a JSON file and also creating companion files on disk, queuing prompts to an external AI service.

When these operations are performed directly and one step fails partway through, the system enters an inconsistent state with no reliable way to detect or recover from the failure.

This spec defines a unified job queue that introduces a single coordination layer using SQLite to guarantee that every intended side effect is tracked, retried on failure, and never silently lost.

---

## 2. Design Principles

> **Core Rule:** One source of truth for coordination. SQLite is the authority on what work needs to happen, what is in progress, and what has completed. JSON files remain the data layer. Do not introduce a second persistence system for job state.

**1. Single table, multiple job types.** All jobs live in one table regardless of type. Job-specific data lives in a typed JSON payload column. Adding a new job type means adding a handler function, never a new table or migration.

**2. Filesystem stays as data layer.** JSON files continue to be the primary storage for application data models. SQLite handles only coordination: what jobs exist, their state, retry counts, and locks. These two layers must not duplicate each other's responsibilities.

**3. Atomic intent capture.** When a user action requires a side effect, the system writes the job record to SQLite in the same logical step as acknowledging the action. If the write to SQLite fails, the action is not considered accepted. The side effect is never fire-and-forget.

**4. Every failure is visible and recoverable.** No job silently disappears. Failed jobs remain in the table with error details. Stuck jobs (claimed but never completed) are reclaimed after a timeout. The system can always answer: what work is outstanding right now?

---

## 3. Data Model

### 3.1 Jobs Table Schema

One table holds all jobs. The payload column carries type-specific data as a JSON blob. Application-layer types enforce structure per job type.

| Column | Type | Description |
|---|---|---|
| id | TEXT PRIMARY KEY | Unique identifier (ULID or UUID). Generated at queue time. |
| type | TEXT NOT NULL | Discriminator for handler dispatch. Examples: `claude_extraction`, `create_file`, `sync_aws`. Indexed. |
| payload | TEXT (JSON) NOT NULL | Job-specific input data. Schema varies by type. Validated at the application layer using a discriminated union. |
| status | TEXT NOT NULL | One of: `pending`, `claimed`, `completed`, `failed`. Defaults to `pending`. Indexed. |
| priority | INTEGER DEFAULT 0 | Higher values execute first. Use for urgent jobs. Default zero means FIFO within priority. |
| attempts | INTEGER DEFAULT 0 | How many times the worker has tried this job. Incremented on each claim. |
| max_attempts | INTEGER DEFAULT 3 | After this many failures, the job moves to `failed` permanently. |
| last_error | TEXT | Error message or stack trace from the most recent failed attempt. |
| locked_by | TEXT | Identifier of the worker or process that currently owns this job. Null when unclaimed. |
| locked_at | TIMESTAMP | When the current lock was acquired. Used for stale lock detection. |
| created_at | TIMESTAMP NOT NULL | When the job was first queued. Set once, never modified. |
| claimed_at | TIMESTAMP | When a worker most recently claimed this job. |
| completed_at | TIMESTAMP | When the job reached `completed` or `failed` status. |

### 3.2 Indexes

The worker polling query filters on status and sorts by priority and creation time. An index on `(status, priority, created_at)` ensures this query does not scan the entire table. A unique index on `(type, payload_hash)` or a separate `idempotency_key` column prevents duplicate jobs for the same logical operation.

### 3.3 Typed Payloads

The payload column is loosely typed in the database but strictly typed at the application layer. Each job type defines a payload shape. The application validates payloads at queue time and at execution time. An invalid payload is an immediate failure, not a retry.

| Job Type | Payload Fields | Description |
|---|---|---|
| claude_extraction | prompt, targetPath, requirementId, promptHash | Queue a prompt to Claude Code. The prompt is the frozen input captured at queue time. promptHash enables deduplication. |
| create_file | path, content, overwrite | Write a file to disk. Overwrite flag prevents accidental clobbering. |
| delete_file | path, requireExists | Remove a file. requireExists controls whether a missing file is an error or a no-op. |
| sync_aws | resourceType, resourceId, config | Create, update, or delete an AWS resource. Config carries the full resource specification. |

---

## 4. Job Lifecycle

### 4.1 State Machine

Every job moves through a strict sequence of states. No state can be skipped. Backward transitions only occur through the retry mechanism.

```
pending → claimed       Worker picks up job, sets locked_by, increments attempts.
claimed → completed     Handler succeeds, job is marked done.
claimed → pending       Handler fails but attempts < max_attempts. Error logged, lock released.
claimed → failed        Handler fails and attempts >= max_attempts. Terminal state.
claimed → pending       Lock expires (stale lock reclaim). Another worker can pick it up.
```

### 4.2 Queuing a Job

When the application needs to perform a side effect, it creates a job record in the jobs table with status `pending`. This write should happen inside a transaction alongside any related data model update. If the transaction fails, neither the data model update nor the job is persisted.

**Idempotency check:** Before inserting, query for an existing job with the same type and a matching idempotency key (for example, `requirementId` for extractions, or a hash of the payload). If a `pending` or `claimed` job already exists, return the existing job instead of creating a duplicate.

### 4.3 Claiming a Job

The worker polls the jobs table for the next available job. The claim query must be atomic. Use a compare-and-swap UPDATE with a WHERE clause that checks the current status is still `pending`. The claim sets status to `claimed`, sets `locked_by` to the current worker identifier, sets `locked_at` to the current time, and increments the attempts counter.

> ⚠️ **Critical:** The claim must be a single atomic operation. If two workers poll simultaneously, each must get a different job or one must get nothing. Never allow two workers to claim the same job.

### 4.4 Executing a Job

The worker dispatches based on the `type` column to the appropriate handler function. The handler receives the parsed payload and performs the side effect. If the handler returns successfully, the worker sets status to `completed` and records the completion timestamp.

If the handler throws an error, the worker records the error in `last_error`. If `attempts` is less than `max_attempts`, the worker sets status back to `pending` and clears the lock, making the job available for retry. If `attempts` has reached `max_attempts`, the worker sets status to `failed`. This is a terminal state.

### 4.5 Stale Lock Reclamation

If a worker crashes while processing a job, the job remains in `claimed` status with a stale lock. A periodic sweep (run by any worker or a dedicated process) queries for jobs where status is `claimed` and `locked_at` is older than a configurable timeout (suggested default: 5 minutes). These jobs are moved back to `pending` with their lock cleared. The attempt counter is not incremented by the sweep — it was already incremented when the lock was first acquired.

---

## 5. Worker Process

### 5.1 Polling Loop

The worker runs a continuous loop that polls the jobs table at a configurable interval (suggested default: 1 second). Each iteration claims at most one job, executes it, and records the result. If no jobs are available, the worker waits for the poll interval before checking again.

**Backoff:** If the worker encounters repeated failures (database errors, not job failures), it should increase the poll interval using exponential backoff up to a maximum (suggested: 30 seconds). Reset to the base interval after a successful poll.

### 5.2 Concurrency

For a local tool with SQLite, a single worker process is the simplest correct approach. SQLite handles one writer at a time. Multiple workers add contention without meaningful throughput gain. If concurrency is needed later, run multiple worker threads within the same process, each claiming independently. The atomic claim query prevents double-processing.

### 5.3 Graceful Shutdown

On receiving a shutdown signal (SIGINT, SIGTERM), the worker should finish the currently executing job before exiting. Do not kill a job mid-execution. If the job is long-running, the worker should check for a shutdown flag at safe checkpoints within the handler and abort cleanly if set, releasing the lock and not incrementing the attempt counter.

---

## 6. Error Handling and Recovery

### 6.1 Retry Strategy

Jobs are retried up to `max_attempts` times. The delay between retries should use exponential backoff. The simplest approach: do not retry immediately. When a job fails and is returned to `pending`, it becomes eligible for pickup on the next poll cycle. If more sophisticated backoff is needed, add a `run_at` column that specifies the earliest time the job should be picked up, and modify the claim query to filter on `run_at <= now`.

### 6.2 Permanent Failures

A job that exhausts all retry attempts is marked as `failed`. Failed jobs are never automatically retried. They remain in the table with their error history for inspection. The application should provide a way to manually retry a failed job by resetting its status to `pending` and its attempts counter to zero. This is an explicit operator action, never automatic.

### 6.3 Poison Jobs

If a job consistently crashes the worker process rather than throwing a catchable error, it will be reclaimed by the stale lock sweep and retried until it exhausts `max_attempts`. After that, it sits in `failed` status. If you observe the same job causing repeated worker crashes, the problem is in the handler code, not the queue. Fix the handler.

---

## 7. Filesystem Coordination

Because JSON files remain the data layer and SQLite handles coordination, both systems must agree on what has happened. The rules are simple:

**1. Write the job first, then do the filesystem operation.** Never write files optimistically and record the job after. If the recording fails, you have orphaned files with no tracking.

**2. Jobs that create files should be idempotent.** If a `create_file` job runs twice (because the first attempt succeeded but the completion record failed), the second run should produce the same result. Write to a temp path first, then atomic rename. If the target already exists with the correct content, treat it as success.

**3. Do not split one logical operation into multiple jobs unless ordering is guaranteed.** If creating a data model requires writing three files, either do it in one job with one handler, or use a parent-child job relationship where child jobs are only queued after the parent completes.

**4. Reconciliation.** Build a health check that compares the jobs table against the filesystem. For every completed `create_file` job, does the file exist? For every completed `delete_file` job, is the file gone? Run this on startup and on demand. Log discrepancies, do not auto-fix.

---

## 8. Observability

You need to answer these questions at any time, from a single query against the jobs table:

| Question | Query Approach |
|---|---|
| What work is outstanding right now? | Count of jobs where status is `pending` or `claimed`, grouped by type. |
| What failed and why? | Select jobs where status is `failed`. `last_error` has the detail. |
| Is anything stuck? | Jobs where status is `claimed` and `locked_at` is older than the timeout. |
| How long do jobs take? | Difference between `claimed_at` and `completed_at` for completed jobs. |
| Are there duplicate jobs? | Group by type and idempotency key, filter where count > 1. |
| What ran in the last hour? | Jobs where `completed_at` is within the last 60 minutes. |

Consider logging job lifecycle events (queued, claimed, completed, failed, reclaimed) to stdout with structured output. This gives you a timeline of activity without needing to query the database.

---

## 9. Implementation Order

Ship this incrementally. Each step is independently testable and provides value before the next step exists.

**Phase 1: Foundation.** Set up SQLite with Drizzle ORM. Create the jobs table. Write a function that inserts a job and a function that queries jobs by status. Write a test that inserts a job and reads it back. This validates your schema, your tooling, and your connection. Nothing runs yet.

**Phase 2: Worker Loop.** Build the polling loop that claims a job and dispatches to a handler. Start with a single trivial job type (like `create_file`) so you can test the full claim-execute-complete cycle. Verify that a failed handler retries correctly and that a job that exhausts retries moves to `failed`.

**Phase 3: Stale Lock Recovery.** Simulate a crash by killing the worker mid-job. Verify the stale lock sweep reclaims it. This is the part most people skip and then regret.

**Phase 4: Claude Code Integration.** Add the `claude_extraction` job type and handler. Wire up the requirement-to-prompt generation. Implement prompt hashing and deduplication. This is where the real value lives, but it depends on all prior phases being solid.

**Phase 5: Observability and Reconciliation.** Add the health check that compares job state to filesystem state. Add structured logging. Build a simple CLI or query interface that answers the observability questions from Section 8.

---

## 10. What Not to Build

Scope control is as important as the spec itself. The following are explicitly out of scope for the first version:

**✗ Job dependencies or DAGs.** If job B must run after job A, have job A's handler queue job B upon completion. Do not build a dependency graph engine.

**✗ Scheduled or cron-style jobs.** The queue is for immediate or near-immediate work. Scheduled execution is a different system. Add a `run_at` column later if needed.

**✗ Multi-node distribution.** SQLite is single-machine. If you need multiple machines processing the same queue, you need Postgres. Cross that bridge when you reach it.

**✗ Event sourcing or CQRS.** The jobs table is a log of work, not an event store. Do not try to reconstruct application state from job history.

