"use server";

import { readFile, writeFile } from "fs/promises";
import { join } from "path";

const MANIFEST_PATH = join(
  process.cwd(),
  "src/app/partner/backwards/prototypes/pm2-app-mgmt/manifest.json"
);

export type ReviewStatus = "pending" | "accepted" | "denied";

export interface CodeExample {
  id: string;
  name: string;
  port: number;
  status: "online" | "stopped" | "errored" | "launching" | "unknown";
  createdAt: string;
  reviewStatus: ReviewStatus;
}

interface ManifestApp {
  id: string;
  name: string;
  port: number;
  status: "online" | "stopped" | "errored" | "launching" | "unknown";
  createdAt: string;
  reviewStatus?: ReviewStatus;
}

interface Manifest {
  version: string;
  portRange: [number, number];
  apps: Record<string, ManifestApp>;
}

async function readManifest(): Promise<Manifest> {
  const content = await readFile(MANIFEST_PATH, "utf-8");
  return JSON.parse(content);
}

async function writeManifest(manifest: Manifest): Promise<void> {
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

export async function getPendingReviews(): Promise<{
  success: boolean;
  examples?: CodeExample[];
  error?: string;
}> {
  try {
    const manifest = await readManifest();
    const examples = Object.values(manifest.apps)
      .filter((app) => !app.reviewStatus || app.reviewStatus === "pending")
      .map((app) => ({
        id: app.id,
        name: app.name,
        port: app.port,
        status: app.status,
        createdAt: app.createdAt,
        reviewStatus: app.reviewStatus || ("pending" as const),
      }));

    return { success: true, examples };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function setReviewStatus(
  id: string,
  status: ReviewStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const manifest = await readManifest();
    if (!manifest.apps[id]) {
      return { success: false, error: "App not found" };
    }
    manifest.apps[id].reviewStatus = status;
    await writeManifest(manifest);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
