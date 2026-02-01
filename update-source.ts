
import { db } from "@my-better-t-app/db";
import { sources } from "@my-better-t-app/db/schema";
import { eq } from "drizzle-orm";

const SOURCE_ID = "ac939616-ee55-4170-a619-1a3887496d5e";
const GITHUB_URL = "https://github.com/mckaywrigley/chatbot-ui";

async function main() {
  console.log("Updating source URL...");
  try {
    await db.update(sources)
      .set({ url: GITHUB_URL })
      .where(eq(sources.id, SOURCE_ID));
    console.log("Source URL updated successfully!");
  } catch (error) {
    console.error("Error updating source URL:", error);
  }
}

main();
