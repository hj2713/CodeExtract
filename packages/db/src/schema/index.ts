import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

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

export const requirements = sqliteTable(
	"requirements",
	{
		id: text("id").primaryKey(),
		sourceId: text("source_id")
			.notNull()
			.references(() => sources.id, { onDelete: "cascade" }),
		jobId: text("job_id").references(() => jobs.id, { onDelete: "set null" }),
		requirement: text("requirement").notNull(),
		context: text("context"),
		createdAt: text("created_at")
			.notNull()
			.default(sql`(datetime('now'))`),
	},
	(table) => [
		index("requirements_source_id_idx").on(table.sourceId),
		index("requirements_job_id_idx").on(table.jobId),
	]
);

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
