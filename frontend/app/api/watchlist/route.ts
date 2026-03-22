import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/watchlist — add an asset to the current user's watchlist
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { asset_id, asset_name } = body;

    if (!asset_id || !asset_name) {
      return NextResponse.json(
        { error: 'asset_id and asset_name are required' },
        { status: 400 }
      );
    }

    const entry = await prisma.watchlist.create({
      data: {
        user_id: session.user.id,
        asset_id,
        asset_name,
      },
    });

    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (error: any) {
    // Unique constraint — already on watchlist
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Asset already on watchlist' },
        { status: 409 }
      );
    }
    console.error('[WATCHLIST POST ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/watchlist — fetch watchlist for current user
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const watchlist = await prisma.watchlist.findMany({
      where: { user_id: session.user.id },
      orderBy: { added_at: 'desc' },
    });

    return NextResponse.json({ watchlist });
  } catch (error) {
    console.error('[WATCHLIST GET ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/watchlist?asset_id=bitcoin — remove an asset
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const asset_id = searchParams.get('asset_id');

    if (!asset_id) {
      return NextResponse.json({ error: 'asset_id required' }, { status: 400 });
    }

    await prisma.watchlist.deleteMany({
      where: {
        user_id: session.user.id,
        asset_id: asset_id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[WATCHLIST DELETE ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
