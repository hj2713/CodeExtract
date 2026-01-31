
import { NextResponse } from "next/server";
import { db, conversations, messages, eq } from "@my-better-t-app/db";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      );
    }

    // First delete all messages associated with this conversation
    await db.delete(messages).where(eq(messages.conversationId, id));

    // Then delete the conversation itself
    const result = await db
      .delete(conversations)
      .where(eq(conversations.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    );
  }
}
