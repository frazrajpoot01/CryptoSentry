import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function PUT(request: Request) {
    try {
        // 1. Check if the user is actually logged in
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Grab the new name and image from the frontend request
        const body = await request.json();
        const { name, image } = body;

        // 3. Build the update object carefully to allow 'null' for image removal
        const updateData: { name?: string; image?: string | null } = {};

        if (name !== undefined) {
            updateData.name = name;
        }

        if (image !== undefined) {
            updateData.image = image; // This safely allows 'null' to be sent to the DB
        }

        // 4. Update the user in the database
        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: updateData,
        });

        return NextResponse.json({ success: true, user: updatedUser }, { status: 200 });
    } catch (error) {
        console.error("Profile update error:", error);
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
}