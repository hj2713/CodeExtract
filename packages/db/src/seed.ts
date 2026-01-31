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

  // Seed mock source data (same as our previous MOCK_ANALYSIS)
  const sourceId = randomUUID();
  
  const mockComponents = [
    {
      name: "ChatWindow",
      description: "Main chat interface component handling message display and user input. Integrates with OpenAI API for streaming responses.",
      filePath: "src/components/ChatWindow.tsx",
      dependencies: ["openai", "react-markdown"],
    },
    {
      name: "MessageBubble",
      description: "Individual message bubble with support for markdown rendering, code highlighting, and copy functionality.",
      filePath: "src/components/MessageBubble.tsx",
      dependencies: ["react-markdown", "prism-react-renderer"],
    },
    {
      name: "Sidebar",
      description: "Navigation sidebar with conversation history, new chat button, and settings. Connected to Supabase for persistence.",
      filePath: "src/components/Sidebar.tsx",
      dependencies: ["@supabase/supabase-js", "zustand"],
    },
    {
      name: "ModelSelector",
      description: "Dropdown component for selecting AI model (GPT-4, GPT-3.5, etc). Persists selection to user preferences.",
      filePath: "src/components/ModelSelector.tsx",
      dependencies: ["zustand"],
    },
    {
      name: "UserProfile",
      description: "User profile section with avatar, name, and logout functionality. Uses Supabase Auth for session management.",
      filePath: "src/components/UserProfile.tsx",
      dependencies: ["@supabase/supabase-js"],
    },
  ];

  await db.insert(schema.sources).values({
    id: sourceId,
    name: "mckaywrigley/chatbot-ui",
    techStack: JSON.stringify(["Next.js", "React", "TypeScript", "Tailwind CSS", "Supabase"]),
    dependencies: JSON.stringify(["@supabase/supabase-js", "openai", "react-markdown", "zustand"]),
    components: JSON.stringify(mockComponents),
    createdAt: new Date(),
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
