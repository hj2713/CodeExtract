CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text,
	`user_id` text DEFAULT 'default-user' NOT NULL,
	`title` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sources` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`tech_stack` text,
	`dependencies` text,
	`components` text,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE no action
);
