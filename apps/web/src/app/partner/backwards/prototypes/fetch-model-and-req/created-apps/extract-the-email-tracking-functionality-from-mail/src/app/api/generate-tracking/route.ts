/**
 * Generate Tracking Pixel Endpoint
 *
 * Creates a unique tracking ID and signed pixel URL for email tracking.
 * Call this endpoint before sending a message to get the tracking pixel URL.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateTrackingPixel } from '@/app/extracted/actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const result = await generateTrackingPixel(
      body.recipientEmailHash,
      body.metadata
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Generate tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to generate tracking pixel' },
      { status: 500 }
    );
  }
}
