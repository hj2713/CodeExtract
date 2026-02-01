import { query } from "@anthropic-ai/claude-agent-sdk";
import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";
import fs from "fs";

const CREATED_APPS_DIR = path.join(
  process.cwd(),
  "src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps"
);

export async function POST(request: Request) {
  const { componentId } = await request.json();

  if (!componentId) {
    return Response.json({ error: "componentId is required" }, { status: 400 });
  }

  const componentPath = path.join(CREATED_APPS_DIR, componentId);
  const extractedPath = path.join(componentPath, "src/app/extracted");
  const readmePath = path.join(extractedPath, "README.md");
  const logsDir = path.join(componentPath, "install-logs");

  // Verify component exists
  if (!fs.existsSync(componentPath)) {
    return Response.json({ error: "Component not found" }, { status: 404 });
  }

  // Verify README.md exists
  if (!fs.existsSync(readmePath)) {
    return Response.json(
      { error: "README.md not found in extracted folder" },
      { status: 404 }
    );
  }

  const runId = `install_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  const logs: unknown[] = [];

  try {
    // Ensure logs directory exists
    await mkdir(logsDir, { recursive: true });

    // Read the README.md content for context
    const readmeContent = await readFile(readmePath, "utf-8");

    // Use Claude Agents SDK to analyze README and install dependencies
    for await (const message of query({
      prompt: `You are a dependency installer assistant. Your task is to read a README.md file and install the required dependencies.

Here is the README.md content:
\`\`\`markdown
${readmeContent}
\`\`\`

Based on this README:
1. Identify the npm packages that need to be installed (look for the "Dependencies" section and any \`npm install\` or \`bun install\` commands)
2. Navigate to the component directory: ${componentPath}
3. Run the appropriate install command(s) to install the dependencies

If there are specific packages listed (like "npm install vaul clsx tailwind-merge"), run that command.
If no specific packages are listed but there's a package.json, just run "bun install" to install all dependencies.

IMPORTANT:
- Use "bun install" instead of "npm install" for faster installation
- Work in the component directory: ${componentPath}
- Report what you installed when done`,
      options: {
        model: "claude-sonnet-4-5-20250929",
        maxTurns: 5,
        cwd: componentPath,
        permissionMode: "acceptEdits",
        allowedTools: ["Bash", "Read", "Write"],
      },
    })) {
      logs.push({
        timestamp: new Date().toISOString(),
        ...message,
      });
    }

    // Write logs to file
    const logFilePath = path.join(logsDir, `${runId}.json`);
    await writeFile(logFilePath, JSON.stringify(logs, null, 2), "utf-8");

    return Response.json({
      success: true,
      runId,
      logs,
      componentId,
    });
  } catch (error) {
    // Still save logs even on error
    logs.push({
      timestamp: new Date().toISOString(),
      type: "error",
      error: String(error),
    });

    try {
      const logFilePath = path.join(logsDir, `${runId}.json`);
      await writeFile(logFilePath, JSON.stringify(logs, null, 2), "utf-8");
    } catch {
      // Ignore file write errors
    }

    return Response.json(
      {
        success: false,
        runId,
        error: String(error),
        logs,
      },
      { status: 500 }
    );
  }
}
