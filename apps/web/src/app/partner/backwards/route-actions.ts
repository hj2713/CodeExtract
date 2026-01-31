"use server";

import { mkdir, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

// Types for local routes.json
export interface LocalRouteItem {
    folder: string;
    createdAt: string;
}

export interface LocalRoutesIndex {
    generatedAt: string;
    items: LocalRouteItem[];
}

const BACKWARDS_BASE = join(
    process.cwd(),
    "src/app/partner/backwards/prototypes",
);
const ROUTES_PATH = join(BACKWARDS_BASE, "routes.json");

function toSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

function generatePlaceholderPage(name: string): string {
    return `export default function Page() {  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">${name}</h1>
      <p className="text-muted-foreground">Placeholder page</p>
    </div>
  );
}
`;
}

/**
 * Scan for subfolders that have a page.tsx
 */
async function scanSubfolders(): Promise<LocalRouteItem[]> {
    const items: LocalRouteItem[] = [];

    try {
        const entries = await readdir(BACKWARDS_BASE, { withFileTypes: true });

        for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            if (entry.name.startsWith(".") || entry.name.startsWith("["))
                continue;

            // Check if folder has page.tsx
            try {
                await readdir(join(BACKWARDS_BASE, entry.name));
                const files = await readdir(join(BACKWARDS_BASE, entry.name));
                if (files.includes("page.tsx")) {
                    items.push({
                        folder: entry.name,
                        createdAt: new Date().toISOString(),
                    });
                }
            } catch {
                // skip
            }
        }
    } catch {
        // folder doesn't exist
    }

    return items;
}

/**
 * Refresh routes.json from filesystem
 */
export async function refreshRoutes(): Promise<LocalRoutesIndex> {
    const items = await scanSubfolders();
    const index: LocalRoutesIndex = {
        generatedAt: new Date().toISOString(),
        items,
    };
    await writeFile(ROUTES_PATH, JSON.stringify(index, null, 2), "utf-8");
    return index;
}

/**
 * Get routes.json
 */
export async function getLocalRoutes(): Promise<LocalRoutesIndex> {
    const { readFile } = await import("node:fs/promises");
    try {
        const content = await readFile(ROUTES_PATH, "utf-8");
        return JSON.parse(content);
    } catch {
        return refreshRoutes();
    }
}

/**
 * Create a new subpage folder with placeholder page.tsx
 */
export async function createSubpage(
    name: string,
): Promise<{ success: boolean; folder?: string; error?: string }> {
    const folder = toSlug(name);
    if (!folder) return { error: "Invalid name", success: false };

    const folderPath = join(BACKWARDS_BASE, folder);

    try {
        await mkdir(folderPath, { recursive: true });
        await writeFile(
            join(folderPath, "page.tsx"),
            generatePlaceholderPage(name),
            "utf-8",
        );
        await refreshRoutes();
        return { folder, success: true };
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : "Unknown error",
            success: false,
        };
    }
}
