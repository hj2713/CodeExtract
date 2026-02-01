/**
 * Requirements Schema
 * Stores detailed extraction requirements from AI interview conversations
 * Each requirement represents a specific capability/pattern to extract from a source
 */

import { sql } from "drizzle-orm";
import { text, sqliteTable } from "drizzle-orm/sqlite-core";

export const requirements = sqliteTable("requirements", {
  id: text("id").primaryKey(),
  sourceId: text("source_id").notNull(),
  
  // Reference to the conversation this requirement came from
  conversationId: text("conversation_id"),
  
  // The core requirement - DETAILED technical specification of what to extract
  // This should contain comprehensive implementation details for rebuilding the component
  requirement: text("requirement").notNull(),
  
  // Additional context gathered from the interview
  // e.g., "User is building a slide editor and needs rectangles and text boxes only. 
  // Not interested in infinite canvas or collaboration features."
  context: text("context"),
  
  // Title/name for this requirement (short summary)
  title: text("title"),
  
  // Status: draft (still chatting), saved (user clicked save), extracting (in phase 4), completed
  status: text("status").notNull().default("draft"),
  
  // JSON: Key files/components identified as relevant to this requirement
  relevantFiles: text("relevant_files"), // ["src/shapes/Rectangle.tsx", "src/hooks/useSelection.ts"]
  
  // JSON: Dependencies needed for this requirement
  dependencies: text("dependencies"), // ["react", "framer-motion"]
  
  // JSON: Detailed technical specifications for extraction phase
  // Contains structured data: componentType, dataModels, apiEndpoints, stateManagement, uiComponents, styling, eventFlow
  technicalSpecs: text("technical_specs"),
  
  // Implementation notes, gotchas, patterns to follow
  implementationNotes: text("implementation_notes"),
  
  // JSON: Array of reference images for visual extraction
  // Each image object contains: { base64: string, caption?: string, addedAt: string }
  // Used when extracting from screenshots or when user attaches reference images during interview
  images: text("images", { mode: "json" }).$type<Array<{
    base64: string;           // Base64 encoded image data
    caption?: string;         // Optional description of what this image shows
    type?: "screenshot" | "reference" | "mockup";  // Type of image
    addedAt: string;          // ISO timestamp when image was added
  }> | null>(),
  
  // Chat summary - AI-generated summary of the conversation leading to this requirement
  chatSummary: text("chat_summary"),
  
  // Priority order (for multiple requirements in same session)
  priority: text("priority").default("1"),
  
  // Timestamps
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});
