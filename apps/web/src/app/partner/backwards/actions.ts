"use server";

import { exec } from "node:child_process";
import { readdir, stat } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { promisify } from "node:util";
import type { FileEntry } from "./types";

const execAsync = promisify(exec);

// Get the git root directory
async function getGitRoot(): Promise<string> {
  try {
    const { stdout } = await execAsync("git rev-parse --show-toplevel");
    return stdout.trim();
  } catch {
    return process.cwd();
  }
}

// Get the git root path (exposed for client use)
export async function getProjectRoot(): Promise<string> {
  return await getGitRoot();
}

// Search for files matching a query using git ls-files
export async function searchFiles(query: string): Promise<FileEntry[]> {
  const gitRoot = await getGitRoot();

  if (!query || query.length < 1) {
    return listTopLevelEntries(gitRoot);
  }

  try {
    // Use git ls-files to search tracked files
    const { stdout: trackedFiles } = await execAsync(
      `git ls-files --full-name "${gitRoot}" 2>/dev/null | grep -i "${query}" | head -50`,
      { cwd: gitRoot, maxBuffer: 1024 * 1024 }
    ).catch(() => ({ stdout: "" }));

    const files = trackedFiles.trim().split("\n").filter(Boolean);

    // Also search directories
    const dirs = await findMatchingDirectories(gitRoot, query);
    const allPaths = [...new Set([...files, ...dirs])].slice(0, 50);

    const entries: FileEntry[] = [];
    for (const relativePath of allPaths) {
      try {
        const fullPath = join(gitRoot, relativePath);
        const fileStat = await stat(fullPath);
        entries.push({
          name: basename(relativePath),
          path: fullPath,
          relativePath,
          isDirectory: fileStat.isDirectory(),
        });
      } catch {
        // Skip files that can't be stat'd
      }
    }

    // Sort: directories first, then by path depth, then by name
    return entries.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1;
      }
      const depthDiff =
        a.relativePath.split("/").length - b.relativePath.split("/").length;
      if (depthDiff !== 0) {
        return depthDiff;
      }
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error("Search files error:", error);
    return [];
  }
}

// Find directories matching query
async function findMatchingDirectories(
  gitRoot: string,
  query: string
): Promise<string[]> {
  try {
    const { stdout } = await execAsync(
      `git ls-files --full-name "${gitRoot}" 2>/dev/null`,
      { cwd: gitRoot, maxBuffer: 1024 * 1024 }
    );

    const files = stdout.trim().split("\n").filter(Boolean);
    const dirs = new Set<string>();

    for (const file of files) {
      let dir = dirname(file);
      while (dir && dir !== ".") {
        dirs.add(dir);
        dir = dirname(dir);
      }
    }

    const queryLower = query.toLowerCase();
    return Array.from(dirs)
      .filter((d) => d.toLowerCase().includes(queryLower))
      .slice(0, 20);
  } catch {
    return [];
  }
}

// List top-level entries when no query provided
async function listTopLevelEntries(gitRoot: string): Promise<FileEntry[]> {
  try {
    const entries = await readdir(gitRoot, { withFileTypes: true });
    const result: FileEntry[] = [];

    for (const entry of entries) {
      if (entry.name.startsWith(".")) {
        continue;
      }
      if (["node_modules", "dist", "build", ".next"].includes(entry.name)) {
        continue;
      }

      result.push({
        name: entry.name,
        path: join(gitRoot, entry.name),
        relativePath: entry.name,
        isDirectory: entry.isDirectory(),
      });
    }

    return result.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  } catch {
    return [];
  }
}
