import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// ============================================================================
// Sources Table - represents a codebase that can be extracted from
// ============================================================================

export const sources = sqliteTable("sources", {
	id: text("id").primaryKey(),
	type: text("type", { enum: ["github_repo", "local_directory", "ai_prototype"] }).notNull(),
	path: text("path"), // Local filesystem path after cloning
	originUrl: text("origin_url"), // GitHub URL if applicable
	description: text("description").notNull(),
	analysisPath: text("analysis_path"), // Path to ANALYSIS.md if analysis completed
	analysisConfirmed: integer("analysis_confirmed", { mode: "boolean" }).default(false),
	createdAt: text("created_at")
		.notNull()
		.default(sql`(datetime('now'))`),
	updatedAt: text("updated_at")
		.notNull()
		.default(sql`(datetime('now'))`),
	// GitHub metadata stored as JSON (denormalized for simplicity)
	githubMetadata: text("github_metadata", { mode: "json" }).$type<{
		owner: string;
		repo: string;
		defaultBranch: string | null;
		description: string | null;
		stars: number | null;
		forks: number | null;
		fetchedAt: string | null;
	} | null>(),
});

// Type inference helpers
export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;
