import { NextRequest, NextResponse } from "next/server";
import { db, requirements } from "@my-better-t-app/db";
import { eq, desc } from "drizzle-orm";
import { v4 as uuid } from "uuid";

// GET /api/requirements?sourceId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get("sourceId");

    if (!sourceId) {
      return NextResponse.json(
        { error: "sourceId is required" },
        { status: 400 }
      );
    }

    const reqs = await db
      .select()
      .from(requirements)
      .where(eq(requirements.sourceId, sourceId))
      .orderBy(desc(requirements.createdAt));

    return NextResponse.json(reqs);
  } catch (error) {
    console.error("Error fetching requirements:", error);
    return NextResponse.json(
      { error: "Failed to fetch requirements" },
      { status: 500 }
    );
  }
}

// POST /api/requirements - Create a new requirement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sourceId,
      conversationId,
      requirement,
      context,
      title,
      relevantFiles,
      dependencies,
      chatSummary,
    } = body;

    if (!sourceId || !requirement) {
      return NextResponse.json(
        { error: "sourceId and requirement are required" },
        { status: 400 }
      );
    }

    const id = uuid();
    const now = new Date().toISOString();

    await db.insert(requirements).values({
      id,
      sourceId,
      conversationId: conversationId || null,
      requirement,
      context: context || null,
      title: title || null,
      status: "saved",
      relevantFiles: relevantFiles ? JSON.stringify(relevantFiles) : null,
      dependencies: dependencies ? JSON.stringify(dependencies) : null,
      chatSummary: chatSummary || null,
      createdAt: now,
      updatedAt: now,
    });

    const created = await db
      .select()
      .from(requirements)
      .where(eq(requirements.id, id));

    return NextResponse.json(created[0], { status: 201 });
  } catch (error) {
    console.error("Error creating requirement:", error);
    return NextResponse.json(
      { error: "Failed to create requirement" },
      { status: 500 }
    );
  }
}
