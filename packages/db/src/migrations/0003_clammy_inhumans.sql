ALTER TABLE `sources` ADD `input_type` text DEFAULT 'github' NOT NULL;--> statement-breakpoint
ALTER TABLE `sources` ADD `visual_data` text;--> statement-breakpoint
ALTER TABLE `sources` ADD `vision_analysis` text;