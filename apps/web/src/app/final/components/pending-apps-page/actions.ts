'use server';

import { db, codeExamples, requirements, eq } from '@my-better-t-app/db';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Base path for created-apps directory
const CREATED_APPS_BASE = path.join(
  process.cwd(),
  'src/app/partner/backwards/prototypes/fetch-model-and-req'
);

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface CodeExampleApp {
  id: string;
  name: string;
  description: string | null;
  path: string;
  port: number;
  createdAt: string;
  reviewStatus: ReviewStatus;
  requirementTitle: string | null;
  isStandaloneNextApp: boolean;
}

// Alias for backwards compatibility
export type ApprovedApp = CodeExampleApp;

/**
 * Fetches all approved code examples with their requirement data
 */
export async function getApprovedApps(): Promise<ApprovedApp[]> {
  const results = await db
    .select({
      id: codeExamples.id,
      path: codeExamples.path,
      port: codeExamples.port,
      createdAt: codeExamples.createdAt,
      requirementId: codeExamples.requirementId,
      requirementTitle: requirements.title,
      requirementDescription: requirements.requirement,
    })
    .from(codeExamples)
    .leftJoin(requirements, eq(codeExamples.requirementId, requirements.id))
    .where(eq(codeExamples.reviewStatus, 'approved'));

  return results.map((row) => {
    const fullPath = path.join(CREATED_APPS_BASE, row.path);
    const packageJsonPath = path.join(fullPath, 'package.json');
    const isStandaloneNextApp = existsSync(packageJsonPath);

    return {
      id: row.id,
      name: row.requirementTitle || deriveNameFromPath(row.path),
      description: row.requirementDescription,
      path: row.path,
      port: row.port,
      createdAt: row.createdAt,
      reviewStatus: 'approved' as ReviewStatus,
      requirementTitle: row.requirementTitle,
      isStandaloneNextApp,
    };
  });
}

/**
 * Fetches all pending code examples with their requirement data
 */
export async function getPendingApps(): Promise<CodeExampleApp[]> {
  const results = await db
    .select({
      id: codeExamples.id,
      path: codeExamples.path,
      port: codeExamples.port,
      createdAt: codeExamples.createdAt,
      requirementId: codeExamples.requirementId,
      requirementTitle: requirements.title,
      requirementDescription: requirements.requirement,
    })
    .from(codeExamples)
    .leftJoin(requirements, eq(codeExamples.requirementId, requirements.id))
    .where(eq(codeExamples.reviewStatus, 'pending'));

  return results.map((row) => {
    const fullPath = path.join(CREATED_APPS_BASE, row.path);
    const packageJsonPath = path.join(fullPath, 'package.json');
    const isStandaloneNextApp = existsSync(packageJsonPath);

    return {
      id: row.id,
      name: row.requirementTitle || deriveNameFromPath(row.path),
      description: row.requirementDescription,
      path: row.path,
      port: row.port,
      createdAt: row.createdAt,
      reviewStatus: 'pending' as ReviewStatus,
      requirementTitle: row.requirementTitle,
      isStandaloneNextApp,
    };
  });
}

/**
 * Derives a display name from the path if no title is available
 */
function deriveNameFromPath(pathStr: string): string {
  const segments = pathStr.split('/');
  const lastSegment = segments[segments.length - 1] || 'Untitled';
  return lastSegment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export interface ReadmeResult {
  success: boolean;
  content?: string;
  error?: string;
}

/**
 * Fetches README.md content from a code example's path
 */
export async function getReadmeContent(codeExamplePath: string): Promise<ReadmeResult> {
  if (!codeExamplePath) {
    return { success: false, error: 'No path provided' };
  }

  const readmePath = path.join(codeExamplePath, 'README.md');

  if (!existsSync(readmePath)) {
    return { success: false, error: 'No README.md found for this component' };
  }

  try {
    const content = await readFile(readmePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return {
      success: false,
      error: `Failed to read README: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

export interface ActionResult {
  success: boolean;
  error?: string;
}

/**
 * Approves a code example by updating its reviewStatus to 'approved'
 */
export async function approveApp(id: string): Promise<ActionResult> {
  if (!id) {
    return { success: false, error: 'No ID provided' };
  }

  try {
    await db
      .update(codeExamples)
      .set({ reviewStatus: 'approved' })
      .where(eq(codeExamples.id, id));

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Failed to approve: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
