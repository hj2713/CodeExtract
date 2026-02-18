/**
 * Seed script for: queue-component
 *
 * Creates sample pending jobs to test QueueComponent rendering.
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
  console.log("🌱 Seeding: queue-component test data");

  const now = new Date().toISOString();

  // Create a source
  const sourceId = randomUUID();
  await db.insert(sources).values({
    id: sourceId,
    name: "test-source",
    type: "github_repo",
    originUrl: "https://github.com/example/repo",
    description: "Test source for QueueComponent",
    inputType: "github",
  });

  // Create 3 pending jobs to display in queue
  const pendingJobs = [
    { name: "extract-the-navbar", priority: 2 },
    { name: "extract-the-sidebar", priority: 1 },
    { name: "extract-the-footer", priority: 0 },
  ];

  for (const { name, priority } of pendingJobs) {
    const requirementId = randomUUID();
    const jobId = randomUUID();

    // Create requirement
    await db.insert(requirements).values({
      id: requirementId,
      sourceId: sourceId,
      jobId: jobId,
      title: name.replace("extract-the-", "").replace(/-/g, " "),
      requirement: `Extract the ${name.replace("extract-the-", "")} component`,
      context: "Test context for queue-component seed",
      status: "extracting",
    });

    // Create pending job
    const prompt = `Extract the ${name} component from the source repository.`;
    await db.insert(jobs).values({
      id: jobId,
      type: "claude_extraction",
      payload: JSON.stringify({
        type: "claude_extraction",
        name,
        prompt,
        targetPath: null,
        originUrl: "https://github.com/example/repo",
        requirementId,
        promptHash: hashString(prompt),
      }),
      status: "pending",
      priority,
      attempts: 0,
      maxAttempts: 3,
      createdAt: now,
      idempotencyKey: `extraction-${requirementId}`,
    });

    console.log(`   ✓ Created pending job: ${name} (priority: ${priority})`);
  }

  // Create 1 claimed job (currently processing)
  const claimedReqId = randomUUID();
  const claimedJobId = randomUUID();

  await db.insert(requirements).values({
    id: claimedReqId,
    sourceId: sourceId,
    jobId: claimedJobId,
    title: "header",
    requirement: "Extract the header component",
    context: "Currently processing",
    status: "extracting",
  });

  await db.insert(jobs).values({
    id: claimedJobId,
    type: "claude_extraction",
    payload: JSON.stringify({
      type: "claude_extraction",
      name: "extract-the-header",
      prompt: "Extract the header component",
      targetPath: null,
      originUrl: "https://github.com/example/repo",
      requirementId: claimedReqId,
      promptHash: hashString("Extract the header component"),
    }),
    status: "claimed",
    priority: 3,
    attempts: 1,
    maxAttempts: 3,
    createdAt: now,
    claimedAt: now,
    lockedBy: "worker-test-123",
    lockedAt: now,
    idempotencyKey: `extraction-${claimedReqId}`,
  });

  console.log("   ✓ Created claimed job: extract-the-header");

  console.log("\n✅ Seeding complete!");
  console.log(`   Source ID: ${sourceId}`);
  console.log(`   3 pending jobs + 1 claimed job created`);

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
