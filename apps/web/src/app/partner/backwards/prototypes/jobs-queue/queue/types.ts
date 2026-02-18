import type { Job } from "@my-better-t-app/db";

// ============================================================================
// Job Payload Types - discriminated union for type-safe payloads
// ============================================================================

export type ClaudeExtractionPayload = {
	type: "claude_extraction";
	name: string;
	prompt: string;
	branch: string | null;
	targetPath: string | null;
	originUrl: string | null;
	requirementId: string | null;
	promptHash: string;
};

export type CreateFilePayload = {
	type: "create_file";
	path: string;
	content: string;
	overwrite?: boolean;
};

export type DeleteFilePayload = {
	type: "delete_file";
	path: string;
	requireExists?: boolean;
};

export type SyncAwsPayload = {
	type: "sync_aws";
	resourceType: string;
	resourceId: string;
	config: Record<string, unknown>;
};

export type EchoPayload = {
	type: "echo";
	message: string;
};

export type JobPayload =
	| ClaudeExtractionPayload
	| CreateFilePayload
	| DeleteFilePayload
	| SyncAwsPayload
	| EchoPayload;

export type JobType = JobPayload["type"];

// ============================================================================
// Queue Operation Types
// ============================================================================

export type EnqueueOptions = {
	priority?: number;
	maxAttempts?: number;
	idempotencyKey?: string;
};

export type ClaimResult = {
	job: Job;
	payload: JobPayload;
} | null;

export type JobStats = {
	pending: number;
	claimed: number;
	completed: number;
	failed: number;
	total: number;
};

export type JobFilter = {
	status?: Job["status"];
	type?: string;
	limit?: number;
	offset?: number;
};
