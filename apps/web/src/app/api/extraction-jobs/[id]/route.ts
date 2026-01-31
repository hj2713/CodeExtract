/**
 * Single Extraction Job API
 * GET: Retrieve job details
 * PATCH: Update job status
 * DELETE: Delete a job
 */

import { NextResponse } from "next/server";
import { db, extractionJobs, eq } from "@my-better-t-app/db";

// GET: Get full job details by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [job] = await db
      .select()
      .from(extractionJobs)
      .where(eq(extractionJobs.id, id));

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Parse JSON fields
    const parsedJob = {
      ...job,
      dependencies: job.dependencies ? JSON.parse(job.dependencies) : [],
      keyRequirements: job.keyRequirements ? JSON.parse(job.keyRequirements) : [],
      relatedConversationIds: job.relatedConversationIds ? JSON.parse(job.relatedConversationIds) : [],
      metadata: job.metadata ? JSON.parse(job.metadata) : null,
    };

    return NextResponse.json(parsedJob);
  } catch (error) {
    console.error("Error fetching extraction job:", error);
    return NextResponse.json(
      { error: "Failed to fetch extraction job" },
      { status: 500 }
    );
  }
}

// PATCH: Update job status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const validStatuses = ["finalized", "locked"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const now = new Date().toISOString();

    await db
      .update(extractionJobs)
      .set({ status, updatedAt: now })
      .where(eq(extractionJobs.id, id));

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("Error updating extraction job:", error);
    return NextResponse.json(
      { error: "Failed to update extraction job" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a job
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if job exists and is not locked
    const [job] = await db
      .select()
      .from(extractionJobs)
      .where(eq(extractionJobs.id, id));

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status === "locked") {
      return NextResponse.json(
        { error: "Cannot delete a locked job" },
        { status: 400 }
      );
    }

    await db.delete(extractionJobs).where(eq(extractionJobs.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting extraction job:", error);
    return NextResponse.json(
      { error: "Failed to delete extraction job" },
      { status: 500 }
    );
  }
}
