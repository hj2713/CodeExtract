/**
 * Seed script for CodeExtract database
 * Run with: npx tsx src/seed.ts
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { randomUUID } from "crypto";
import * as schema from "./schema";

// Create client
const client = createClient({
  url: "file:../../local.db",
});

const db = drizzle({ client, schema });

async function seed() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await db.delete(schema.messages);
  await db.delete(schema.conversations);
  await db.delete(schema.sources);

  // Seed mock source data (matching our sources schema)
  const sourceId = randomUUID();

  await db.insert(schema.sources).values({
    id: sourceId,
    type: "github_repo",
    originUrl: "https://github.com/mckaywrigley/chatbot-ui",
    description: "A ChatGPT-style chat interface built with Next.js, React, TypeScript, Tailwind CSS, and Supabase",
    githubMetadata: {
      owner: "mckaywrigley",
      repo: "chatbot-ui",
      defaultBranch: "main",
      description: "The open-source AI chat app for everyone.",
      stars: 25000,
      forks: 6800,
      fetchedAt: new Date().toISOString(),
    },
  });

  console.log(`✅ Created source: mckaywrigley/chatbot-ui (ID: ${sourceId})`);

  // Create a sample conversation
  const conversationId = randomUUID();

  await db.insert(schema.conversations).values({
    id: conversationId,
    sourceId: sourceId,
    userId: "default-user",
    title: "ChatWindow extraction discussion",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log(`✅ Created sample conversation (ID: ${conversationId})`);

  // Add sample messages
  await db.insert(schema.messages).values([
    {
      id: randomUUID(),
      conversationId: conversationId,
      role: "user",
      content: "I want to extract the ChatWindow component with all its streaming functionality.",
      createdAt: new Date(Date.now() - 60000),
    },
    {
      id: randomUUID(),
      conversationId: conversationId,
      role: "assistant",
      content: "Great choice! The ChatWindow component has dependencies on OpenAI for streaming. I'll need to mock the API calls. Should I preserve the typing animation effect?",
      createdAt: new Date(),
    },
  ]);

  console.log("✅ Created sample messages");
  console.log("\n🎉 Seeding complete!");

  // Log the source ID for reference
  console.log(`\n📋 Source ID for testing: ${sourceId}`);

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
