import { NextRequest, NextResponse } from 'next/server';
import { getEmailEvents } from '@/app/extracted/actions';

export async function GET(
  request: NextRequest,
  { params }: { params: { trackingId: string } }
) {
  const events = await getEmailEvents(params.trackingId);

  return NextResponse.json({ events });
}
