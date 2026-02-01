import { drizzle } from "drizzle-orm/libsql";
import type { LibSQLDatabase } from "drizzle-orm/libsql";

import * as schema from "./schema";

// Lazy initialization to avoid build-time import of @libsql/client
// This fixes Turbopack/webpack CommonJS/ESM compatibility issues
let _db: LibSQLDatabase<typeof schema> | undefined;

function getDb(): LibSQLDatabase<typeof schema> {
	if (!_db) {
		// Use require() for runtime-only loading
		const { createClient } = require("@libsql/client") as typeof import("@libsql/client");
		const client = createClient({
			url: process.env.DATABASE_URL!,
		});
		_db = drizzle({ client, schema });
	}
	return _db;
}

// Export a proxy that lazily initializes db on first access
// This maintains backwards compatibility with existing code using `db.query()` etc.
export const db: LibSQLDatabase<typeof schema> = new Proxy({} as LibSQLDatabase<typeof schema>, {
	get(_, prop) {
		return (getDb() as Record<string, unknown>)[prop as string];
	},
});

// Re-export schema and operators for convenience
export * from "./schema";
export { eq, desc, asc, and, or, like, inArray, lt, gt, sql, isNull, isNotNull, between, ne, gte, lte, not } from "drizzle-orm";
