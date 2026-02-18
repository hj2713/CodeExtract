/**
 * Seed script for: messages-area
 * Creates sample conversation and messages for testing MessagesArea component
 *
 * Run with: bun apps/web/src/app/MANUAL/seed/messages-area/seed.ts
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { randomUUID } from "crypto";
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

const conversations = sqliteTable("conversations", {
  id: text("id").primaryKey(),
  sourceId: text("source_id"),
  userId: text("user_id").notNull().default("default-user"),
  title: text("title"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id"),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Connect directly to database file
const client = createClient({
  url: "file:packages/db/local.db",
});

const db = drizzle({ client });

async function seed() {
  console.log("🌱 Seeding: messages-area test data");

  const now = new Date();

  // Create a source first
  const sourceId = randomUUID();
  try {
    await db.insert(sources).values({
      id: sourceId,
      name: "test-auth-codebase",
      type: "github_repo",
      originUrl: "https://github.com/example/auth-app",
      description: "Test codebase for MessagesArea component",
      inputType: "github",
    });
    console.log(`   ✓ Created source: test-auth-codebase`);
  } catch (error) {
    console.log(`   - Source may already exist, continuing...`);
  }

  // Create conversation
  const conversationId = `conv-messages-test-${randomUUID().slice(0, 8)}`;
  try {
    await db.insert(conversations).values({
      id: conversationId,
      sourceId: sourceId,
      userId: "default-user",
      title: "Authentication Flow Extraction",
      createdAt: now,
      updatedAt: now,
    });
    console.log(`   ✓ Created conversation: ${conversationId}`);
  } catch (error) {
    console.log(`   - Conversation may already exist, continuing...`);
  }

  // Create messages
  const sampleMessages = [
    {
      id: `msg-${randomUUID().slice(0, 8)}`,
      role: "user",
      content: "I want to extract the authentication flow from this codebase.",
      offset: 0,
    },
    {
      id: `msg-${randomUUID().slice(0, 8)}`,
      role: "assistant",
      content: `I can help you extract the authentication flow. Looking at the codebase, I can see there are several authentication-related components:

1. **Login Form** (\`src/components/auth/LoginForm.tsx\`)
2. **Auth Provider** (\`src/contexts/AuthContext.tsx\`)
3. **Protected Route Wrapper** (\`src/components/auth/ProtectedRoute.tsx\`)

Which parts would you like to focus on? Do you need:
- The complete auth flow with session management?
- Just the UI components?
- The API integration layer?`,
      offset: 1000,
    },
    {
      id: `msg-${randomUUID().slice(0, 8)}`,
      role: "user",
      content: "I need the complete auth flow with session management, including the login form UI.",
      offset: 2000,
    },
    {
      id: `msg-${randomUUID().slice(0, 8)}`,
      role: "assistant",
      content: `I understand you want the complete authentication system. Here's what I'll extract:

**Components:**
- Login form with email/password inputs
- Session persistence with JWT tokens
- Auto-refresh mechanism for expired tokens
- Logout functionality

**Dependencies:**
- \`jose\` for JWT handling
- \`react-hook-form\` for form state
- \`zod\` for validation

Would you like me to proceed with extracting these components?`,
      offset: 3000,
    },
  ];

  for (const msg of sampleMessages) {
    try {
      await db.insert(messages).values({
        id: msg.id,
        conversationId: conversationId,
        role: msg.role,
        content: msg.content,
        createdAt: new Date(now.getTime() + msg.offset),
      });
      console.log(`   ✓ Created message: ${msg.role} (${msg.id})`);
    } catch (error) {
      console.log(`   - Message may already exist: ${msg.id}`);
    }
  }

  console.log("\n✅ Seeding complete!");
  console.log(`   Conversation ID: ${conversationId}`);
  console.log(`   Messages: ${sampleMessages.length}`);

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
