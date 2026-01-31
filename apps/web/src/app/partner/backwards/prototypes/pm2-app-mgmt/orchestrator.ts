import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import type {
  AppInfo,
  AppLogs,
  CreateAppOptions,
  DeleteAppOptions,
  Manifest,
  PM2ProcessDescription,
  PM2StartOptions,
} from "./types";

const execAsync = promisify(exec);

// Constants
const NAMESPACE = "app-orchestrator";

// Get project root - in Next.js, process.cwd() returns the apps/web directory
// So we need to navigate from there to our pm2-app-mgmt directory
function getProjectRoot(): string {
  // This path is relative from apps/web (where Next.js runs)
  return path.join(process.cwd(), "src/app/partner/backwards/prototypes/pm2-app-mgmt");
}

const PROJECT_ROOT = getProjectRoot();
const MANIFEST_PATH = path.join(PROJECT_ROOT, "manifest.json");
const CREATED_APPS_DIR = path.join(PROJECT_ROOT, "created-apps");
const LOGS_DIR = path.join(PROJECT_ROOT, "logs");

// Ensure directories exist
async function ensureDirectories(): Promise<void> {
  await fs.mkdir(CREATED_APPS_DIR, { recursive: true });
  await fs.mkdir(LOGS_DIR, { recursive: true });
}

// pm2 wrapper - uses pm2 CLI commands since programmatic API requires daemon connection
async function pm2Command(cmd: string): Promise<string> {
  try {
    const { stdout } = await execAsync(`npx pm2 ${cmd}`, {
      cwd: PROJECT_ROOT,
    });
    return stdout;
  } catch (error: unknown) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    // pm2 sometimes exits with non-zero but still works
    if (err.stdout) return err.stdout;
    throw new Error(`pm2 command failed: ${err.message || String(error)}`);
  }
}

async function pm2List(): Promise<PM2ProcessDescription[]> {
  try {
    const { stdout } = await execAsync("npx pm2 jlist", {
      cwd: PROJECT_ROOT,
    });
    const processes = JSON.parse(stdout) as PM2ProcessDescription[];
    // Filter to our namespace
    return processes.filter(
      (p) => p.pm2_env?.namespace === NAMESPACE
    );
  } catch {
    return [];
  }
}

async function pm2Start(options: PM2StartOptions): Promise<void> {
  const envArgs = Object.entries(options.env)
    .map(([k, v]) => `${k}=${v}`)
    .join(" ");

  const cmd = [
    "start",
    `"${options.script}"`,
    "--name", `"${options.name}"`,
    "--namespace", NAMESPACE,
    "--cwd", `"${options.cwd}"`,
    "--output", `"${options.output}"`,
    "--error", `"${options.error}"`,
    "--no-autorestart",
    "--",
    options.args || "",
  ].join(" ");

  // Set environment and run
  await execAsync(`${envArgs} npx pm2 ${cmd}`, {
    cwd: PROJECT_ROOT,
    env: { ...process.env, ...options.env as Record<string, string> },
  });
}

async function pm2Stop(pmId: number): Promise<void> {
  await pm2Command(`stop ${pmId}`);
}

async function pm2Restart(pmId: number): Promise<void> {
  await pm2Command(`restart ${pmId}`);
}

async function pm2Delete(pmId: number): Promise<void> {
  try {
    await pm2Command(`delete ${pmId}`);
  } catch {
    // Ignore - process may already be gone
  }
}

// Manifest operations
async function readManifest(): Promise<Manifest> {
  try {
    const data = await fs.readFile(MANIFEST_PATH, "utf-8");
    return JSON.parse(data) as Manifest;
  } catch {
    // Return default manifest if file doesn't exist
    return {
      version: "1.0.0",
      portRange: [3100, 3199],
      apps: {},
    };
  }
}

async function writeManifest(manifest: Manifest): Promise<void> {
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf-8");
}

// Map pm2 status to our status enum
function mapPm2Status(pm2Status: string | undefined): AppInfo["status"] {
  switch (pm2Status) {
    case "online":
      return "online";
    case "stopped":
    case "stopping":
      return "stopped";
    case "errored":
    case "error":
      return "errored";
    case "launching":
      return "launching";
    default:
      return "unknown";
  }
}

