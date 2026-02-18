"use server";

import fs from "fs/promises";
import path from "path";
import type { FileSystemEntry, FetchDirectoryResult, FetchFileContentResult } from "./filesystem-types";

// Base path for created-apps directory (must match actions.ts)
const CREATED_APPS_BASE = path.join(
  process.cwd(),
  'src/app/partner/backwards/prototypes/fetch-model-and-req'
);

/**
 * Fetch directory contents from local filesystem
 * @param basePath - The relative path of the code example (codeExample.path, e.g., "created-apps/app-grid")
 * @param relativePath - Path relative to basePath (empty string for root)
 */
export async function fetchDirectoryContents(
  basePath: string,
  relativePath: string = ""
): Promise<FetchDirectoryResult> {
  try {
    // Construct full path from CREATED_APPS_BASE + basePath + relativePath
    const absoluteBasePath = path.join(CREATED_APPS_BASE, basePath);
    const fullPath = relativePath
      ? path.join(absoluteBasePath, relativePath)
      : absoluteBasePath;

    // Security: Ensure we don't escape the base path
    const resolvedPath = path.resolve(fullPath);
    const resolvedBase = path.resolve(absoluteBasePath);
    if (!resolvedPath.startsWith(resolvedBase)) {
      return { success: false, error: "Invalid path: attempted directory traversal" };
    }

    const entries = await fs.readdir(fullPath, { withFileTypes: true });

    const contents: FileSystemEntry[] = await Promise.all(
      entries
        .filter((entry) => !entry.name.startsWith(".")) // Hide dotfiles
        .map(async (entry) => {
          const entryPath = relativePath
            ? path.join(relativePath, entry.name)
            : entry.name;

          let size: number | undefined;
          if (entry.isFile()) {
            try {
              const stats = await fs.stat(path.join(fullPath, entry.name));
              size = stats.size;
            } catch {
              // Ignore stat errors
            }
          }

          return {
            name: entry.name,
            path: entryPath,
            type: entry.isDirectory() ? "directory" : "file",
            size,
          } as FileSystemEntry;
        })
    );

    // Sort: directories first, then files, alphabetically
    contents.sort((a, b) => {
      if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return { success: true, data: contents };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { success: false, error: "Directory not found" };
    }
    if ((error as NodeJS.ErrnoException).code === "EACCES") {
      return { success: false, error: "Permission denied" };
    }
    return { success: false, error: String(error) };
  }
}

/**
 * Fetch file content from local filesystem
 * @param basePath - The relative path of the code example (codeExample.path, e.g., "created-apps/app-grid")
 * @param relativePath - Path relative to basePath
 */
export async function fetchFileContent(
  basePath: string,
  relativePath: string
): Promise<FetchFileContentResult> {
  try {
    // Construct full path from CREATED_APPS_BASE + basePath + relativePath
    const absoluteBasePath = path.join(CREATED_APPS_BASE, basePath);
    const fullPath = path.join(absoluteBasePath, relativePath);

    // Security: Ensure we don't escape the base path
    const resolvedPath = path.resolve(fullPath);
    const resolvedBase = path.resolve(absoluteBasePath);
    if (!resolvedPath.startsWith(resolvedBase)) {
      return { success: false, error: "Invalid path: attempted directory traversal" };
    }

    // Check file size before reading (limit to 1MB)
    const stats = await fs.stat(fullPath);
    if (stats.size > 1024 * 1024) {
      return { success: false, error: "File too large (> 1MB)" };
    }

    const content = await fs.readFile(fullPath, "utf-8");
    return { success: true, content };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { success: false, error: "File not found" };
    }
    if ((error as NodeJS.ErrnoException).code === "EACCES") {
      return { success: false, error: "Permission denied" };
    }
    return { success: false, error: String(error) };
  }
}
