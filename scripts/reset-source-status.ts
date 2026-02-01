
import { db, sources, inArray } from "../packages/db/src/index";

async function reset() {
  console.log("Resetting stuck sources...");
  
  await db.update(sources)
    .set({ analysisStatus: "failed" })
    .where(inArray(sources.analysisStatus, ["analyzing", "cloning", "analyzing:scanning", "fetching_tree", "fetching_content"]));

  console.log("Reset complete.");
  process.exit(0);
}

reset().catch(console.error);
