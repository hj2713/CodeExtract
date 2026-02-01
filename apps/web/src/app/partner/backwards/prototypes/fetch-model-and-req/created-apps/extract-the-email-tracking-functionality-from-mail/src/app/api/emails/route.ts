import { NextRequest, NextResponse } from 'next/server';
import { getTrackedEmails } from '@/app/extracted/actions';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filter = (searchParams.get('filter') || 'all') as 'all' | 'opened' | 'unopened';

  const data = await getTrackedEmails(filter);

  return NextResponse.json(data);
}
