import { NextResponse } from "next/server";
import {
	enqueue,
	type ClaudeExtractionPayload,
} from "@/app/partner/backwards/prototypes/jobs-queue/queue";

function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.substring(0, 50);
}

function hashString(str: string): string {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return Math.abs(hash).toString(16);
}

/**
 * POST /api/jobs/enqueue
 *
 * Add a new claude_extraction job to the queue.
 * Body: { prompt, name?, originUrl?, idempotencyKey? }
 */
export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { prompt, name, branch, originUrl, idempotencyKey } = body as {
			prompt: string;
			name?: string;
			branch?: string;
			originUrl?: string;
			idempotencyKey?: string;
		};

		if (!prompt) {
			return NextResponse.json(
				{ error: "Missing required field: prompt" },
				{ status: 400 }
			);
		}

		const jobName =
			name || slugify(prompt.substring(0, 50)) + `-${Date.now()}`;
		const promptHash = hashString(prompt);

		const payload: ClaudeExtractionPayload = {
			type: "claude_extraction",
			name: jobName,
			prompt,
			branch: branch ?? null,
			targetPath: null,
			originUrl: originUrl ?? null,
			requirementId: null,
			promptHash,
		};

		const job = await enqueue(payload, {
			idempotencyKey: idempotencyKey ?? `enqueue-${promptHash}-${Date.now()}`,
		});

		return NextResponse.json({
			success: true,
			job: {
				id: job.id,
				name: jobName,
				status: job.status,
				createdAt: job.createdAt,
			},
		});
	} catch (error) {
		console.error("[API /jobs/enqueue] Error:", error);
		return NextResponse.json(
			{ error: "Failed to enqueue job" },
			{ status: 500 }
		);
	}
}
