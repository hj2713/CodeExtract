import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const createdAppsPath = path.join(
      process.cwd(),
      'src/app/partner/backwards/prototypes/fetch-model-and-req/_created-apps'
    );

    // Read all directories in created-apps
    const entries = fs.readdirSync(createdAppsPath, { withFileTypes: true });
    const componentDirs = entries.filter(entry => entry.isDirectory() && entry.name !== '.gitkeep');

    const components = componentDirs.map(dir => {
      const componentPath = path.join(createdAppsPath, dir.name);
      
      // Try to read extraction-result.json for metadata
      let metadata: any = {};
      try {
        const metadataPath = path.join(componentPath, 'extraction-result.json');
        if (fs.existsSync(metadataPath)) {
          const content = fs.readFileSync(metadataPath, 'utf-8');
          metadata = JSON.parse(content);
        }
      } catch (e) {
        // Ignore metadata read errors
      }

      // Try to read SUMMARY.md for description
      let summary = '';
      try {
        const summaryPath = path.join(componentPath, 'SUMMARY.md');
        if (fs.existsSync(summaryPath)) {
          summary = fs.readFileSync(summaryPath, 'utf-8').slice(0, 200); // First 200 chars
        }
      } catch (e) {
        // Ignore summary read errors
      }

      // Check if extracted page exists
      const hasExtractedPage = fs.existsSync(
        path.join(componentPath, 'src/app/extracted/page.tsx')
      );

      return {
        id: dir.name,
        name: dir.name
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        path: `/partner/gallery/${dir.name}`,
        description: summary || metadata.description || 'Extracted component',
        hasExtractedPage,
        createdAt: fs.statSync(componentPath).birthtime,
      };
    });

    // Sort by creation date (newest first)
    components.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json({ components });
  } catch (error) {
    console.error('Error reading components:', error);
    return NextResponse.json(
      { error: 'Failed to load components' },
      { status: 500 }
    );
  }
}
