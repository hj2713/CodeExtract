/**
 * Tracking Pixel Endpoint
 *
 * This endpoint serves a 1x1 transparent PNG and records email open events.
 * When an email is opened, the tracking pixel is loaded and this endpoint is called.
 */

import { NextRequest, NextResponse } from 'next/server';
import { recordEmailOpen } from '@/app/extracted/actions';

// 1x1 transparent PNG (base64 decoded bytes)
const TRANSPARENT_PIXEL = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
  0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
  0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

export async function GET(
  request: NextRequest,
  { params }: { params: { trackingId: string } }
) {
  const trackingId = params.trackingId;
  const signature = request.nextUrl.searchParams.get('sig');

  // Get request metadata
  const userAgent = request.headers.get('user-agent');
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ipAddress = forwardedFor?.split(',')[0] || realIp;

  // Always return the pixel, even if tracking fails
  // This ensures email rendering is never affected
  const pixelResponse = new NextResponse(TRANSPARENT_PIXEL, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': TRANSPARENT_PIXEL.length.toString(),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });

  // Record the open event (async, don't wait for result)
  if (trackingId && signature) {
    recordEmailOpen(trackingId, signature, userAgent, ipAddress).catch(err => {
      console.error('Failed to record email open:', err);
    });
  }

  return pixelResponse;
}
