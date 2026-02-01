import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import { db, codeExamples, requirements, type CodeExample, eq } from "@my-better-t-app/db";
import type {
  CodeExampleWithRuntime,
  CreateCodeExampleOptions,
  UpdateReviewOptions,
  AppLogs,
  PM2ProcessDescription,
  PM2StartOptions,
  RuntimeStatus,
  PORT_RANGE,
} from "./types";

const execAsync = promisify(exec);

// Constants
const NAMESPACE = "code-examples";

// Simple logger
async function log(message: string, data?: unknown): Promise<void> {
  const timestamp = new Date().toISOString();
  console.log(`[thing-crud] [${timestamp}]`, message, data || "");
}

// Get project root - in Next.js, process.cwd() returns the apps/web directory
function getProjectRoot(): string {
  return path.join(process.cwd(), "src/app/partner/backwards/prototypes/thing-crud");
}

const PROJECT_ROOT = getProjectRoot();
const CREATED_APPS_DIR = path.join(PROJECT_ROOT, "_created-apps");
const LOGS_DIR = path.join(PROJECT_ROOT, "logs");

// Port range for code examples (different from pm2-app-mgmt)
const PORT_MIN = 3200;
const PORT_MAX = 3299;

// Ensure directories exist
async function ensureDirectories(): Promise<void> {
  await fs.mkdir(CREATED_APPS_DIR, { recursive: true });
  await fs.mkdir(LOGS_DIR, { recursive: true });
}

// ============================================================================
// pm2 CLI Wrappers
// ============================================================================

async function pm2Command(cmd: string): Promise<string> {
  try {
    const { stdout } = await execAsync(`npx pm2 ${cmd}`, {
      cwd: PROJECT_ROOT,
    });
    return stdout;
  } catch (error: unknown) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    if (err.stdout) return err.stdout;
    throw new Error(`pm2 command failed: ${err.message || String(error)}`);
  }
}

async function pm2List(): Promise<PM2ProcessDescription[]> {
  try {
    const { stdout } = await execAsync("npx pm2 jlist", {
      cwd: PROJECT_ROOT,
    });

    const jsonStart = stdout.indexOf("[");
    if (jsonStart === -1) {
      await log("pm2List: no JSON array found in output");
      return [];
    }

    const jsonStr = stdout.slice(jsonStart);
    const processes = JSON.parse(jsonStr) as PM2ProcessDescription[];

    // Filter to our namespace
    const filtered = processes.filter(
      (p) => p.pm2_env?.namespace === NAMESPACE
    );
    await log("pm2List", { count: filtered.length });
    return filtered;
  } catch (error) {
    await log("pm2List error", { error: String(error) });
    return [];
  }
}

async function pm2Start(options: PM2StartOptions): Promise<void> {
  await log("pm2Start called", { options });

  const cmd = [
    "npx", "pm2", "start", options.script,
    "--name", options.name,
    "--namespace", NAMESPACE,
    "--cwd", options.cwd,
    "--output", options.output,
    "--error", options.error,
    "--no-autorestart",
    "--", options.args || "",
  ].join(" ");

  try {
    const env = {
      ...process.env,
      PORT: String(options.env.PORT),
    };

    const { stdout, stderr } = await execAsync(cmd, {
      cwd: PROJECT_ROOT,
      env,
    });

    await log("pm2 start success", { stdout, stderr });
  } catch (error: unknown) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    await log("pm2 start error", { message: err.message, stderr: err.stderr });
    throw new Error(`pm2 start failed: ${err.stderr || err.message}`);
  }
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

