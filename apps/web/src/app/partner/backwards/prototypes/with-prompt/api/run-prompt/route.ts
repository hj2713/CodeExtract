import { query } from "@anthropic-ai/claude-agent-sdk";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { getAppDir, getPromptPath, getPrototypeDir } from "../../utils";

export async function POST(request: Request) {
	const { appName } = await request.json();

	const runId = `run_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
	const logs: unknown[] = [];

	try {
		// Read prompt.md content
		const promptContent = await readFile(getPromptPath(), "utf-8");

		// Set cwd to the created app directory
		const appDir = getAppDir(appName);

		// Ensure logs directory exists
		const logsDir = path.join(getPrototypeDir(), "logs");
		await mkdir(logsDir, { recursive: true });

		// Run Claude agent with cwd set to the app directory
		for await (const message of query({
			prompt: promptContent,
			options: {
				model: "claude-sonnet-4-5-20250929",
				maxTurns: 10,
				cwd: appDir, // Root agent in created app directory
				permissionMode: "acceptEdits",
				allowedTools: ["Write", "Read", "Glob", "Grep", "Edit"],
			},
		})) {
			logs.push({ timestamp: new Date().toISOString(), ...message });
		}

		// Save logs
		await writeFile(path.join(logsDir, `${runId}.json`), JSON.stringify(logs, null, 2));

		return Response.json({ success: true, runId, logs });
	} catch (error) {
		// Still save logs even on error
		logs.push({
			timestamp: new Date().toISOString(),
			type: "error",
			error: String(error),
		});

		try {
			const logsDir = path.join(getPrototypeDir(), "logs");
			await mkdir(logsDir, { recursive: true });
			await writeFile(path.join(logsDir, `${runId}.json`), JSON.stringify(logs, null, 2));
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
