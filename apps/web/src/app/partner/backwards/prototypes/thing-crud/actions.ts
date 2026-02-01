"use server";

import {
  createCodeExample as orchestratorCreate,
  listCodeExamples as orchestratorList,
  getCodeExample as orchestratorGet,
  stopCodeExample as orchestratorStop,
  restartCodeExample as orchestratorRestart,
  deleteCodeExample as orchestratorDelete,
  getCodeExampleLogs as orchestratorGetLogs,
  updateReviewStatus as orchestratorUpdateReview,
  getStats as orchestratorGetStats,
  getRequirementsList as orchestratorGetRequirements,
} from "./orchestrator";
import type {
  CodeExampleWithRuntime,
  CreateCodeExampleOptions,
  UpdateReviewOptions,
  AppLogs,
} from "./types";
import type { Requirement } from "@my-better-t-app/db";

// ============================================================================
// Code Example CRUD Actions
// ============================================================================

export async function createCodeExample(
  options: CreateCodeExampleOptions
): Promise<{ success: true; example: CodeExampleWithRuntime } | { success: false; error: string }> {
  try {
    const example = await orchestratorCreate(options);
    return { success: true, example };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function listCodeExamples(): Promise<
  { success: true; examples: CodeExampleWithRuntime[] } | { success: false; error: string }
> {
  try {
    const examples = await orchestratorList();
    return { success: true, examples };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function getCodeExample(
  id: string
): Promise<{ success: true; example: CodeExampleWithRuntime | null } | { success: false; error: string }> {
  try {
    const example = await orchestratorGet(id);
    return { success: true, example };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function updateReviewStatus(
  id: string,
  options: UpdateReviewOptions
): Promise<{ success: true; example: CodeExampleWithRuntime } | { success: false; error: string }> {
  try {
    const example = await orchestratorUpdateReview(id, options);
    return { success: true, example };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// pm2 Control Actions
// ============================================================================

export async function stopCodeExample(
  id: string
): Promise<{ success: true; example: CodeExampleWithRuntime } | { success: false; error: string }> {
  try {
    const example = await orchestratorStop(id);
    return { success: true, example };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function restartCodeExample(
  id: string
): Promise<{ success: true; example: CodeExampleWithRuntime } | { success: false; error: string }> {
  console.log("[actions] restartCodeExample called for:", id);
  try {
    const example = await orchestratorRestart(id);
    console.log("[actions] restartCodeExample success:", example.runtimeStatus);
    return { success: true, example };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[actions] restartCodeExample error:", errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

export async function deleteCodeExample(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await orchestratorDelete(id);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function getCodeExampleLogs(
  id: string
): Promise<{ success: true; logs: AppLogs } | { success: false; error: string }> {
  try {
    const logs = await orchestratorGetLogs(id);
    return { success: true, logs };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// Stats & Helpers
// ============================================================================

export async function getStats(): Promise<
  | {
      success: true;
      stats: {
        total: number;
        online: number;
        stopped: number;
        errored: number;
        unknown: number;
        pending: number;
        approved: number;
        rejected: number;
      };
    }
  | { success: false; error: string }
> {
  try {
    const stats = await orchestratorGetStats();
    return { success: true, stats };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function getRequirements(): Promise<
  { success: true; requirements: Requirement[] } | { success: false; error: string }
> {
  try {
    const requirements = await orchestratorGetRequirements();
    return { success: true, requirements };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
