import { NextResponse } from "next/server";
import {
	getJob,
	deleteJob,
} from "@/app/partner/backwards/prototypes/jobs-queue/queue";

/**
 * GET /api/jobs/:id
 *
 * Get a single job by ID with full details.
 */
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;

	try {
		const job = await getJob(id);
		if (!job) {
			return NextResponse.json({ error: "Job not found" }, { status: 404 });
		}
		return NextResponse.json({ job });
	} catch (error) {
		console.error(`[API /jobs/${id}] GET error:`, error);
		return NextResponse.json(
			{ error: "Failed to fetch job" },
			{ status: 500 }
		);
	}
}

/**
 * DELETE /api/jobs/:id
 *
 * Delete a single job by ID.
 */
export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;

	try {
		const deleted = await deleteJob(id);
		if (!deleted) {
			return NextResponse.json({ error: "Job not found" }, { status: 404 });
		}
		return NextResponse.json({ success: true, deleted: id });
	} catch (error) {
		console.error(`[API /jobs/${id}] DELETE error:`, error);
		return NextResponse.json(
			{ error: "Failed to delete job" },
			{ status: 500 }
		);
	}
}
