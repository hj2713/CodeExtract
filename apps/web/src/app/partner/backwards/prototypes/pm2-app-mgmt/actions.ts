"use server";

import {
  createApp as orchestratorCreateApp,
  listApps as orchestratorListApps,
  getApp as orchestratorGetApp,
  stopApp as orchestratorStopApp,
  restartApp as orchestratorRestartApp,
  deleteApp as orchestratorDeleteApp,
  getAppLogs as orchestratorGetAppLogs,
  getStats as orchestratorGetStats,
} from "./orchestrator";
import type { AppInfo, AppLogs, CreateAppOptions, DeleteAppOptions } from "./types";

export async function createApp(
  options: CreateAppOptions = {}
): Promise<{ success: true; app: AppInfo } | { success: false; error: string }> {
  try {
    const app = await orchestratorCreateApp(options);
    return { success: true, app };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function listApps(): Promise<
  { success: true; apps: AppInfo[] } | { success: false; error: string }
> {
  try {
    const apps = await orchestratorListApps();
    return { success: true, apps };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function getApp(
  id: string
): Promise<{ success: true; app: AppInfo | null } | { success: false; error: string }> {
  try {
    const app = await orchestratorGetApp(id);
    return { success: true, app };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function stopApp(
  id: string
): Promise<{ success: true; app: AppInfo } | { success: false; error: string }> {
  try {
    const app = await orchestratorStopApp(id);
    return { success: true, app };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function restartApp(
  id: string
): Promise<{ success: true; app: AppInfo } | { success: false; error: string }> {
  try {
    const app = await orchestratorRestartApp(id);
    return { success: true, app };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function deleteApp(
  id: string,
  options: DeleteAppOptions = { cleanup: true }
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await orchestratorDeleteApp(id, options);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function getAppLogs(
  id: string
): Promise<{ success: true; logs: AppLogs } | { success: false; error: string }> {
  try {
    const logs = await orchestratorGetAppLogs(id);
    return { success: true, logs };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function getStats(): Promise<
  | {
      success: true;
      stats: {
        total: number;
        online: number;
        stopped: number;
        errored: number;
        unknown: number;
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
