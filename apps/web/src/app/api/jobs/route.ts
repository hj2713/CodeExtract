import { NextResponse } from "next/server";
import {
	getJobs,
	getStats,
	purgeCompleted,
} from "@/app/partner/backwards/prototypes/jobs-queue/queue";

/**
 * GET /api/jobs
 *
 * List jobs with optional filters.
 * Query params: status, type, limit, offset
 *
 * GET /api/jobs                         → all jobs (default limit 50)
 * GET /api/jobs?status=pending          → pending jobs (the "up next" queue)
 * GET /api/jobs?status=claimed          → currently being worked on
 * GET /api/jobs?status=completed        → finished jobs
 * GET /api/jobs?status=failed           → failed jobs
 * GET /api/jobs?type=claude_extraction  → filter by job type
 * GET /api/jobs?limit=10&offset=0       → pagination
 */
export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);

	const status = searchParams.get("status") as
		| "pending"
		| "claimed"
		| "completed"
		| "failed"
		| null;
	const type = searchParams.get("type");
	const limit = parseInt(searchParams.get("limit") ?? "50", 10);
	const offset = parseInt(searchParams.get("offset") ?? "0", 10);

	try {
		const jobsList = await getJobs({
			status: status ?? undefined,
			type: type ?? undefined,
			limit,
			offset,
		});

		return NextResponse.json({ jobs: jobsList, count: jobsList.length });
	} catch (error) {
		console.error("[API /jobs] GET error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch jobs" },
			{ status: 500 }
		);
	}
}

/**
 * DELETE /api/jobs
 *
 * Purge all completed jobs.
 */
export async function DELETE() {
	try {
		const purged = await purgeCompleted();
		return NextResponse.json({ success: true, purged });
	} catch (error) {
		console.error("[API /jobs] DELETE error:", error);
		return NextResponse.json(
			{ error: "Failed to purge jobs" },
			{ status: 500 }
		);
	}
}
