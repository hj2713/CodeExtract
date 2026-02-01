
import { db, sources } from "../packages/db/src/index";
import { randomUUID } from "crypto";

async function seed() {
  console.log("Seeding test source...");
  
  const sourceId = randomUUID();
  
  await db.insert(sources).values({
    id: sourceId,
    name: "CodeExtract Repo",
    type: "github_repo",
    originUrl: "https://github.com/hj2713/CodeExtract",
    analysisStatus: "pending",
    githubMetadata: {
        owner: "hj2713",
        repo: "CodeExtract", 
        defaultBranch: "main",
        description: "Test Repository for Component Extraction",
        stars: 0,
        forks: 0
    }
  });

  console.log(`Source created! ID: ${sourceId}`);
  console.log("Go to /phase2 to see it.");
  process.exit(0);
}

seed().catch(console.error);
