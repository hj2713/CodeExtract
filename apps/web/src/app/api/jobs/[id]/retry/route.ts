import { NextResponse } from "next/server";
import { retryJob } from "@/app/partner/backwards/prototypes/jobs-queue/queue";

/**
 * POST /api/jobs/:id/retry
 *
 * Reset a failed/completed job back to pending so the worker picks it up again.
 */
export async function POST(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;

	try {
		const job = await retryJob(id);
		if (!job) {
			return NextResponse.json({ error: "Job not found" }, { status: 404 });
		}
		return NextResponse.json({ success: true, job });
	} catch (error) {
		console.error(`[API /jobs/${id}/retry] error:`, error);
		return NextResponse.json(
			{ error: "Failed to retry job" },
			{ status: 500 }
		);
	}
}
