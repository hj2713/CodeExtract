import { db, sources, eq } from "../packages/db/src/index";

const ID_TO_CHECK = "74b1fb13-577e-4536-a10d-43521cda465e";

async function check() {
  console.log(`Checking for Source ID: ${ID_TO_CHECK}`);
  const s = await db.query.sources.findFirst({
    where: eq(sources.id, ID_TO_CHECK)
  });
  
  if (s) {
    console.log("FOUND SOURCE:");
    console.log(JSON.stringify(s, null, 2));
  } else {
    console.log("SOURCE NOT FOUND");
    // List all
    const all = await db.query.sources.findMany();
    console.log(`Total sources in DB: ${all.length}`);
    all.forEach(x => console.log(`- ${x.id} (${x.name})`));
  }
}

check();
