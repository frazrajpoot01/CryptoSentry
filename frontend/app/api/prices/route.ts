import { NextResponse } from 'next/server';

const EXPRESS_URL = process.env.EXPRESS_SERVER_URL || 'http://localhost:4000';
const STALE_THRESHOLD_MS = 60_000; // 60 seconds

export async function GET() {
  try {
    const res = await fetch(`${EXPRESS_URL}/cache`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch from surveillance engine' },
        { status: 502 }
      );
    }

    const payload = await res.json();

    // Determine staleness based on Express server's fetchedAt timestamp
    const fetchedAt: string = payload.fetchedAt;
    const ageMs = Date.now() - new Date(fetchedAt).getTime();
    const stale = ageMs > STALE_THRESHOLD_MS;

    return NextResponse.json({
      ...payload,
      stale,
    });
  } catch (error) {
    console.error('[API/PRICES ERROR]', error);
    return NextResponse.json(
      { error: 'Surveillance engine is unreachable', stale: true },
      { status: 503 }
    );
  }
}
