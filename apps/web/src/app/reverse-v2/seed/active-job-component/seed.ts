/**
 * Seed script for: active-job-component
 * Run with: bun seed.ts (from monorepo root)
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { randomUUID } from "crypto";
import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Define schema inline to avoid env validation from workspace packages
const sources = sqliteTable("sources", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", { enum: ["github_repo", "local_directory", "ai_prototype"] }).notNull().default("github_repo"),
  originUrl: text("origin_url"),
  description: text("description"),
  inputType: text("input_type", { enum: ["github", "screenshot", "live_url"] }).notNull().default("github"),
});

const requirements = sqliteTable("requirements", {
  id: text("id").primaryKey(),
  sourceId: text("source_id").notNull(),
  jobId: text("job_id"),
  conversationId: text("conversation_id"),
  requirement: text("requirement").notNull(),
  context: text("context"),
  title: text("title"),
  status: text("status").notNull().default("draft"),
  relevantFiles: text("relevant_files"),
  dependencies: text("dependencies"),
  technicalSpecs: text("technical_specs"),
  implementationNotes: text("implementation_notes"),
  images: text("images", { mode: "json" }),
  chatSummary: text("chat_summary"),
  priority: text("priority").default("1"),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

const jobs = sqliteTable("jobs", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  payload: text("payload", { mode: "json" }).notNull(),
  status: text("status", { enum: ["pending", "claimed", "completed", "failed"] }).notNull().default("pending"),
  priority: integer("priority").default(0),
  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(3),
  lastError: text("last_error"),
  lockedBy: text("locked_by"),
  lockedAt: text("locked_at"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  claimedAt: text("claimed_at"),
  completedAt: text("completed_at"),
  idempotencyKey: text("idempotency_key"),
});

const codeExamples = sqliteTable("code_examples", {
  id: text("id").primaryKey(),
  requirementId: text("requirement_id").notNull(),
  path: text("path").notNull(),
  port: integer("port").notNull(),
  reviewStatus: text("review_status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  rejectionReason: text("rejection_reason", { enum: ["does_not_run", "incorrect", "not_minimal", "other"] }),
  rejectionNotes: text("rejection_notes"),
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
});

// Connect directly to database file
const client = createClient({
  url: "file:packages/db/local.db",
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
  console.log("🌱 Seeding: active-job-component");

  const now = new Date().toISOString();

  // Generate all IDs upfront
  const sourceId = randomUUID();
  const requirementId = randomUUID();
  const jobId = randomUUID();
  const codeExampleId = randomUUID();

  // 1. SOURCE - Where did the code come from?
  await db.insert(sources).values({
    id: sourceId,
    name: "codeextract-ui",
    type: "github_repo",
    originUrl: "https://github.com/internal/codeextract",
    description: "CodeExtract's own UI components, specifically the job queue display system",
    inputType: "github",
  });

  // 2. REQUIREMENT - What was the extraction spec?
  await db.insert(requirements).values({
    id: requirementId,
    sourceId: sourceId,
    jobId: jobId,
    title: "Active Job Component",
    requirement: `Extract the ActiveJobComponent that displays currently running extraction jobs. The component should:
- Display a list of all jobs with status="claimed" (currently processing)
- Support selecting a job to view detailed progress
- Show step-by-step progress (create-nextjs, clone-repo, copy-templates, run-claude)
- Display inline logs for the currently running step
- Show Claude status section (not_started, running, completed, failed)
- Auto-scroll logs and auto-select first job
- Poll for updates (2s for job list, 1s for progress)
- Handle empty state when no active jobs`,
    context: `Uses React Query for polling. Progress data comes from job-progress/{jobId}.json files written by the worker. The ScriptProgressViewer shows a bash script-like UI with line numbers and step status indicators. Uses Tailwind CSS with zinc color palette.`,
    status: "completed",
  });

  // 3. JOB - What work was done?
  const prompt = `Extract the ActiveJobComponent from the CodeExtract queue system.

REQUIREMENT:
Extract the ActiveJobComponent that displays currently running extraction jobs. The component should:
- Display a list of all jobs with status="claimed" (currently processing)
- Support selecting a job to view detailed progress
- Show step-by-step progress (create-nextjs, clone-repo, copy-templates, run-claude)
- Display inline logs for the currently running step
- Show Claude status section (not_started, running, completed, failed)
- Auto-scroll logs and auto-select first job
- Poll for updates (2s for job list, 1s for progress)
- Handle empty state when no active jobs

CONTEXT:
Uses React Query for polling. Progress data comes from job-progress/{jobId}.json files written by the worker. The ScriptProgressViewer shows a bash script-like UI with line numbers and step status indicators. Uses Tailwind CSS with zinc color palette.

Build this as a standalone component that can be integrated into the /final page. Include mock data for development.`;

  await db.insert(jobs).values({
    id: jobId,
    type: "claude_extraction",
    payload: JSON.stringify({
      type: "claude_extraction",
      name: "active-job-component",
      prompt: prompt,
      targetPath: null,
      originUrl: "https://github.com/internal/codeextract",
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
  // Note: This is NOT a standalone Next.js app (no package.json), so port is just for reference
  await db.insert(codeExamples).values({
    id: codeExampleId,
    requirementId: requirementId,
    path: "created-apps/active-job-component",
    port: 0,  // Not a standalone app, uses main server path routing
    reviewStatus: "pending",
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
