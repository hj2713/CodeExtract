import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const createdAppsPath = path.join(
      process.cwd(),
      'src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps'
    );
    const componentPath = path.join(createdAppsPath, id);
    const metadataPath = path.join(componentPath, 'extraction-result.json');

    // Check if component exists
    if (!fs.existsSync(componentPath)) {
      return NextResponse.json(
        { error: 'Component not found' },
        { status: 404 }
      );
    }

    // Read existing metadata
    let metadata: Record<string, unknown> = {};
    if (fs.existsSync(metadataPath)) {
      const content = fs.readFileSync(metadataPath, 'utf-8');
      metadata = JSON.parse(content);
    }

    // Update reviewStatus and approvedAt
    metadata.reviewStatus = 'approved';
    metadata.approvedAt = new Date().toISOString();

    // Write back to file
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    return NextResponse.json({
      success: true,
      reviewStatus: metadata.reviewStatus,
      approvedAt: metadata.approvedAt,
    });
  } catch (error) {
    console.error('Error approving component:', error);
    return NextResponse.json(
      { error: 'Failed to approve component' },
      { status: 500 }
    );
  }
}
