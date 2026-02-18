/**
 * Seed script for: app-grid
 * Creates sample approved code examples for testing AppGrid component
 *
 * FIXED: Uses correct path format (no leading slash)
 * FIXED: Uses existing apps from created-apps folder
 *
 * Run with: bun apps/web/src/app/MANUAL/seed/app-grid/seed.ts
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { randomUUID } from "crypto";
import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Define schema inline
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
  requirement: text("requirement").notNull(),
  title: text("title"),
  status: text("status").notNull().default("draft"),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
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

async function seed() {
  console.log("🌱 Seeding: app-grid test data (APPROVED examples)");

  // Create a source for these test apps
  const sourceId = randomUUID();
  try {
    await db.insert(sources).values({
      id: sourceId,
      name: "app-grid-test-source",
      type: "ai_prototype",
      originUrl: null,
      description: "Test source for AppGrid component display",
      inputType: "github",
    });
    console.log(`   ✓ Created source: app-grid-test-source`);
  } catch (error) {
    console.log(`   - Source may already exist, continuing...`);
  }

  // Use REAL apps from created-apps folder
  // These are APPROVED examples that will show in AppGrid
  const approvedApps = [
    {
      name: "chat-input",
      title: "Chat Input Component",
      description: "A modern chat input with send button and attachment support",
      port: 0, // Simple page.tsx, uses path routing
    },
    {
      name: "github-repo-tree",
      title: "GitHub Repo Tree",
      description: "Interactive file tree viewer for GitHub repositories",
      port: 0,
    },
    {
      name: "extract-the-command-palette",
      title: "Command Palette",
      description: "VS Code / Linear style command palette with keyboard shortcuts",
      port: 4003, // Standalone Next.js app
    },
  ];

  for (const app of approvedApps) {
    const requirementId = randomUUID();
    const codeExampleId = randomUUID();

    try {
      // Create requirement
      await db.insert(requirements).values({
        id: requirementId,
        sourceId: sourceId,
        title: app.title,
        requirement: app.description,
        status: "completed",
      });

      // Create APPROVED code example
      // NOTE: path has NO leading slash - this is the correct format!
      await db.insert(codeExamples).values({
        id: codeExampleId,
        requirementId: requirementId,
        path: `created-apps/${app.name}`,  // NO leading slash!
        port: app.port,
        reviewStatus: "approved",  // These show in AppGrid
      });

      console.log(`   ✓ [APPROVED] ${app.title} -> created-apps/${app.name}`);
    } catch (error: any) {
      console.log(`   - Skipped: ${app.title} (may already exist)`);
    }
  }

  // Also create one PENDING example to test filtering
  const pendingReqId = randomUUID();
  const pendingCodeExId = randomUUID();
  try {
    await db.insert(requirements).values({
      id: pendingReqId,
      sourceId: sourceId,
      title: "Filesystem Modal",
      requirement: "Modal for browsing filesystem",
      status: "extracting",
    });

    await db.insert(codeExamples).values({
      id: pendingCodeExId,
      requirementId: pendingReqId,
      path: "created-apps/filesystem-modal",  // NO leading slash!
      port: 0,
      reviewStatus: "pending",  // This should NOT show in approved grid
    });

    console.log(`   ✓ [PENDING] Filesystem Modal -> created-apps/filesystem-modal`);
  } catch (error) {
    console.log(`   - Skipped: Filesystem Modal (may already exist)`);
  }

  console.log("\n✅ Seeding complete!");
  console.log(`   3 approved apps (will show in AppGrid)`);
  console.log(`   1 pending app (should be filtered out)`);

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
