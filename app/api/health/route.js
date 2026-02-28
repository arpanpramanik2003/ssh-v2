import { NextResponse } from 'next/server';
import { initDB } from '@/lib/database';

export async function GET() {
  try {
    await initDB();
    return NextResponse.json({
      message: 'Smart Student Hub API is running!',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      database: 'Connected ✅',
      deployment: 'Next.js Full-Stack',
    });
  } catch (error) {
    return NextResponse.json({
      message: 'API running but database issue detected',
      timestamp: new Date().toISOString(),
      error: error.message,
    }, { status: 500 });
  }
}
