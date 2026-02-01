import { NextResponse } from 'next/server';
import { getAnalyticsSummary } from '@/app/extracted/actions';

export async function GET() {
  const data = await getAnalyticsSummary();
  return NextResponse.json(data);
}