// Sync function - bridges pm2 state to manifest
export async function sync(): Promise<Manifest> {
  const manifest = await readManifest();
  const pm2Processes = await pm2List();

  // Build lookup map: port -> pm2 process
  const pm2ByPort = new Map<number, PM2ProcessDescription>();
  for (const proc of pm2Processes) {
    const portStr = proc.pm2_env?.PORT;
    if (portStr) {
      pm2ByPort.set(parseInt(portStr, 10), proc);
    }
  }

  // Update each app in manifest with runtime data from pm2
  for (const appId of Object.keys(manifest.apps)) {
    const app = manifest.apps[appId];
    const pm2Proc = pm2ByPort.get(app.port);

    if (pm2Proc) {
      // Found matching pm2 process - update runtime fields
      app.pmId = pm2Proc.pm_id ?? null;
      app.pid = pm2Proc.pid ?? 0;
      app.status = mapPm2Status(pm2Proc.pm2_env?.status);
      app.memoryMB = Math.round((pm2Proc.monit?.memory ?? 0) / (1024 * 1024));
      app.cpuPercent = pm2Proc.monit?.cpu ?? 0;
      app.startedAt = pm2Proc.pm2_env?.pm_uptime ?? null;
      app.restarts = pm2Proc.pm2_env?.restart_time ?? 0;
    } else {
      // No pm2 process found - set to unknown
      app.status = "unknown";
      app.pid = 0;
      app.memoryMB = 0;
      app.cpuPercent = 0;
      // Preserve pmId as null since pm2 lost track
      app.pmId = null;
    }
  }

  await writeManifest(manifest);
  return manifest;
}

// Port allocation
async function allocatePort(): Promise<number> {
  const manifest = await readManifest();
  const [minPort, maxPort] = manifest.portRange;
  const usedPorts = new Set(
    Object.values(manifest.apps).map((app) => app.port)
  );

  for (let port = minPort; port <= maxPort; port++) {
    if (!usedPorts.has(port)) {
      return port;
    }
  }

  throw new Error(
    `No available ports in range ${minPort}-${maxPort}. Delete some apps first.`
  );
}

// Generate unique ID
function generateId(): string {
  return crypto.randomUUID().split("-")[0];
}

