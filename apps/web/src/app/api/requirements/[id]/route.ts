import { NextRequest, NextResponse } from "next/server";
import { db, requirements } from "@my-better-t-app/db";
import { eq } from "drizzle-orm";

// PATCH /api/requirements/[id] - Update requirement status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, requirement, context, title } = body;

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (status) updateData.status = status;
    if (requirement) updateData.requirement = requirement;
    if (context) updateData.context = context;
    if (title) updateData.title = title;

    await db
      .update(requirements)
      .set(updateData)
      .where(eq(requirements.id, id));

    const updated = await db
      .select()
      .from(requirements)
      .where(eq(requirements.id, id));

    if (!updated[0]) {
      return NextResponse.json(
        { error: "Requirement not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating requirement:", error);
    return NextResponse.json(
      { error: "Failed to update requirement" },
      { status: 500 }
    );
  }
}

// DELETE /api/requirements/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.delete(requirements).where(eq(requirements.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting requirement:", error);
    return NextResponse.json(
      { error: "Failed to delete requirement" },
      { status: 500 }
    );
  }
}
