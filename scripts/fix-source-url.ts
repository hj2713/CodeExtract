import { db, sources, eq } from "../packages/db/src/index";

const ID_TO_FIX = "ac939616-ee55-4170-a619-1a3887496d5e";
const NEW_URL = "https://github.com/mckaywrigley/chatbot-ui";

async function fix() {
  console.log(`Patching source ${ID_TO_FIX}...`);
  await db.update(sources)
    .set({ originUrl: NEW_URL })
    .where(eq(sources.id, ID_TO_FIX));
  console.log("Done.");
}

fix();
