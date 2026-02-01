"use server";

import { revalidatePath } from "next/cache";
import { cloneRepository } from "@/lib/git/cloner";
import { analyzeSource } from "@/lib/ai/analyser";
import { db, sources, eq, desc } from "@my-better-t-app/db";
import { readFile } from "fs/promises";

export async function getSources() {
  const data = await db.select().from(sources).orderBy(desc(sources.updatedAt));
  return data;
}

export async function getAnalysisContent(analysisPath: string | null) {
  if (!analysisPath) return null;
  try {
    return await readFile(analysisPath, "utf-8");
  } catch (e) {
    return null;
  }
}

export async function triggerClone(sourceId: string) {
  const result = await cloneRepository(sourceId);
  revalidatePath("/phase2");
  return result;
}

export async function triggerAnalysis(sourceId: string, targetComponent?: string) {
  const result = await analyzeSource(sourceId, targetComponent);
  revalidatePath("/phase2");
  return result;
}

export async function deleteSource(sourceId: string) {
  await db.delete(sources).where(eq(sources.id, sourceId));
  revalidatePath("/phase2");
}
