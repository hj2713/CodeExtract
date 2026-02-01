#!/usr/bin/env bun

/**
 * Worker bootstrap script
 * Loads environment variables and sets correct working directory before importing worker
 *
 * Run from project root:
 *   bun run apps/web/src/app/partner/backwards/prototypes/jobs-queue/run-worker.ts
 */

import dotenv from "dotenv";
import path from "node:path";

// Get the apps/web directory (6 levels up from this file)
const appsWebDir = path.resolve(import.meta.dirname, "../../../../../..");

// Change to apps/web so relative DATABASE_URL works
process.chdir(appsWebDir);

// Load .env from apps/web
dotenv.config({ path: path.join(appsWebDir, ".env") });

console.log(`[BOOTSTRAP] Working directory: ${process.cwd()}`);
console.log(`[BOOTSTRAP] DATABASE_URL: ${process.env.DATABASE_URL}`);

// Now dynamically import and run the worker
const worker = await import("./worker-main.ts");
await worker.run();
