/**
 * Extraction Jobs Schema
 * Stores finalized extraction jobs with Gemini-extracted structured info
 */

import { sql } from "drizzle-orm";
import { text, sqliteTable } from "drizzle-orm/sqlite-core";

export const extractionJobs = sqliteTable("extraction_jobs", {
  id: text("id").primaryKey(),
  sourceId: text("source_id").notNull(),
  
  // Component identification
  componentName: text("component_name").notNull(),
  filePath: text("file_path"),
  description: text("description"),
  
  // Status: finalized, locked
  status: text("status").notNull().default("finalized"),
  
  // JSON: Dependencies array
  dependencies: text("dependencies"), // ["react", "openai"]
  
  // JSON: Key requirements extracted from chat
  keyRequirements: text("key_requirements"), // ["streaming", "typing indicator"]
  
  // Mock strategy: fixture, api, none
  mockStrategy: text("mock_strategy").default("fixture"),
  
  // Textual summary of the conversation
  chatSummary: text("chat_summary"),
  
  // JSON: Related conversation IDs that contributed to this job
  relatedConversationIds: text("related_conversation_ids"), // ["conv-1", "conv-2"]
  
  // Optional user notes
  userNotes: text("user_notes"),
  
  // JSON: Source metadata (tech stack, global deps)
  metadata: text("metadata"),
  
  // Timestamps
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
  
  // Batch identifier (timestamp when moved to next phase)
  batchId: text("batch_id"),
});
