import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function POST(request: Request) {
    try {
        // Optional but recommended: Protect this route so only logged-in users can change global settings
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get the settings from the frontend
        const body = await request.json();
        const { threshold, interval } = body;

        // Securely forward the command to your Express Engine running on port 4000
        const expressResponse = await fetch('http://localhost:4000/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ threshold, interval }),
        });

        if (!expressResponse.ok) {
            throw new Error('Express engine rejected the command');
        }

        return NextResponse.json({ success: true, message: 'Protocols updated' });

    } catch (error) {
        console.error('[NEXT API ERROR] Failed to bridge settings:', error);
        return NextResponse.json(
            { error: 'Failed to communicate with Surveillance Engine' },
            { status: 500 }
        );
    }
}