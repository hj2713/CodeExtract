import { NextRequest, NextResponse } from 'next/server';
import { getDailyTrends } from '@/app/extracted/actions';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const days = parseInt(searchParams.get('days') || '14', 10);

  const data = await getDailyTrends(days);
  return NextResponse.json(data);
}
