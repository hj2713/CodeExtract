// Types for code examples CRUD with pm2 management

import type { CodeExample } from "@my-better-t-app/db";

// Runtime status from pm2
export type RuntimeStatus = "online" | "stopped" | "errored" | "launching" | "unknown";

// Extended code example with runtime info from pm2
export interface CodeExampleWithRuntime extends CodeExample {
  // Runtime fields (from pm2, not stored in DB)
  pmId: number | null;
  pid: number;
  runtimeStatus: RuntimeStatus;
  memoryMB: number;
  cpuPercent: number;
  startedAt: number | null;
  restarts: number;
}

// Options for creating a new code example
export interface CreateCodeExampleOptions {
  requirementId: string;
  name?: string; // Optional name for the app directory
}

// Options for updating review status
export interface UpdateReviewOptions {
  reviewStatus: "pending" | "approved" | "rejected";
  rejectionReason?: "does_not_run" | "incorrect" | "not_minimal" | "other" | null;
  rejectionNotes?: string | null;
}

// Logs from pm2
export interface AppLogs {
  stdout: string;
  stderr: string;
}

// pm2 types (subset of what we need)
export interface PM2ProcessDescription {
  name?: string;
  pm_id?: number;
  pid?: number;
  monit?: {
    memory?: number;
    cpu?: number;
  };
  pm2_env?: {
    status?: string;
    pm_uptime?: number;
    restart_time?: number;
    PORT?: string;
    namespace?: string;
  };
}

export interface PM2StartOptions {
  script: string;
  args?: string;
  name: string;
  cwd: string;
  namespace: string;
  env: Record<string, string | number>;
  output?: string;
  error?: string;
  autorestart?: boolean;
  watch?: boolean;
  max_restarts?: number;
}

// Port range configuration
export const PORT_RANGE: [number, number] = [3200, 3299];
