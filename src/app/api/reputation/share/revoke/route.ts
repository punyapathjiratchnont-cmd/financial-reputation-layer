import { NextResponse } from 'next/server';
import { getReputationShare, revokeReputationShare } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/authGuard';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { shareToken, userId: bodyUserId } = body;

    if (!shareToken) {
      return NextResponse.json({ error: 'Missing required shareToken.' }, { status: 400 });
    }

    const authUser = await getAuthenticatedUser(request);
    const ownerUserId = authUser ? authUser.id : (bodyUserId || 'c1');

    const share = getReputationShare(shareToken);
    if (!share) {
      return NextResponse.json({ error: 'Reputation share not found.' }, { status: 404 });
    }

    // Ownership check: User can only revoke their own share!
    if (share.ownerUserId !== ownerUserId) {
      return NextResponse.json({ error: 'Unauthorized: Cannot revoke a share owned by another user.' }, { status: 403 });
    }

    const success = revokeReputationShare(shareToken, ownerUserId);
    if (!success) {
      return NextResponse.json({ error: 'Failed to revoke reputation share.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Reputation share link has been successfully revoked.',
      shareToken,
    });
  } catch (error) {
    console.error('Failed to revoke share:', error);
    return NextResponse.json({ error: 'Failed to process share revocation.' }, { status: 500 });
  }
}
