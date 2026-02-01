/**
 * Requirement types - specific implementation patterns to extract from a source
 * These types mirror the Drizzle schema in packages/db/src/schema/index.ts
 */

// For creating a new requirement
export interface CreateRequirementInput {
	sourceId: string;
	requirement: string;
	context?: string;
}

// For updating a requirement
export interface UpdateRequirementInput {
	id: string;
	requirement?: string;
	context?: string;
}
