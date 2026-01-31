/**
 * Lock All Jobs API
 * Locks all jobs for a source, preparing for next phase
 */

import { NextResponse } from "next/server";
import { db, extractionJobs, eq } from "@my-better-t-app/db";

export async function POST(request: Request) {
  try {
    const { sourceId, batchId } = await request.json();

    if (!sourceId) {
      return NextResponse.json(
        { error: "sourceId is required" },
        { status: 400 }
      );
    }

    // Get all finalized jobs for this source
    const jobs = await db
      .select()
      .from(extractionJobs)
      .where(eq(extractionJobs.sourceId, sourceId));

    const finalizedJobs = jobs.filter((job) => job.status === "finalized");

    if (finalizedJobs.length === 0) {
      return NextResponse.json(
        { error: "No finalized jobs to lock" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Lock all finalized jobs with batchId
    for (const job of finalizedJobs) {
      await db
        .update(extractionJobs)
        .set({ status: "locked", updatedAt: now, batchId: batchId || null })
        .where(eq(extractionJobs.id, job.id));
    }

    return NextResponse.json({
      success: true,
      lockedCount: finalizedJobs.length,
      message: `Locked ${finalizedJobs.length} job(s). Ready for next phase.`,
    });
  } catch (error) {
    console.error("Error locking jobs:", error);
    return NextResponse.json(
      { error: "Failed to lock jobs" },
      { status: 500 }
    );
  }
}
