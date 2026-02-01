"use server";

import { db, sources } from "@my-better-t-app/db";

export async function testDatabaseConnection() {
  try {
    const allSources = await db.select().from(sources);
    return {
      success: true,
      count: allSources.length,
      message: `Database connected successfully. Found ${allSources.length} sources.`
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to connect to database'
    };
  }
}
