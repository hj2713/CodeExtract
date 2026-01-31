/**
 * Extraction Jobs API
 * Handles CRUD operations for extraction jobs
 */

import { NextResponse } from "next/server";
import { db, extractionJobs, eq, desc } from "@my-better-t-app/db";
import { randomUUID } from "crypto";

// GET: List all jobs for a source
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get("sourceId");

    if (!sourceId) {
      return NextResponse.json(
        { error: "sourceId is required" },
        { status: 400 }
      );
    }

    const jobs = await db
      .select()
      .from(extractionJobs)
      .where(eq(extractionJobs.sourceId, sourceId))
      .orderBy(desc(extractionJobs.createdAt));

    // Parse JSON fields
    const parsedJobs = jobs.map((job) => ({
      ...job,
      dependencies: job.dependencies ? JSON.parse(job.dependencies) : [],
      keyRequirements: job.keyRequirements ? JSON.parse(job.keyRequirements) : [],
      relatedConversationIds: job.relatedConversationIds ? JSON.parse(job.relatedConversationIds) : [],
      metadata: job.metadata ? JSON.parse(job.metadata) : null,
    }));

    return NextResponse.json(parsedJobs);
  } catch (error) {
    console.error("Error fetching extraction jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch extraction jobs" },
      { status: 500 }
    );
  }
}

// POST: Create a new extraction job
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      sourceId,
      componentName,
      filePath,
      description,
      dependencies,
      keyRequirements,
      mockStrategy,
      chatSummary,
      relatedConversationIds,
      userNotes,
      metadata,
    } = body;

    if (!sourceId || !componentName) {
      return NextResponse.json(
        { error: "sourceId and componentName are required" },
        { status: 400 }
      );
    }

    // Check for duplicate by component name
    const existingJobs = await db
      .select()
      .from(extractionJobs)
      .where(eq(extractionJobs.sourceId, sourceId));

    const duplicate = existingJobs.find(
      (job) => job.componentName.toLowerCase() === componentName.toLowerCase()
    );

    if (duplicate) {
      return NextResponse.json(
        { 
          error: "duplicate",
          message: `Job for "${componentName}" already exists. Delete it first to create a new one.`,
          existingJobId: duplicate.id
        },
        { status: 409 }
      );
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    await db.insert(extractionJobs).values({
      id,
      sourceId,
      componentName,
      filePath: filePath || null,
      description: description || null,
      status: "finalized",
      dependencies: dependencies ? JSON.stringify(dependencies) : null,
      keyRequirements: keyRequirements ? JSON.stringify(keyRequirements) : null,
      mockStrategy: mockStrategy || "fixture",
      chatSummary: chatSummary || null,
      relatedConversationIds: relatedConversationIds ? JSON.stringify(relatedConversationIds) : null,
      userNotes: userNotes || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      id,
      componentName,
      status: "finalized",
      createdAt: now,
    });
  } catch (error) {
    console.error("Error creating extraction job:", error);
    return NextResponse.json(
      { error: "Failed to create extraction job" },
      { status: 500 }
    );
  }
}
