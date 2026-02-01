import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

// ============================================================================
// Sources Table - represents a codebase that can be extracted from
// ============================================================================

export const sources = sqliteTable("sources", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	
	// Phase 1 & 2: Origin & Storage
	type: text("type", { enum: ["github_repo", "local_directory", "ai_prototype"] }).notNull().default("github_repo"),
	originUrl: text("origin_url"), // The GitHub URL
	description: text("description"), // User-provided description of the codebase
	localPath: text("local_path"), // Where it's cloned locally
	
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

	// GitHub Metadata
	githubMetadata: text("github_metadata", { mode: "json" }).$type<{
		owner: string;
		repo: string;
		defaultBranch: string | null;
		description: string | null;
		stars: number | null;
		forks: number | null;
		fetchedAt?: string | null;
	} | null>(),

	// Analysis Process
	analysisStatus: text("analysis_status").notNull().default("pending"),
	analysisPath: text("analysis_path"), // Path to the generated ANALYSIS.md file
	analysisMarkdown: text("analysis_markdown"), // Content of ANALYSIS.md
	analysisConfirmed: integer("analysis_confirmed", { mode: "boolean" }).default(false),

	// Context (Populated by Analysis Agent)
	techStack: text("tech_stack", { mode: "json" }).$type<string[]>(),
	dependencies: text("dependencies", { mode: "json" }).$type<string[]>(),
	components: text("components", { mode: "json" }).$type<{
		name: string;
		description: string;
		filePath: string;
	}[]>(),

	url: text("url"), // Legacy/Optional
	createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Type inference helpers
export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;

// ============================================================================
// Jobs Table - unified job queue with outbox pattern
// ============================================================================

export const jobs = sqliteTable(
	"jobs",
	{
		id: text("id").primaryKey(),
		type: text("type").notNull(),
		payload: text("payload", { mode: "json" }).notNull(),
		status: text("status", {
			enum: ["pending", "claimed", "completed", "failed"],
		})
			.notNull()
			.default("pending"),
		priority: integer("priority").default(0),
		attempts: integer("attempts").default(0),
		maxAttempts: integer("max_attempts").default(3),
		lastError: text("last_error"),
		lockedBy: text("locked_by"),
		lockedAt: text("locked_at"),
		createdAt: text("created_at")
			.notNull()
			.default(sql`(datetime('now'))`),
		claimedAt: text("claimed_at"),
		completedAt: text("completed_at"),
		idempotencyKey: text("idempotency_key"),
	},
	(table) => [
		index("jobs_status_priority_created_idx").on(
			table.status,
			table.priority,
			table.createdAt
		),
		index("jobs_type_idempotency_idx").on(table.type, table.idempotencyKey),
	]
);

// Type inference helpers for jobs
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;

// ============================================================================
// Requirements Table - specific implementation patterns to extract from a source
// ============================================================================

export const requirements = sqliteTable("requirements", {
	id: text("id").primaryKey(),
	sourceId: text("source_id").notNull(),
	
	// Reference to the job processing this requirement (Phase 4 extraction)
	jobId: text("job_id"),
	
	// Reference to the conversation this requirement came from
	conversationId: text("conversation_id"),
	
	// The core requirement - DETAILED technical specification of what to extract
	requirement: text("requirement").notNull(),
	
	// Additional context gathered from the interview
	context: text("context"),
	
	// Title/name for this requirement (short summary)
	title: text("title"),
	
	// Status: draft (still chatting), saved (user clicked save), extracting (in phase 4), completed
	status: text("status").notNull().default("draft"),
	
	// JSON: Key files/components identified as relevant to this requirement
	relevantFiles: text("relevant_files"),
	
	// JSON: Dependencies needed for this requirement
	dependencies: text("dependencies"),
	
	// JSON: Detailed technical specifications for extraction phase
	technicalSpecs: text("technical_specs"),
	
	// Implementation notes, gotchas, patterns to follow
	implementationNotes: text("implementation_notes"),
	
	// JSON: Array of reference images for visual extraction
	images: text("images", { mode: "json" }).$type<Array<{
		base64: string;
		caption?: string;
		type?: "screenshot" | "reference" | "mockup";
		addedAt: string;
	}> | null>(),
	
	// Chat summary - AI-generated summary of the conversation leading to this requirement
	chatSummary: text("chat_summary"),
	
	// Priority order (for multiple requirements in same session)
	priority: text("priority").default("1"),
	
	// Timestamps
	createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
	updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// Type inference helpers for requirements
export type Requirement = typeof requirements.$inferSelect;
export type NewRequirement = typeof requirements.$inferInsert;

// ============================================================================
// Code Examples Table - generated code examples for requirements
// ============================================================================

export const codeExamples = sqliteTable(
	"code_examples",
	{
		id: text("id").primaryKey(),
		requirementId: text("requirement_id")
			.notNull()
			.references(() => requirements.id, { onDelete: "cascade" }),
		path: text("path").notNull(), // Directory containing the code files
		port: integer("port").notNull(), // Allocated port for preview
		reviewStatus: text("review_status", {
			enum: ["pending", "approved", "rejected"],
		})
			.notNull()
			.default("pending"),
		rejectionReason: text("rejection_reason", {
			enum: ["does_not_run", "incorrect", "not_minimal", "other"],
		}),
		rejectionNotes: text("rejection_notes"),
		createdAt: text("created_at")
			.notNull()
			.default(sql`(datetime('now'))`),
	},
	(table) => [
		index("code_examples_requirement_id_idx").on(table.requirementId),
		index("code_examples_port_idx").on(table.port), // For uniqueness checks
	]
);

// Type inference helpers for code examples
export type CodeExample = typeof codeExamples.$inferSelect;
export type NewCodeExample = typeof codeExamples.$inferInsert;

// ============================================================================
// NEW TABLES FROM MERGE - Conversations & Messages
// ============================================================================

/**
 * Conversations table - stores chat sessions for each source
 */
export const conversations = sqliteTable("conversations", {
	id: text("id").primaryKey(),
	sourceId: text("source_id").references(() => sources.id),
	userId: text("user_id").notNull().default("default-user"),
	title: text("title"),
	createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;

/**
 * Messages table - stores individual chat messages
 */
export const messages = sqliteTable("messages", {
	id: text("id").primaryKey(),
	conversationId: text("conversation_id").references(() => conversations.id),
	role: text("role").notNull(), // "user" | "assistant"
	content: text("content").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

/**
 * Extraction Jobs table - stores finalized extraction jobs with Gemini-extracted structured info
 * (Different purpose than the jobs queue table - this is for tracking extraction work)
 */
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

export type ExtractionJob = typeof extractionJobs.$inferSelect;
export type NewExtractionJob = typeof extractionJobs.$inferInsert;

// ============================================================================
// ARCHIVE TABLES - Preserving richer schemas from origin/main for reference
// ============================================================================

// Export archive tables
export * from "./archive";
