import { db, sources } from "../packages/db/src/index";

async function check() {
  const all = await db.select().from(sources);
  console.log("ALL SOURCES:");
  all.forEach(s => {
    console.log(`[${s.id}] ${s.name} (${s.originUrl}) - Status: ${s.analysisStatus}`);
  });
}

check();
