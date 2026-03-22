import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// DELETE /api/watchlist/[id] — remove an asset from watchlist (scoped to current user)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await prisma.watchlist.deleteMany({
      where: {
        id,
        user_id: session.user.id, // Scoped to current user — prevents IDOR
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Watchlist entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, deleted: result.count });
  } catch (error) {
    console.error('[WATCHLIST DELETE ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
