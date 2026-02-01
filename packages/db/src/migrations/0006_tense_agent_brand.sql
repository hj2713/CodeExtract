CREATE TABLE `requirements_archive` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`conversation_id` text,
	`requirement` text NOT NULL,
	`context` text,
	`title` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`relevant_files` text,
	`dependencies` text,
	`technical_specs` text,
	`implementation_notes` text,
	`images` text,
	`chat_summary` text,
	`priority` text DEFAULT '1',
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE TABLE `sources_archive` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'github_repo' NOT NULL,
	`origin_url` text,
	`local_path` text,
	`input_type` text DEFAULT 'github' NOT NULL,
	`visual_data` text,
	`vision_analysis` text,
	`github_metadata` text,
	`analysis_status` text DEFAULT 'pending' NOT NULL,
	`analysis_path` text,
	`analysis_markdown` text,
	`tech_stack` text,
	`dependencies` text,
	`components` text,
	`url` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `code_examples` (
	`id` text PRIMARY KEY NOT NULL,
	`requirement_id` text NOT NULL,
	`path` text NOT NULL,
	`port` integer NOT NULL,
	`review_status` text DEFAULT 'pending' NOT NULL,
	`rejection_reason` text,
	`rejection_notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`requirement_id`) REFERENCES `requirements`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `code_examples_requirement_id_idx` ON `code_examples` (`requirement_id`);--> statement-breakpoint
CREATE INDEX `code_examples_port_idx` ON `code_examples` (`port`);--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`payload` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`priority` integer DEFAULT 0,
	`attempts` integer DEFAULT 0,
	`max_attempts` integer DEFAULT 3,
	`last_error` text,
	`locked_by` text,
	`locked_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`claimed_at` text,
	`completed_at` text,
	`idempotency_key` text
);
--> statement-breakpoint
CREATE INDEX `jobs_status_priority_created_idx` ON `jobs` (`status`,`priority`,`created_at`);--> statement-breakpoint
CREATE INDEX `jobs_type_idempotency_idx` ON `jobs` (`type`,`idempotency_key`);--> statement-breakpoint
ALTER TABLE `requirements` ADD `job_id` text;