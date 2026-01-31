import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * Sources table - stores analyzed codebases
 */
export const sources = sqliteTable("sources", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  techStack: text("tech_stack"), // JSON string array
  dependencies: text("dependencies"), // JSON string array
  components: text("components"), // JSON array of {name, description, filePath}
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;
