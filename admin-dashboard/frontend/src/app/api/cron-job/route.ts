import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  if (key !== 'super_secret_123') {
    return NextResponse.json({ error: 'Invalid cron key' }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    action: 'ping_received',
  });
}
