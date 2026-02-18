/**
 * Seed script for: extract-the-command-palette
 * Run with: bun seed.ts (from monorepo root)
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";

// Define schema inline to avoid env validation from workspace packages
const sources = sqliteTable("sources", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", { enum: ["github_repo", "local_directory", "ai_prototype"] }).notNull().default("github_repo"),
  originUrl: text("origin_url"),
  description: text("description"),
  localPath: text("local_path"),
  inputType: text("input_type", { enum: ["github", "screenshot", "live_url"] }).notNull().default("github"),
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
  console.log("🌱 Seeding: extract-the-command-palette");

  const now = new Date().toISOString();

  // Generate all IDs upfront
  const sourceId = randomUUID();
  const requirementId = randomUUID();
  const jobId = randomUUID();
  const codeExampleId = randomUUID();

  // 1. SOURCE - AI Prototype (built from scratch)
  await db.insert(sources).values({
    id: sourceId,
    name: "command-palette",
    type: "ai_prototype",
    originUrl: null,
    description: "A VS Code / Linear style command palette built from scratch using cmdk library",
    inputType: "github",
  });

  // 2. REQUIREMENT - What was the extraction spec?
  await db.insert(requirements).values({
    id: requirementId,
    sourceId: sourceId,
    jobId: jobId,
    title: "Command Palette (⌘K)",
    requirement: "Build a command palette component similar to VS Code's or Linear's. Include: Keyboard shortcut trigger (⌘K / Ctrl+K), Fuzzy search input with instant filtering, Categorized results (Actions, Pages, Settings), Keyboard navigation (up/down arrows, enter to select), Recent items section at the top.",
    context: "Use cmdk library as the foundation. Style with Tailwind to match a dark theme. Include smooth open/close animations.",
    status: "completed",
  });

  // 3. JOB - What work was done?
  const prompt = `Build a command palette component similar to VS Code's or Linear's.

REQUIREMENT:
Build a command palette component similar to VS Code's or Linear's. Include:
- Keyboard shortcut trigger (⌘K / Ctrl+K)
- Fuzzy search input with instant filtering
- Categorized results (Actions, Pages, Settings)
- Keyboard navigation (up/down arrows, enter to select)
- Recent items section at the top

CONTEXT:
Use cmdk library as the foundation. Style with Tailwind to match a dark theme. Include smooth open/close animations.

Build this as a standalone Next.js app that runs independently. This is an AI prototype built from scratch.`;

  await db.insert(jobs).values({
    id: jobId,
    type: "claude_extraction",
    payload: JSON.stringify({
      type: "claude_extraction",
      name: "extract-the-command-palette",
      prompt: prompt,
      targetPath: null,
      originUrl: null,
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
    path: "created-apps/extract-the-command-palette",
    port: 4003,
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
