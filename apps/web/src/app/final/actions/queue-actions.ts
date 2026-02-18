'use server';

import { db, jobs, eq, desc } from '@my-better-t-app/db';

export type PendingJob = {
  id: string;
  name: string;
  type: string;
  prompt: string | null;
  status: 'pending' | 'claimed' | 'completed' | 'failed';
  priority: number;
  createdAt: string;
};

export async function getPendingJobs(): Promise<PendingJob[]> {
  const result = await db
    .select()
    .from(jobs)
    .where(eq(jobs.status, 'pending'))
    .orderBy(desc(jobs.priority), jobs.createdAt);

  return result.map((job) => {
    const payload = job.payload as { name?: string; prompt?: string } | null;
    const name = payload?.name ?? `Job ${job.id.slice(0, 8)}`;

    return {
      id: job.id,
      name,
      type: job.type,
      prompt: payload?.prompt ?? null,
      status: job.status as PendingJob['status'],
      priority: job.priority ?? 0,
      createdAt: job.createdAt,
    };
  });
}
