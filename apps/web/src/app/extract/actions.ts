"use server";

import { revalidatePath } from "next/cache";
import { cloneRepository } from "@/lib/git/cloner";
import { analyzeSource } from "@/lib/ai/analyser";
import { db, sources, conversations, requirements, eq, desc } from "@my-better-t-app/db";
import { readFile } from "fs/promises";
import { randomUUID } from "crypto";

// Get or create source from GitHub URL
export async function getOrCreateSource(githubUrl: string) {
  console.log("[getOrCreateSource] Called with:", githubUrl);
  
  // Check if source already exists
  const existing = await db
    .select()
    .from(sources)
    .where(eq(sources.originUrl, githubUrl));

  console.log("[getOrCreateSource] Existing sources found:", existing.length);

  if (existing.length > 0) {
    console.log("[getOrCreateSource] Returning existing source:", existing[0].id);
    return existing[0];
  }

  // Create new source
  const id = randomUUID();
  const name = githubUrl.split("/").slice(-2).join("/"); // owner/repo

  console.log("[getOrCreateSource] Creating new source with id:", id, "name:", name);

  await db.insert(sources).values({
    id,
    name,
    type: "github_repo",
    originUrl: githubUrl,
    analysisStatus: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const created = await db.select().from(sources).where(eq(sources.id, id));
  console.log("[getOrCreateSource] Created source:", created[0]?.id);
  return created[0];
}

// Get source by ID
export async function getSource(sourceId: string) {
  const result = await db.select().from(sources).where(eq(sources.id, sourceId));
  return result[0] || null;
}

// Clone and analyze repository
export async function cloneAndAnalyze(sourceId: string) {
  // First clone
  const cloneResult = await cloneRepository(sourceId);
  if (!cloneResult.success) {
    return { success: false, error: cloneResult.error };
  }

  // Then analyze
  const analyzeResult = await analyzeSource(sourceId);
  if (!analyzeResult.success) {
    return { success: false, error: analyzeResult.error };
  }

  revalidatePath("/extract");
  return { success: true };
}

// Get analysis content
export async function getAnalysisContent(analysisPath: string | null) {
  if (!analysisPath) return null;
  try {
    return await readFile(analysisPath, "utf-8");
  } catch {
    return null;
  }
}

// Get or create conversation for source
export async function getOrCreateConversation(sourceId: string) {
  // Check for existing conversation
  const existing = await db
    .select()
    .from(conversations)
    .where(eq(conversations.sourceId, sourceId))
    .orderBy(desc(conversations.updatedAt));

  if (existing.length > 0) {
    return existing[0];
  }

  // Create new conversation
  const id = randomUUID();
  await db.insert(conversations).values({
    id,
    sourceId,
    title: "Requirements Interview",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const created = await db.select().from(conversations).where(eq(conversations.id, id));
  return created[0];
}

// Get requirements for source
export async function getRequirements(sourceId: string) {
  const reqs = await db
    .select()
    .from(requirements)
    .where(eq(requirements.sourceId, sourceId))
    .orderBy(desc(requirements.createdAt));
  return reqs;
}

// Save requirement with detailed technical specifications
export async function saveRequirement(data: {
  sourceId: string;
  conversationId?: string;
  title: string;
  requirement: string;
  context?: string;
  relevantFiles?: string[];
  dependencies?: string[];
  technicalSpecs?: object;
  implementationNotes?: string;
  chatSummary?: string;
  images?: Array<{
    base64: string;
    caption?: string;
    type?: "screenshot" | "reference" | "mockup";
    addedAt: string;
  }>;
}) {
  const id = randomUUID();
  const now = new Date().toISOString();

  await db.insert(requirements).values({
    id,
    sourceId: data.sourceId,
    conversationId: data.conversationId || null,
    title: data.title,
    requirement: data.requirement,
    context: data.context || null,
    status: "saved",
    relevantFiles: data.relevantFiles ? JSON.stringify(data.relevantFiles) : null,
    dependencies: data.dependencies ? JSON.stringify(data.dependencies) : null,
    technicalSpecs: data.technicalSpecs ? JSON.stringify(data.technicalSpecs) : null,
    implementationNotes: data.implementationNotes || null,
    chatSummary: data.chatSummary || null,
    images: data.images || null,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/extract");
  
  const created = await db.select().from(requirements).where(eq(requirements.id, id));
  return created[0];
}

// Start extraction (move to phase 4)
export async function startExtraction(requirementId: string) {
  await db
    .update(requirements)
    .set({ 
      status: "extracting",
      updatedAt: new Date().toISOString(),
    })
    .where(eq(requirements.id, requirementId));

  revalidatePath("/extract");
  return { success: true };
}

// Delete requirement
export async function deleteRequirement(requirementId: string) {
  await db.delete(requirements).where(eq(requirements.id, requirementId));
  revalidatePath("/extract");
}
