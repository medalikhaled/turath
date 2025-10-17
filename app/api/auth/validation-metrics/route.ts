import { NextResponse } from 'next/server';
import { getAuthValidationSummary } from '@/lib/auth-monitoring';

export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  const summary = getAuthValidationSummary();
  
  return NextResponse.json({
    success: true,
    metrics: summary,
    message: `${summary.totalCalls} validation calls in ${summary.minutesSinceReset} minutes (${summary.callsPerMinute} per minute)`,
  });
}