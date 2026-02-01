import { simpleGit } from "simple-git";
import path from "path";
import fs from "fs/promises";
import { db, sources, eq } from "@my-better-t-app/db";

const CLONE_ROOT = path.join(process.cwd(), ".sources");

export async function cloneRepository(sourceId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const source = await db.query.sources.findFirst({
      where: eq(sources.id, sourceId),
    });

    if (!source || !source.originUrl) {
      return { success: false, error: "Invalid source or missing origin URL" };
    }

    if (source.analysisStatus === "cloning" || source.analysisStatus === "completed") {
      return { success: true }; // Already processing or done
    }

    // Update status to cloning
    await db.update(sources).set({ analysisStatus: "cloning" }).where(eq(sources.id, sourceId));

    const repoName = source.originUrl.split("/").pop()?.replace(".git", "") || sourceId;
    const targetDir = path.join(CLONE_ROOT, sourceId, repoName);
    
    // Ensure parent dir exists
    await fs.mkdir(path.join(CLONE_ROOT, sourceId), { recursive: true });

    // Clean if potentially exists (retry logic)
    try {
      await fs.rm(targetDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }

    // Perform Clone
    await simpleGit().clone(source.originUrl, targetDir);

    // Update DB with success state
    await db.update(sources).set({ 
      localPath: targetDir,
      analysisStatus: "analyzing" // Ready for next step
    }).where(eq(sources.id, sourceId));

    return { success: true };

  } catch (error) {
    console.error("Clone failed:", error);
    await db.update(sources).set({ analysisStatus: "failed" }).where(eq(sources.id, sourceId));
    return { success: false, error: String(error) };
  }
}
