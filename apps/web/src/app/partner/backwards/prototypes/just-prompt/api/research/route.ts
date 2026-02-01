import { query } from "@anthropic-ai/claude-agent-sdk";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const APP_DIR = path.resolve(
  process.cwd(),
  "src/app/partner/backwards/prototypes/just-prompt"
);

const LOGS_DIR = path.join(APP_DIR, "logs");
const OUTPUT_DIR = path.join(APP_DIR, "output");

export async function POST() {
  const runId = `run_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  const logs: unknown[] = [];

  try {
    // Ensure directories exist
    await mkdir(LOGS_DIR, { recursive: true });
    await mkdir(OUTPUT_DIR, { recursive: true });

    // Collect all messages from the agent
    for await (const message of query({
      prompt: `Write a research report about trees. Cover their biology, ecological importance, different types, and their role in climate change. Format it as markdown.

Save the report to: ${OUTPUT_DIR}/trees_report_${runId}.md`,
      options: {
        model: "claude-sonnet-4-5-20250929",
        maxTurns: 3,
        cwd: APP_DIR,
        permissionMode: "acceptEdits",
        allowedTools: ["Write", "Read"],
      },
    })) {
      // Log everything - system init, tool calls, assistant messages, metadata, etc.
      logs.push({
        timestamp: new Date().toISOString(),
        ...message,
      });
    }

    // Write logs to file
    const logFilePath = path.join(LOGS_DIR, `${runId}.json`);
    await writeFile(logFilePath, JSON.stringify(logs, null, 2), "utf-8");

    return Response.json({
      success: true,
      runId,
      logs,
    });
  } catch (error) {
    // Still save logs even on error
    logs.push({
      timestamp: new Date().toISOString(),
      type: "error",
      error: String(error),
    });

    try {
      const logFilePath = path.join(LOGS_DIR, `${runId}.json`);
      await writeFile(logFilePath, JSON.stringify(logs, null, 2), "utf-8");
    } catch {
      // Ignore file write errors
    }

    return Response.json({
      success: false,
      runId,
      error: String(error),
      logs,
    }, { status: 500 });
  }
}
