import { NextResponse } from 'next/server';
import { revokeReputationProof, getReputationProof } from '@/lib/db';
import { getAuthenticatedUser, verifyOwnership } from '@/lib/authGuard';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { proofId, userId: bodyUserId } = body;

    if (!proofId) {
      return NextResponse.json({ error: 'Missing proofId.' }, { status: 400 });
    }

    const authUser = await getAuthenticatedUser(request);
    const ownerUserId = authUser ? authUser.id : (bodyUserId || 'c1');

    const existingProof = getReputationProof(proofId);
    if (!existingProof) {
      return NextResponse.json({ error: 'Reputation proof not found.' }, { status: 404 });
    }

    // Verify ownership: user can only revoke their own proof!
    if (existingProof.ownerUserId !== ownerUserId) {
      return NextResponse.json({ error: 'Unauthorized: Cannot revoke a proof owned by another user.' }, { status: 403 });
    }

    const success = revokeReputationProof(proofId, ownerUserId);
    if (!success) {
      return NextResponse.json({ error: 'Failed to revoke reputation proof.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Reputation proof has been successfully revoked.',
      proofId,
    });
  } catch (error) {
    console.error('Revocation error:', error);
    return NextResponse.json({ error: 'Failed to process revocation.' }, { status: 500 });
  }
}
