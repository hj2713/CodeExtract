/**
 * ARCHIVE TABLES
 * These tables preserve the richer schemas from origin/main that had additional fields.
 * Kept for reference and potential future migration.
 */

import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// ============================================================================
// Sources Archive - Their richer sources schema with vision analysis
// ============================================================================

export const sourcesArchive = sqliteTable("sources_archive", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),

	// Phase 1 & 2: Origin & Storage
	type: text("type", { enum: ["github_repo", "local_directory"] }).notNull().default("github_repo"),
	originUrl: text("origin_url"),
	localPath: text("local_path"),

	// Input type tracking (github, screenshot, live_url)
	inputType: text("input_type", { enum: ["github", "screenshot", "live_url"] }).notNull().default("github"),

	// Visual capture data (for screenshot and live_url sources)
	visualData: text("visual_data", { mode: "json" }).$type<{
		screenshotBase64?: string;
		allScreenshots?: string[];
		screenshotUrl?: string;
		capturedUrl?: string;
		capturedScreenshot?: string;
		capturedHtml?: string;
	} | null>(),

	// Vision analysis results (from Gemini/Claude)
	visionAnalysis: text("vision_analysis", { mode: "json" }).$type<{
		componentType: string;
		description: string;
		layout: {
			type: "flex" | "grid" | "absolute" | "block";
			direction?: string;
			alignment?: string;
			gap?: string;
		};
		colors: {
			primary: string;
			secondary?: string;
			background: string;
			text: string;
			accent?: string;
		};
		typography: {
			fontFamily: string;
			heading?: { size: string; weight: string };
			body?: { size: string; weight: string };
		};
		spacing: {
			padding?: string;
			margin?: string;
			gap?: string;
		};
		borders?: {
			width?: string;
			color?: string;
			radius?: string;
		};
		shadows?: string;
		interactions: Array<{
			trigger: "hover" | "click" | "focus";
			effect: string;
			timing?: string;
		}>;
		animations: Array<{
			element: string;
			type: string;
			duration: string;
		}>;
		responsive: {
			mobile?: string;
			tablet?: string;
			desktop?: string;
		};
		accessibility: {
			ariaLabels?: string[];
			keyboardNav?: string;
		};
		assets: Array<{
			type: "icon" | "image" | "illustration" | "logo";
			description: string;
			fallback?: string;
		}>;
	} | null>(),

	// Phase 2: Metadata
	githubMetadata: text("github_metadata", { mode: "json" }).$type<{
		owner: string;
		repo: string;
		defaultBranch: string | null;
		description: string | null;
		stars: number | null;
		forks: number | null;
	} | null>(),

	// Phase 2: Analysis Process
	analysisStatus: text("analysis_status").notNull().default("pending"),
	analysisPath: text("analysis_path"),
	analysisMarkdown: text("analysis_markdown"),

	// Phase 3: Context (Populated by Analysis Agent)
	techStack: text("tech_stack", { mode: "json" }).$type<string[]>(),
	dependencies: text("dependencies", { mode: "json" }).$type<string[]>(),
	components: text("components", { mode: "json" }).$type<{
		name: string;
		description: string;
		filePath: string;
	}[]>(),

	url: text("url"),
	createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type SourceArchive = typeof sourcesArchive.$inferSelect;
export type NewSourceArchive = typeof sourcesArchive.$inferInsert;

// ============================================================================
// Requirements Archive - Their richer requirements schema with conversation links
// ============================================================================

export const requirementsArchive = sqliteTable("requirements_archive", {
	id: text("id").primaryKey(),
	sourceId: text("source_id").notNull(),

	// Reference to the conversation this requirement came from
	conversationId: text("conversation_id"),

	// The core requirement
	requirement: text("requirement").notNull(),

	// Additional context gathered from the interview
	context: text("context"),

	// Title/name for this requirement
	title: text("title"),

	// Status: draft, saved, extracting, completed
	status: text("status").notNull().default("draft"),

	// JSON: Key files/components identified as relevant
	relevantFiles: text("relevant_files"),

	// JSON: Dependencies needed
	dependencies: text("dependencies"),

	// JSON: Detailed technical specifications
	technicalSpecs: text("technical_specs"),

	// Implementation notes
	implementationNotes: text("implementation_notes"),

	// JSON: Array of reference images for visual extraction
	images: text("images", { mode: "json" }).$type<Array<{
		base64: string;
		caption?: string;
		type?: "screenshot" | "reference" | "mockup";
		addedAt: string;
	}> | null>(),

	// Chat summary
	chatSummary: text("chat_summary"),

	// Priority order
	priority: text("priority").default("1"),

	// Timestamps
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export type RequirementArchive = typeof requirementsArchive.$inferSelect;
export type NewRequirementArchive = typeof requirementsArchive.$inferInsert;
