/**
 * Seed script for: create-source-modal
 *
 * This creates sample source records to test the CreateSourceModal component.
 * Run with: bun seed.ts (from monorepo root)
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { randomUUID } from "crypto";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Define schema inline to avoid env validation from workspace packages
const sources = sqliteTable("sources", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", { enum: ["github_repo", "local_directory", "ai_prototype"] }).notNull().default("github_repo"),
  originUrl: text("origin_url"),
  description: text("description"),
  localPath: text("local_path"),
  inputType: text("input_type", { enum: ["github", "screenshot", "live_url"] }).notNull().default("github"),
  githubMetadata: text("github_metadata", { mode: "json" }),
  analysisPath: text("analysis_path"),
  analysisConfirmed: integer("analysis_confirmed", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Connect directly to database file
const client = createClient({
  url: "file:packages/db/local.db",
});

const db = drizzle({ client });

async function seed() {
  console.log("🌱 Seeding: create-source-modal test data");

  const now = new Date();

  // Sample sources for testing
  const sampleSources = [
    {
      owner: "vercel",
      repo: "next.js",
      description: "The React Framework for the Web",
    },
    {
      owner: "facebook",
      repo: "react",
      description: "A JavaScript library for building user interfaces",
    },
    {
      owner: "tailwindlabs",
      repo: "tailwindcss",
      description: "A utility-first CSS framework",
    },
  ];

  for (const sample of sampleSources) {
    const id = randomUUID();

    try {
      await db.insert(sources).values({
        id,
        name: `${sample.owner}/${sample.repo}`,
        type: "github_repo",
        originUrl: `https://github.com/${sample.owner}/${sample.repo}`,
        description: sample.description,
        githubMetadata: JSON.stringify({
          owner: sample.owner,
          repo: sample.repo,
          defaultBranch: "main",
          description: sample.description,
          stars: null,
          forks: null,
          fetchedAt: null,
        }),
        localPath: null,
        analysisPath: null,
        analysisConfirmed: false,
        createdAt: now,
        updatedAt: now,
      });

      console.log(`✅ Created: ${sample.owner}/${sample.repo}`);
    } catch (error) {
      // Likely duplicate, skip
      console.log(`⏭️  Skipped (exists): ${sample.owner}/${sample.repo}`);
    }
  }

  console.log("\n✅ Seeding complete!");
  console.log("\nTest the component by:");
  console.log(
    "1. Navigate to: /partner/backwards/prototypes/fetch-model-and-req/created-apps/create-source-modal"
  );
  console.log("2. Try adding a new source");
  console.log("3. Try adding a duplicate (should show error)");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
