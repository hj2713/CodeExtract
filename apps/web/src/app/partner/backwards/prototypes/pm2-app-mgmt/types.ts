// Types for the pm2 app orchestrator

export interface AppInfo {
  // Static (set at creation)
  id: string;
  name: string;
  category: string | null;
  directory: string;
  port: number;
  createdAt: string;

  // Runtime (written by sync)
  pmId: number | null;
  pid: number;
  status: "online" | "stopped" | "errored" | "launching" | "unknown";
  memoryMB: number;
  cpuPercent: number;
  startedAt: number | null;
  restarts: number;
}

export interface Manifest {
  version: string;
  portRange: [number, number];
  apps: Record<string, AppInfo>;
}

export interface CreateAppOptions {
  name?: string;
  category?: string;
}

export interface DeleteAppOptions {
  cleanup?: boolean;
}

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
    CATEGORY?: string;
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
