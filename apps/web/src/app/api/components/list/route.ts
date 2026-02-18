import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface ComponentMetadata {
  id: string;
  name: string;
  path: string;
  description: string;
  hasExtractedPage: boolean;
  createdAt: Date;
  reviewStatus: ReviewStatus;
  prompt?: string;
  originUrl?: string;
  /** True if component has its own package.json (standalone Next.js app) */
  isStandaloneNextApp: boolean;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') as ReviewStatus | null;

    const createdAppsPath = path.join(
      process.cwd(),
      'src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps'
    );

    // Read all directories in created-apps
    const entries = fs.readdirSync(createdAppsPath, { withFileTypes: true });
    const componentDirs = entries.filter(entry => entry.isDirectory() && entry.name !== '.gitkeep');

    const components: ComponentMetadata[] = componentDirs.map(dir => {
      const componentPath = path.join(createdAppsPath, dir.name);

      // Try to read extraction-result.json for metadata
      let metadata: Record<string, unknown> = {};
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

      // Check if component has its own package.json (standalone Next.js app)
      const isStandaloneNextApp = fs.existsSync(
        path.join(componentPath, 'package.json')
      );

      // Default reviewStatus to "pending" if not present
      const reviewStatus = (metadata.reviewStatus as ReviewStatus) || 'pending';

      return {
        id: dir.name,
        name: dir.name
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        path: `/partner/gallery/${dir.name}`,
        description: summary || (metadata.description as string) || 'Extracted component',
        hasExtractedPage,
        createdAt: fs.statSync(componentPath).birthtime,
        reviewStatus,
        prompt: metadata.prompt as string | undefined,
        originUrl: metadata.originUrl as string | undefined,
        isStandaloneNextApp,
      };
    });

    // Filter by status if specified
    let filteredComponents = components;
    if (statusFilter) {
      filteredComponents = components.filter(c => c.reviewStatus === statusFilter);
    }

    // Sort by creation date (newest first)
    filteredComponents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json({ components: filteredComponents });
  } catch (error) {
    console.error('Error reading components:', error);
    return NextResponse.json(
      { error: 'Failed to load components' },
      { status: 500 }
    );
  }
}
