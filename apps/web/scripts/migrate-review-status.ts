/**
 * Migration script: Add reviewStatus to existing extraction-result.json files
 *
 * Run with: npx tsx scripts/migrate-review-status.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const CREATED_APPS_PATH = path.join(
  process.cwd(),
  'src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps'
);

async function migrate() {
  console.log('Starting migration: Adding reviewStatus to extraction-result.json files...\n');

  // Get all directories in created-apps
  const entries = fs.readdirSync(CREATED_APPS_PATH, { withFileTypes: true });
  const componentDirs = entries.filter(
    (entry) => entry.isDirectory() && entry.name !== '.gitkeep'
  );

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const dir of componentDirs) {
    const componentPath = path.join(CREATED_APPS_PATH, dir.name);
    const metadataPath = path.join(componentPath, 'extraction-result.json');

    try {
      if (!fs.existsSync(metadataPath)) {
        console.log(`  [SKIP] ${dir.name}: No extraction-result.json`);
        skipped++;
        continue;
      }

      const content = fs.readFileSync(metadataPath, 'utf-8');
      const metadata = JSON.parse(content);

      if (metadata.reviewStatus) {
        console.log(`  [SKIP] ${dir.name}: Already has reviewStatus="${metadata.reviewStatus}"`);
        skipped++;
        continue;
      }

      // Add reviewStatus: "pending"
      metadata.reviewStatus = 'pending';

      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      console.log(`  [OK] ${dir.name}: Added reviewStatus="pending"`);
      updated++;
    } catch (error) {
      console.error(`  [ERROR] ${dir.name}: ${error}`);
      errors++;
    }
  }

  console.log('\n--- Migration Complete ---');
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);
}

migrate().catch(console.error);