// Map pm2 status to our status enum
function mapPm2Status(pm2Status: string | undefined): RuntimeStatus {
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

// ============================================================================
// Port Allocation
// ============================================================================

async function allocatePort(): Promise<number> {
  // Get all used ports from the database
  const allExamples = await db.select({ port: codeExamples.port }).from(codeExamples);
  const usedPorts = new Set(allExamples.map((e) => e.port));

  for (let port = PORT_MIN; port <= PORT_MAX; port++) {
    if (!usedPorts.has(port)) {
      return port;
    }
  }

  throw new Error(
    `No available ports in range ${PORT_MIN}-${PORT_MAX}. Delete some code examples first.`
  );
}

// ============================================================================
// Sync Runtime State
// ============================================================================

async function enrichWithRuntime(
  examples: CodeExample[]
): Promise<CodeExampleWithRuntime[]> {
  const pm2Processes = await pm2List();

  // Build lookup map: port -> pm2 process
  const pm2ByPort = new Map<number, PM2ProcessDescription>();
  for (const proc of pm2Processes) {
    const portStr = proc.pm2_env?.PORT;
    if (portStr) {
      pm2ByPort.set(parseInt(portStr, 10), proc);
    }
  }

  return examples.map((example) => {
    const pm2Proc = pm2ByPort.get(example.port);

    if (pm2Proc) {
      return {
        ...example,
        pmId: pm2Proc.pm_id ?? null,
        pid: pm2Proc.pid ?? 0,
        runtimeStatus: mapPm2Status(pm2Proc.pm2_env?.status),
        memoryMB: Math.round((pm2Proc.monit?.memory ?? 0) / (1024 * 1024)),
        cpuPercent: pm2Proc.monit?.cpu ?? 0,
        startedAt: pm2Proc.pm2_env?.pm_uptime ?? null,
        restarts: pm2Proc.pm2_env?.restart_time ?? 0,
      };
    } else {
      return {
        ...example,
        pmId: null,
        pid: 0,
        runtimeStatus: "unknown" as RuntimeStatus,
        memoryMB: 0,
        cpuPercent: 0,
        startedAt: null,
        restarts: 0,
      };
    }
  });
}

// ============================================================================
// CRUD Operations
// ============================================================================

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

export async function createCodeExample(
  options: CreateCodeExampleOptions
): Promise<CodeExampleWithRuntime> {
  await ensureDirectories();

  // Verify requirement exists
  const [requirement] = await db
    .select()
    .from(requirements)
    .where(eq(requirements.id, options.requirementId));

  if (!requirement) {
    throw new Error(`Requirement not found: ${options.requirementId}`);
  }

  const id = generateId();
  const name = options.name || generateName();
  const port = await allocatePort();
  const directory = path.join(CREATED_APPS_DIR, id);
  const relativePath = `./_created-apps/${id}`;
  const pm2Name = `example-${id}`;

  // Scaffold the Next.js app
  try {
    await execAsync(
      `npx create-next-app@latest "${directory}" --yes --use-npm --ts --tailwind --eslint --app --src-dir --no-import-alias`,
      { cwd: PROJECT_ROOT, timeout: 120000 }
    );
  } catch (error) {
    // Clean up partial directory on failure
    try {
      await fs.rm(directory, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
    throw new Error(`Failed to scaffold app: ${error}`);
  }

  // Insert into database
  const [codeExample] = await db
    .insert(codeExamples)
    .values({
      id,
      requirementId: options.requirementId,
      path: relativePath,
      port,
      reviewStatus: "pending",
    })
    .returning();

  // Start the app with pm2
  const logOutput = path.join(LOGS_DIR, `${pm2Name}-out.log`);
  const logError = path.join(LOGS_DIR, `${pm2Name}-error.log`);

  try {
    await pm2Start({
      script: "npm",
      args: "run dev",
      name: pm2Name,
      cwd: directory,
      namespace: NAMESPACE,
      env: {
        PORT: port,
      },
      output: logOutput,
      error: logError,
      autorestart: false,
      watch: false,
      max_restarts: 0,
    });
  } catch (error) {
    console.error("Failed to start pm2 process:", error);
    // App is still in DB with unknown status
  }

  // Return with runtime state
  const [enriched] = await enrichWithRuntime([codeExample]);
  return enriched;
}

export async function listCodeExamples(): Promise<CodeExampleWithRuntime[]> {
  const examples = await db
    .select()
    .from(codeExamples)
    .orderBy(codeExamples.createdAt);

  return enrichWithRuntime(examples);
}

export async function getCodeExample(id: string): Promise<CodeExampleWithRuntime | null> {
  const [example] = await db
    .select()
    .from(codeExamples)
    .where(eq(codeExamples.id, id));

  if (!example) return null;

  const [enriched] = await enrichWithRuntime([example]);
  return enriched;
}

export async function updateReviewStatus(
  id: string,
  options: UpdateReviewOptions
): Promise<CodeExampleWithRuntime> {
  const [updated] = await db
    .update(codeExamples)
    .set({
      reviewStatus: options.reviewStatus,
      rejectionReason: options.rejectionReason ?? null,
      rejectionNotes: options.rejectionNotes ?? null,
    })
    .where(eq(codeExamples.id, id))
    .returning();

  if (!updated) {
    throw new Error(`Code example not found: ${id}`);
  }

  const [enriched] = await enrichWithRuntime([updated]);
  return enriched;
}

export async function stopCodeExample(id: string): Promise<CodeExampleWithRuntime> {
  const example = await getCodeExample(id);

  if (!example) {
    throw new Error(`Code example not found: ${id}`);
  }

  if (example.pmId === null || example.runtimeStatus === "unknown") {
    throw new Error(`Cannot stop: no pm2 process found`);
  }

  await pm2Stop(example.pmId);

  // Re-fetch to get updated state
  const updated = await getCodeExample(id);
  return updated!;
}

export async function restartCodeExample(id: string): Promise<CodeExampleWithRuntime> {
  await log("restartCodeExample called", { id });

  const example = await getCodeExample(id);

  if (!example) {
    throw new Error(`Code example not found: ${id}`);
  }

  const absoluteDir = path.resolve(PROJECT_ROOT, example.path);
  const pm2Name = `example-${id}`;
  const logOutput = path.join(LOGS_DIR, `${pm2Name}-out.log`);
  const logError = path.join(LOGS_DIR, `${pm2Name}-error.log`);

  // Check if directory exists
  try {
    await fs.access(absoluteDir);
  } catch {
    throw new Error(`App directory does not exist: ${absoluteDir}`);
  }

  if (example.pmId === null || example.runtimeStatus === "unknown") {
    // Re-register with pm2
    await pm2Start({
      script: "npm",
      args: "run dev",
      name: pm2Name,
      cwd: absoluteDir,
      namespace: NAMESPACE,
      env: {
        PORT: example.port,
      },
      output: logOutput,
      error: logError,
      autorestart: false,
      watch: false,
      max_restarts: 0,
    });
  } else {
    await pm2Restart(example.pmId);
  }

  // Re-fetch to get updated state
  const updated = await getCodeExample(id);
  return updated!;
}

export async function deleteCodeExample(id: string): Promise<void> {
  const example = await getCodeExample(id);

  if (!example) {
    throw new Error(`Code example not found: ${id}`);
  }

  // Stop pm2 process if running
  if (example.pmId !== null) {
    await pm2Delete(example.pmId);
  }

  // Clean up directory
  const absoluteDir = path.resolve(PROJECT_ROOT, example.path);
  if (absoluteDir.includes("/_created-apps/")) {
    try {
      await fs.rm(absoluteDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to delete directory ${absoluteDir}:`, error);
    }
  }

  // Remove from database
  await db.delete(codeExamples).where(eq(codeExamples.id, id));
}

export async function getCodeExampleLogs(id: string): Promise<AppLogs> {
  const example = await getCodeExample(id);

  if (!example) {
    throw new Error(`Code example not found: ${id}`);
  }

  const pm2Name = `example-${id}`;
  const outLogPath = path.join(LOGS_DIR, `${pm2Name}-out.log`);
  const errLogPath = path.join(LOGS_DIR, `${pm2Name}-error.log`);

  let stdout = "";
  let stderr = "";

  try {
    const outContent = await fs.readFile(outLogPath, "utf-8");
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

// ============================================================================
// Stats
// ============================================================================

export async function getStats(): Promise<{
  total: number;
  online: number;
  stopped: number;
  errored: number;
  unknown: number;
  pending: number;
  approved: number;
  rejected: number;
}> {
  const examples = await listCodeExamples();
  return {
    total: examples.length,
    online: examples.filter((e) => e.runtimeStatus === "online").length,
    stopped: examples.filter((e) => e.runtimeStatus === "stopped").length,
    errored: examples.filter((e) => e.runtimeStatus === "errored").length,
    unknown: examples.filter((e) => e.runtimeStatus === "unknown").length,
    pending: examples.filter((e) => e.reviewStatus === "pending").length,
    approved: examples.filter((e) => e.reviewStatus === "approved").length,
    rejected: examples.filter((e) => e.reviewStatus === "rejected").length,
  };
}

// ============================================================================
// Helpers for getting requirements (for dropdown in UI)
// ============================================================================

export async function getRequirementsList() {
  return db.select().from(requirements);
}
