/**
 * API Route: Messages
 * GET /api/messages?conversationId=xxx - Get messages for a conversation
 * POST /api/messages - Add a message to a conversation
 */

import { NextResponse } from "next/server";
import { db, messages, conversations, eq, asc } from "@my-better-t-app/db";
import { randomUUID } from "crypto";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 }
      );
    }

    const result = await db.query.messages.findMany({
      where: eq(messages.conversationId, conversationId),
      orderBy: [asc(messages.createdAt)],
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { conversationId, role, content } = body;

    if (!conversationId || !role || !content) {
      return NextResponse.json(
        { error: "conversationId, role, and content are required" },
        { status: 400 }
      );
    }

    const id = randomUUID();
    const now = new Date();

    await db.insert(messages).values({
      id,
      conversationId,
      role,
      content,
      createdAt: now,
    });

    // Update conversation's updatedAt timestamp
    await db
      .update(conversations)
      .set({ updatedAt: now })
      .where(eq(conversations.id, conversationId));

    // Auto-generate title from first user message if needed
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
    });

    if (conversation && conversation.title === "New conversation" && role === "user") {
      const truncatedTitle = content.substring(0, 50) + (content.length > 50 ? "..." : "");
      await db
        .update(conversations)
        .set({ title: truncatedTitle })
        .where(eq(conversations.id, conversationId));
    }

    return NextResponse.json({ id, conversationId, role, content, createdAt: now }, { status: 201 });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}
