import path from "path";

// Path constants - centralized for consistency
export const getPrototypeDir = () =>
	path.resolve(
		process.cwd(),
		"src/app/partner/backwards/prototypes/fetch-model-and-req"
	);

export const getAppsDir = () => path.join(getPrototypeDir(), "created-apps");

export const getTemplateDir = () =>
	path.resolve(process.cwd(), "src/app/templates/fullstack");

// App-specific paths
export const getAppDir = (appName: string) =>
	path.join(getAppsDir(), appName);

export const getAppSourceDir = (appName: string) =>
	path.join(getAppDir(appName), "src", "source");

export const getAppExtractedDir = (appName: string) =>
	path.join(getAppDir(appName), "src", "app", "extracted");

// Job progress tracking
export const getJobProgressDir = () =>
	path.join(getPrototypeDir(), "job-progress");

export const getJobProgressPath = (jobId: string) =>
	path.join(getJobProgressDir(), `${jobId}.json`);

// Logs directory
export const getLogsDir = () => path.join(getPrototypeDir(), "logs");

export const getLogPath = (runId: string) =>
	path.join(getLogsDir(), `${runId}.json`);

// Prompt template path
export const getPromptTemplatePath = () =>
	path.join(getPrototypeDir(), "prompt-template.md");
