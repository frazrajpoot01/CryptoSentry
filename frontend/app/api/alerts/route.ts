import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Adjust this import based on your prisma client location

// ✅ Forces Next.js to fetch fresh data every time instead of caching it
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        // Get limit from URL params, default to 50
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        const alerts = await prisma.cryptoAlert.findMany({
            orderBy: {
                detected_at: 'desc'
            },
            take: limit
        });

        return NextResponse.json(alerts, { status: 200 });
    } catch (error) {
        console.error("Failed to fetch alerts:", error);
        return NextResponse.json(
            { error: "Failed to fetch alert history" },
            { status: 500 }
        );
    }
}