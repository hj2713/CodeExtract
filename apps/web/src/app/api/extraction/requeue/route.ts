import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { enqueue, type ClaudeExtractionPayload } from '@/app/partner/backwards/prototypes/jobs-queue/queue';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { originalAppId, updatedPrompt } = body as {
      originalAppId: string;
      updatedPrompt: string;
    };

    if (!originalAppId || !updatedPrompt) {
      return NextResponse.json(
        { error: 'Missing required fields: originalAppId and updatedPrompt' },
        { status: 400 }
      );
    }

    const createdAppsPath = path.join(
      process.cwd(),
      'src/app/partner/backwards/prototypes/fetch-model-and-req/created-apps'
    );
    const componentPath = path.join(createdAppsPath, originalAppId);
    const metadataPath = path.join(componentPath, 'extraction-result.json');

    // Check if original component exists
    if (!fs.existsSync(componentPath)) {
      return NextResponse.json(
        { error: 'Original component not found' },
        { status: 404 }
      );
    }

    // Read original metadata to get originUrl
    let metadata: Record<string, unknown> = {};
    if (fs.existsSync(metadataPath)) {
      const content = fs.readFileSync(metadataPath, 'utf-8');
      metadata = JSON.parse(content);
    }

    const originUrl = (metadata.originUrl as string) || null;

    // Create unique name from first 50 chars of prompt + timestamp
    const timestamp = Date.now();
    const name = `${slugify(updatedPrompt.substring(0, 50))}-${timestamp}`;

    const payload: ClaudeExtractionPayload = {
      type: 'claude_extraction',
      name,
      prompt: updatedPrompt,
      targetPath: null,
      originUrl,
      requirementId: null, // No requirement for requeued jobs
      promptHash: hashString(updatedPrompt),
    };

    // Enqueue with unique idempotency key
    const job = await enqueue(payload, {
      idempotencyKey: `requeue-${originalAppId}-${timestamp}`,
    });

    // Update original app to track resubmission
    metadata.resubmittedAs = name;
    metadata.resubmittedAt = new Date().toISOString();
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        name,
        status: job.status,
      },
    });
  } catch (error) {
    console.error('Error requeuing extraction:', error);
    return NextResponse.json(
      { error: 'Failed to requeue extraction' },
      { status: 500 }
    );
  }
}
