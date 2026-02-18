/**
 * Seed script for: github-switcher-with-db
 * Creates sample GitHub sources for testing the GithubSwitcher component
 *
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
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Connect directly to database file
const client = createClient({
  url: "file:packages/db/local.db",
});

const db = drizzle({ client });

async function seed() {
  console.log("🌱 Seeding: github-switcher-with-db sample sources");

  const now = new Date();

  // Sample GitHub sources for testing
  const sampleSources = [
    {
      id: randomUUID(),
      name: "mckaywrigley/chatbot-ui",
      type: "github_repo" as const,
      originUrl: "https://github.com/mckaywrigley/chatbot-ui",
      description: "A ChatGPT-style chat interface built with Next.js and Tailwind",
      inputType: "github" as const,
      githubMetadata: JSON.stringify({
        owner: "mckaywrigley",
        repo: "chatbot-ui",
        defaultBranch: "main",
        description: "A ChatGPT-style chat interface built with Next.js and Tailwind",
        stars: 28000,
        forks: 7500,
        fetchedAt: now.toISOString(),
      }),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      name: "vercel/ai",
      type: "github_repo" as const,
      originUrl: "https://github.com/vercel/ai",
      description: "Build AI-powered applications with React, Svelte, Vue, and Solid",
      inputType: "github" as const,
      githubMetadata: JSON.stringify({
        owner: "vercel",
        repo: "ai",
        defaultBranch: "main",
        description: "Build AI-powered applications with React, Svelte, Vue, and Solid",
        stars: 15000,
        forks: 2000,
        fetchedAt: now.toISOString(),
      }),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      name: "shadcn/ui",
      type: "github_repo" as const,
      originUrl: "https://github.com/shadcn/ui",
      description: "Beautifully designed components built with Radix UI and Tailwind CSS",
      inputType: "github" as const,
      githubMetadata: JSON.stringify({
        owner: "shadcn",
        repo: "ui",
        defaultBranch: "main",
        description: "Beautifully designed components built with Radix UI and Tailwind CSS",
        stars: 75000,
        forks: 4500,
        fetchedAt: now.toISOString(),
      }),
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Insert sources (skip if already exists)
  for (const source of sampleSources) {
    try {
      await db.insert(sources).values(source);
      console.log(`   ✓ Added: ${source.name}`);
    } catch (error) {
      // Likely duplicate, skip
      console.log(`   - Skipped: ${source.name} (may already exist)`);
    }
  }

  console.log("\n✅ Seeding complete!");
  console.log(`   Added ${sampleSources.length} sample GitHub sources`);

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