// Generate app name
function generateName(): string {
  const adjectives = ["swift", "bright", "cosmic", "stellar", "rapid", "noble", "vivid", "prime"];
  const nouns = ["falcon", "phoenix", "nexus", "pulse", "spark", "wave", "flux", "core"];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj}-${noun}`;
}

// Orchestrator API

export async function createApp(options: CreateAppOptions = {}): Promise<AppInfo> {
  await ensureDirectories();

  const id = generateId();
  const name = options.name || generateName();
  const category = options.category || null;
  const port = await allocatePort();
  const directory = `./created-apps/${id}`;
  const absoluteDir = path.join(PROJECT_ROOT, "created-apps", id);
  const pm2Name = `orch-${id}`;

  // Scaffold the Next.js app
  try {
    await execAsync(
      `npx create-next-app@latest "${absoluteDir}" --yes --use-npm --ts --tailwind --eslint --app --src-dir --no-import-alias`,
      { cwd: PROJECT_ROOT, timeout: 120000 }
    );
  } catch (error) {
    // Clean up partial directory on failure
    try {
      await fs.rm(absoluteDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
    throw new Error(`Failed to scaffold app: ${error}`);
  }

  // Create app entry
  const app: AppInfo = {
    id,
    name,
    category,
    directory,
    port,
    createdAt: new Date().toISOString(),
    pmId: null,
    pid: 0,
    status: "stopped",
    memoryMB: 0,
    cpuPercent: 0,
    startedAt: null,
    restarts: 0,
  };

  // Write to manifest
  const manifest = await readManifest();
  manifest.apps[id] = app;
  await writeManifest(manifest);

  // Start the app with pm2
  const logOutput = path.join(LOGS_DIR, `${pm2Name}-out.log`);
  const logError = path.join(LOGS_DIR, `${pm2Name}-error.log`);

  try {
    await pm2Start({
      script: "npm",
      args: "run dev",
      name: pm2Name,
      cwd: absoluteDir,
      namespace: NAMESPACE,
      env: {
        PORT: port,
        CATEGORY: category || "",
      },
      output: logOutput,
      error: logError,
      autorestart: false,
      watch: false,
      max_restarts: 0,
    });
  } catch (error) {
    console.error("Failed to start pm2 process:", error);
    // App is still in manifest with stopped status
  }

  // Sync to get runtime state
  const syncedManifest = await sync();
  return syncedManifest.apps[id];
}

export async function listApps(): Promise<AppInfo[]> {
  const manifest = await sync();
  return Object.values(manifest.apps).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getApp(id: string): Promise<AppInfo | null> {
  const manifest = await sync();
  return manifest.apps[id] || null;
}

export async function stopApp(id: string): Promise<AppInfo> {
  const manifest = await readManifest();
  const app = manifest.apps[id];

  if (!app) {
    throw new Error(`App not found: ${id}`);
  }

  if (app.pmId === null || app.status === "unknown") {
    throw new Error(`Cannot stop app: no pm2 process found`);
  }

  await pm2Stop(app.pmId);
  const syncedManifest = await sync();
  return syncedManifest.apps[id];
}

export async function restartApp(id: string): Promise<AppInfo> {
  const manifest = await readManifest();
  const app = manifest.apps[id];

  if (!app) {
    throw new Error(`App not found: ${id}`);
  }

  const absoluteDir = path.resolve(PROJECT_ROOT, app.directory);
  const pm2Name = `orch-${id}`;
  const logOutput = path.join(LOGS_DIR, `${pm2Name}-out.log`);
  const logError = path.join(LOGS_DIR, `${pm2Name}-error.log`);

  if (app.pmId === null || app.status === "unknown") {
    // Re-register with pm2
    await pm2Start({
      script: "npm",
      args: "run dev",
      name: pm2Name,
      cwd: absoluteDir,
      namespace: NAMESPACE,
      env: {
        PORT: app.port,
        CATEGORY: app.category || "",
      },
      output: logOutput,
      error: logError,
      autorestart: false,
      watch: false,
      max_restarts: 0,
    });
  } else {
    await pm2Restart(app.pmId);
  }

  const syncedManifest = await sync();
  return syncedManifest.apps[id];
}

export async function deleteApp(
  id: string,
  options: DeleteAppOptions = { cleanup: true }
): Promise<void> {
  const manifest = await readManifest();
  const app = manifest.apps[id];

  if (!app) {
    throw new Error(`App not found: ${id}`);
  }

  // Stop pm2 process if running
  if (app.pmId !== null) {
    await pm2Delete(app.pmId);
  }

  // Clean up directory
  if (options.cleanup) {
    const absoluteDir = path.resolve(PROJECT_ROOT, app.directory);
    // Safety check - only delete if it's in our created-apps directory
    if (absoluteDir.includes("/created-apps/")) {
      try {
        await fs.rm(absoluteDir, { recursive: true, force: true });
      } catch (error) {
        console.warn(`Failed to delete directory ${absoluteDir}:`, error);
      }
    }
  }

  // Remove from manifest
  delete manifest.apps[id];
  await writeManifest(manifest);
}

export async function getAppLogs(id: string): Promise<AppLogs> {
  const manifest = await readManifest();
  const app = manifest.apps[id];

  if (!app) {
    throw new Error(`App not found: ${id}`);
  }

  const pm2Name = `orch-${id}`;
  const outLogPath = path.join(LOGS_DIR, `${pm2Name}-out.log`);
  const errLogPath = path.join(LOGS_DIR, `${pm2Name}-error.log`);

  let stdout = "";
  let stderr = "";

  try {
    const outContent = await fs.readFile(outLogPath, "utf-8");
    // Get last 100 lines
    const lines = outContent.split("\n");
    stdout = lines.slice(-100).join("\n");
  } catch {
    stdout = "(no logs yet)";
  }

  try {
    const errContent = await fs.readFile(errLogPath, "utf-8");
    const lines = errContent.split("\n");
    stderr = lines.slice(-100).join("\n");
  } catch {
    stderr = "(no error logs)";
  }

  return { stdout, stderr };
}

// Utility to get app count and status summary
export async function getStats(): Promise<{
  total: number;
  online: number;
  stopped: number;
  errored: number;
  unknown: number;
}> {
  const apps = await listApps();
  return {
    total: apps.length,
    online: apps.filter((a) => a.status === "online").length,
    stopped: apps.filter((a) => a.status === "stopped").length,
    errored: apps.filter((a) => a.status === "errored").length,
    unknown: apps.filter((a) => a.status === "unknown").length,
  };
}
