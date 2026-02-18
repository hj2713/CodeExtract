"use server";

import { db, jobs } from "@my-better-t-app/db";
import { getStats } from "@/app/partner/backwards/prototypes/jobs-queue/queue";
import type { JobStats } from "@/app/partner/backwards/prototypes/jobs-queue/queue";

export async function fetchQueueStats(): Promise<{
  success: boolean;
  stats?: JobStats;
  error?: string;
}> {
  try {
    const stats = await getStats();
    return { success: true, stats };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function clearQueue(): Promise<{
  success: boolean;
  count?: number;
  error?: string;
}> {
  try {
    const result = await db.delete(jobs).returning();
    return { success: true, count: result.length };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
