import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sources } from "./sources";

/**
 * Conversations table - stores chat sessions for each source
 */
export const conversations = sqliteTable("conversations", {
  id: text("id").primaryKey(),
  sourceId: text("source_id").references(() => sources.id),
  userId: text("user_id").notNull().default("default-user"), // For MVP, hardcoded
  title: text("title"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
