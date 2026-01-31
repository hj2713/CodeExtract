import { spawn } from "child_process";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { SETUP_STEPS, type StepStatus, type CreatedApp } from "../../utils";

// Root directory for all created apps
const PROTOTYPE_DIR = path.resolve(
	process.cwd(),
	"src/app/partner/backwards/prototypes/nextjs-bash"
);
const ROOT_DIR = path.join(PROTOTYPE_DIR, "created-apps");
const APPS_JSON = path.join(PROTOTYPE_DIR, "apps.json");
const TEMPLATE_DIR = path.resolve(process.cwd(), "src/app/templates/fullstack");

async function getApps(): Promise<CreatedApp[]> {
	try {
		const content = await readFile(APPS_JSON, "utf-8");
		return JSON.parse(content);
	} catch {
		return [];
	}
}

async function saveApps(apps: CreatedApp[]): Promise<void> {
	await writeFile(APPS_JSON, JSON.stringify(apps, null, 2), "utf-8");
}

// Run a shell command with explicit cd
function runShellCommand(
	shellCommand: string,
	onOutput: (data: string) => void
): Promise<{ success: boolean; error?: string }> {
	return new Promise((resolve) => {
		onOutput(`$ ${shellCommand}\n`);

		const proc = spawn("bash", ["-c", shellCommand], {
			env: { ...process.env, CI: "true" },
		});

		let errorOutput = "";

		proc.stdout.on("data", (data) => {
			onOutput(data.toString());
		});

		proc.stderr.on("data", (data) => {
			const str = data.toString();
			errorOutput += str;
			onOutput(str);
		});

		proc.on("close", (code) => {
			if (code === 0) {
				resolve({ success: true });
			} else {
				resolve({ success: false, error: errorOutput || `Exit code: ${code}` });
			}
		});

		proc.on("error", (err) => {
			resolve({ success: false, error: err.message });
		});
	});
}

export async function POST(request: Request) {
	const { appName } = await request.json();
	const sanitizedName = appName.toLowerCase().replace(/[^a-z0-9-]/g, "-");

	const encoder = new TextEncoder();

	const stream = new ReadableStream({
		async start(controller) {
			const sendEvent = (event: string, data: object) => {
				controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
			};

			const sendLog = (stepId: string, log: string) => {
				controller.enqueue(encoder.encode(`event: log\ndata: ${JSON.stringify({ stepId, log })}\n\n`));
			};

			const app: CreatedApp = {
				id: crypto.randomUUID(),
				name: sanitizedName,
				createdAt: new Date().toISOString(),
				status: "creating",
				stepProgress: SETUP_STEPS.map((s) => ({
					stepId: s.id,
					status: "pending" as StepStatus,
				})),
			};

			try {
				// Save app entry first
				const apps = await getApps();
				apps.push(app);
				await saveApps(apps);

				sendEvent("init", { app });

				// Ensure root directory exists
				await mkdir(ROOT_DIR, { recursive: true });

				// Define paths
				const appDir = path.join(ROOT_DIR, sanitizedName);
				const appSrcDir = path.join(appDir, "src", "app");
				const sourceDir = path.join(appSrcDir, "source");
				const extractedDir = path.join(appSrcDir, "extracted");

				// Log paths for debugging
				sendLog("create-nextjs", `ROOT_DIR: ${ROOT_DIR}\n`);
				sendLog("create-nextjs", `appDir: ${appDir}\n`);
				sendLog("create-nextjs", `TEMPLATE_DIR: ${TEMPLATE_DIR}\n`);

				// Step 1: Create Next.js app
				sendEvent("step", { stepId: "create-nextjs", status: "running" });
				const step1Command = `cd "${ROOT_DIR}" && npx create-next-app@latest "${sanitizedName}" --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes`;
				const step1 = await runShellCommand(step1Command, (log) => sendLog("create-nextjs", log));
				if (!step1.success) {
					app.stepProgress![0] = { stepId: "create-nextjs", status: "error", error: step1.error };
					sendEvent("step", { stepId: "create-nextjs", status: "error", error: step1.error });
					throw new Error(step1.error);
				}
				app.stepProgress![0] = { stepId: "create-nextjs", status: "completed" };
				sendEvent("step", { stepId: "create-nextjs", status: "completed" });

				// Step 2: Create source and extracted folders inside src/app
				sendEvent("step", { stepId: "create-folders", status: "running" });
				const step2Command = `mkdir -p "${sourceDir}" "${extractedDir}"`;
				const step2 = await runShellCommand(step2Command, (log) => sendLog("create-folders", log));
				if (!step2.success) {
					app.stepProgress![1] = { stepId: "create-folders", status: "error", error: step2.error };
					sendEvent("step", { stepId: "create-folders", status: "error", error: step2.error });
					throw new Error(step2.error);
				}
				app.stepProgress![1] = { stepId: "create-folders", status: "completed" };
				sendEvent("step", { stepId: "create-folders", status: "completed" });

				// Step 3: Clone the repository into source folder
				sendEvent("step", { stepId: "clone-repo", status: "running" });
				const step3Command = `cd "${sourceDir}" && git clone https://github.com/darenhua/1000x-landing .`;
				const step3 = await runShellCommand(step3Command, (log) => sendLog("clone-repo", log));
				if (!step3.success) {
					app.stepProgress![2] = { stepId: "clone-repo", status: "error", error: step3.error };
					sendEvent("step", { stepId: "clone-repo", status: "error", error: step3.error });
					throw new Error(step3.error);
				}
				app.stepProgress![2] = { stepId: "clone-repo", status: "completed" };
				sendEvent("step", { stepId: "clone-repo", status: "completed" });

				// Step 4: Copy template files
				sendEvent("step", { stepId: "copy-templates", status: "running" });
				sendLog("copy-templates", `Template path: ${TEMPLATE_DIR}\n`);
				sendLog("copy-templates", `Destination: ${extractedDir}\n`);
				const step4Command = `cp -rv "${TEMPLATE_DIR}/"* "${extractedDir}/"`;
				const step4 = await runShellCommand(step4Command, (log) => sendLog("copy-templates", log));
				if (!step4.success) {
					app.stepProgress![3] = { stepId: "copy-templates", status: "error", error: step4.error };
					sendEvent("step", { stepId: "copy-templates", status: "error", error: step4.error });
					throw new Error(step4.error);
				}
				app.stepProgress![3] = { stepId: "copy-templates", status: "completed" };
				sendEvent("step", { stepId: "copy-templates", status: "completed" });

				// Mark as ready
				app.status = "ready";
				app.currentStep = undefined;
				const finalApps = await getApps();
				const appIndex = finalApps.findIndex((a) => a.id === app.id);
				if (appIndex !== -1) {
					finalApps[appIndex] = app;
					await saveApps(finalApps);
				}

				sendEvent("complete", { app });
			} catch (error) {
				app.status = "error";
				app.error = String(error);
				const apps = await getApps();
				const appIndex = apps.findIndex((a) => a.id === app.id);
				if (appIndex !== -1) {
					apps[appIndex] = app;
					await saveApps(apps);
				}
				sendEvent("error", { error: String(error), app });
			} finally {
				controller.close();
			}
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
		},
	});
}
