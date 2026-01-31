/**
 * API Route: Conversations
 * GET /api/conversations?sourceId=xxx - List conversations for a source
 * POST /api/conversations - Create new conversation
 */

import { NextResponse } from "next/server";
import { db, conversations, eq, desc } from "@my-better-t-app/db";
import { randomUUID } from "crypto";

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

    const result = await db.query.conversations.findMany({
      where: eq(conversations.sourceId, sourceId),
      orderBy: [desc(conversations.updatedAt)],
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sourceId, title } = body;

    if (!sourceId) {
      return NextResponse.json(
        { error: "sourceId is required" },
        { status: 400 }
      );
    }

    const id = randomUUID();
    const now = new Date();

    await db.insert(conversations).values({
      id,
      sourceId,
      userId: "default-user",
      title: title || "New conversation",
      createdAt: now,
      updatedAt: now,
    });

    const newConversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, id),
    });

    return NextResponse.json(newConversation, { status: 201 });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
