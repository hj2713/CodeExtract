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
CREATE TABLE `requirements` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`job_id` text,
	`requirement` text NOT NULL,
	`context` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `requirements_source_id_idx` ON `requirements` (`source_id`);--> statement-breakpoint
CREATE INDEX `requirements_job_id_idx` ON `requirements` (`job_id`);--> statement-breakpoint
CREATE TABLE `sources` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`path` text,
	`origin_url` text,
	`description` text NOT NULL,
	`analysis_path` text,
	`analysis_confirmed` integer DEFAULT false,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	`github_metadata` text
);
