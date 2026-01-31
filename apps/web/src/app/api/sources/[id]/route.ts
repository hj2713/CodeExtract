/**
 * API Route: Get source by ID
 * GET /api/sources/[id]
 */

import { NextResponse } from "next/server";
import { db, sources, eq } from "@my-better-t-app/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const source = await db.query.sources.findFirst({
      where: eq(sources.id, id),
    });

    if (!source) {
      return NextResponse.json(
        { error: "Source not found" },
        { status: 404 }
      );
    }

    // Parse JSON fields
    return NextResponse.json({
      ...source,
      techStack: source.techStack ? JSON.parse(source.techStack) : [],
      dependencies: source.dependencies ? JSON.parse(source.dependencies) : [],
      components: source.components ? JSON.parse(source.components) : [],
    });
  } catch (error) {
    console.error("Error fetching source:", error);
    return NextResponse.json(
      { error: "Failed to fetch source" },
      { status: 500 }
    );
  }
}
