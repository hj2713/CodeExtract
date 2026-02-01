CREATE TABLE `extraction_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`component_name` text NOT NULL,
	`file_path` text,
	`description` text,
	`status` text DEFAULT 'finalized' NOT NULL,
	`dependencies` text,
	`key_requirements` text,
	`mock_strategy` text DEFAULT 'fixture',
	`chat_summary` text,
	`related_conversation_ids` text,
	`user_notes` text,
	`metadata` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	`batch_id` text
);
--> statement-breakpoint
CREATE TABLE `requirements` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`conversation_id` text,
	`requirement` text NOT NULL,
	`context` text,
	`title` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`relevant_files` text,
	`dependencies` text,
	`chat_summary` text,
	`priority` text DEFAULT '1',
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
ALTER TABLE `sources` ADD `type` text DEFAULT 'github_repo' NOT NULL;--> statement-breakpoint
ALTER TABLE `sources` ADD `origin_url` text;--> statement-breakpoint
ALTER TABLE `sources` ADD `local_path` text;--> statement-breakpoint
ALTER TABLE `sources` ADD `github_metadata` text;--> statement-breakpoint
ALTER TABLE `sources` ADD `analysis_status` text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `sources` ADD `analysis_path` text;--> statement-breakpoint
ALTER TABLE `sources` ADD `analysis_markdown` text;--> statement-breakpoint
ALTER TABLE `sources` ADD `url` text;--> statement-breakpoint
ALTER TABLE `sources` ADD `updated_at` integer;