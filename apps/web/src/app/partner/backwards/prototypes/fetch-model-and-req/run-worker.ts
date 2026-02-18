#!/usr/bin/env bun

/**
 * Worker bootstrap script
 *
 * Sets cwd to the monorepo root, loads env, then starts the polling worker.
 *
 * Run from anywhere:
 *   bun run apps/web/src/app/partner/backwards/prototypes/fetch-model-and-req/run-worker.ts
 */

import dotenv from "dotenv";
import path from "node:path";

// apps/web directory (6 levels up from this file)
const appsWebDir = path.resolve(import.meta.dirname, "../../../../../..");

// Project root (2 more levels up from apps/web)
const projectRoot = path.resolve(appsWebDir, "../..");

// Load .env from apps/web (has DATABASE_URL, API keys, etc.)
dotenv.config({ path: path.join(appsWebDir, ".env") });

// The DATABASE_URL is relative to apps/web, so we need to resolve it
// before changing cwd to the project root.
const rawDbUrl = process.env.DATABASE_URL ?? "";
if (rawDbUrl.startsWith("file:")) {
	const relativePath = rawDbUrl.replace("file:", "");
	const absolutePath = path.resolve(appsWebDir, relativePath);
	process.env.DATABASE_URL = `file:${absolutePath}`;
}

// Set cwd to project root — Claude SDK will operate here
process.chdir(projectRoot);

console.log(`[BOOTSTRAP] Project root (cwd): ${process.cwd()}`);
console.log(`[BOOTSTRAP] DATABASE_URL: ${process.env.DATABASE_URL}`);

// Start the worker
const worker = await import("./worker-main");
await worker.run();
