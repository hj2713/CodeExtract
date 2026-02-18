/**
 * Master seed script that creates codeExamples records for ALL apps in created-apps
 *
 * Run with: bun apps/web/src/app/MANUAL/seed/seed-all-apps.ts
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
  requirement: text("requirement").notNull(),
  context: text("context"),
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

// All apps in created-apps folder with their config
// Standalone apps (with package.json) need ports, simple apps use path routing
const ALL_APPS = [
  // STANDALONE Next.js apps (have package.json, need their own port)
  { name: "extract-the-command-palette", isStandalone: true, port: 4003, title: "Command Palette (⌘K)" },
  { name: "extract-the-floating-action-bar-at-the-folder-titl", isStandalone: true, port: 4005, title: "Floating Action Bar" },
  { name: "the-goal-is-to-extract-a-fully-functional-and-reus", isStandalone: true, port: 4006, title: "Fully Functional Reusable Component" },

  // SIMPLE page.tsx apps (no package.json, use main server path routing)
  { name: "action-buttons", isStandalone: false, port: 0, title: "Action Buttons" },
  { name: "active-job-component", isStandalone: false, port: 0, title: "Active Job Component" },
  { name: "agent-context-modal", isStandalone: false, port: 0, title: "Agent Context Modal" },
  { name: "app-grid", isStandalone: false, port: 0, title: "App Grid" },
  { name: "app-item", isStandalone: false, port: 0, title: "App Item" },
  { name: "back-next-nav", isStandalone: false, port: 0, title: "Back/Next Navigation" },
  { name: "chat-input", isStandalone: false, port: 0, title: "Chat Input" },
  { name: "component-card-list", isStandalone: false, port: 0, title: "Component Card List" },
  { name: "create-source-modal", isStandalone: false, port: 0, title: "Create Source Modal" },
  { name: "deny-modal", isStandalone: false, port: 0, title: "Deny Modal" },
  { name: "filesystem-modal", isStandalone: false, port: 0, title: "Filesystem Modal" },
  { name: "github-repo-tree", isStandalone: false, port: 0, title: "GitHub Repo Tree" },
  { name: "github-switcher-with-db", isStandalone: false, port: 0, title: "GitHub Switcher" },
  { name: "live-preview", isStandalone: false, port: 0, title: "Live Preview" },
  { name: "logs-modal", isStandalone: false, port: 0, title: "Logs Modal" },
  { name: "messages-area", isStandalone: false, port: 0, title: "Messages Area" },
  { name: "queue-component", isStandalone: false, port: 0, title: "Queue Component" },
  { name: "readme-modal", isStandalone: false, port: 0, title: "README Modal" },
];

async function seed() {
  console.log("🌱 Seeding ALL apps from created-apps folder\n");

  // Create a single source for all these extracted components
  const sourceId = randomUUID();
  await db.insert(sources).values({
    id: sourceId,
    name: "codeextract-components",
    type: "ai_prototype",
    originUrl: null,
    description: "Collection of extracted UI components for the CodeExtract application",
    inputType: "github",
  });
  console.log(`✓ Created source: codeextract-components (${sourceId})\n`);

  let created = 0;
  let skipped = 0;

  for (const app of ALL_APPS) {
    const requirementId = randomUUID();
    const codeExampleId = randomUUID();

    try {
      // Create requirement
      await db.insert(requirements).values({
        id: requirementId,
        sourceId: sourceId,
        title: app.title,
        requirement: `Extract the ${app.title} component`,
        context: app.isStandalone
          ? `Standalone Next.js app running on port ${app.port}`
          : "Simple page.tsx component using main server routing",
        status: "completed",
      });

      // Create code example
      await db.insert(codeExamples).values({
        id: codeExampleId,
        requirementId: requirementId,
        path: `created-apps/${app.name}`,
        port: app.port,
        reviewStatus: "pending",
      });

      const type = app.isStandalone ? `STANDALONE:${app.port}` : "SIMPLE";
      console.log(`   ✓ [${type}] ${app.title}`);
      created++;
    } catch (error: any) {
      if (error.message?.includes("UNIQUE constraint")) {
        console.log(`   - Skipped: ${app.title} (already exists)`);
        skipped++;
      } else {
        console.log(`   ✗ Failed: ${app.title} - ${error.message}`);
      }
    }
  }

  console.log(`\n✅ Seeding complete!`);
  console.log(`   Created: ${created} apps`);
  console.log(`   Skipped: ${skipped} apps`);
  console.log(`\n📊 Summary:`);
  console.log(`   - 3 standalone Next.js apps (ports 4003, 4005, 4006)`);
  console.log(`   - ${ALL_APPS.length - 3} simple page.tsx components`);

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
