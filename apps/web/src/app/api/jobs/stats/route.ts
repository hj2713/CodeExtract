import { NextResponse } from "next/server";
import { getStats } from "@/app/partner/backwards/prototypes/jobs-queue/queue";

/**
 * GET /api/jobs/stats
 *
 * Returns aggregate counts by status.
 */
export async function GET() {
	try {
		const stats = await getStats();
		return NextResponse.json({ stats });
	} catch (error) {
		console.error("[API /jobs/stats] error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch stats" },
			{ status: 500 }
		);
	}
}
