import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getReputationProof, createReputationShare, getUserReputationShares } from '@/lib/db';
import { getAuthenticatedUser, verifyOwnership } from '@/lib/authGuard';
import { ReputationShare, DisclosureLevel } from '@/lib/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedUserId = searchParams.get('userId') || searchParams.get('companyId') || 'c1';

  const authUser = await getAuthenticatedUser(request);
  const userId = authUser ? authUser.id : requestedUserId;

  if (authUser && !verifyOwnership(authUser.id, userId)) {
    return NextResponse.json({ error: 'Unauthorized to view shares.' }, { status: 403 });
  }

  const shares = getUserReputationShares(userId);
  return NextResponse.json({ success: true, shares });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { proofId, disclosureLevel, expiresInDays = 30, userId: bodyUserId } = body;

    const authUser = await getAuthenticatedUser(request);
    const ownerUserId = authUser ? authUser.id : (bodyUserId || 'c1');

    if (!proofId) {
      return NextResponse.json({ error: 'Missing required proofId.' }, { status: 400 });
    }

    const validLevels: DisclosureLevel[] = ['score_only', 'score_and_level', 'score_and_factors'];
    if (!disclosureLevel || !validLevels.includes(disclosureLevel)) {
      return NextResponse.json({ error: 'Invalid or missing disclosureLevel.' }, { status: 400 });
    }

    // Load underlying proof
    const proof = getReputationProof(proofId);

    if (!proof) {
      return NextResponse.json({ error: 'Underlying ReputationProof not found.' }, { status: 404 });
    }

    // Ownership check: Ensure proof belongs to the user
    if (proof.ownerUserId !== ownerUserId) {
      return NextResponse.json({ error: 'Unauthorized: Cannot create share from another user proof.' }, { status: 403 });
    }

    // Status check: Proof must be active & not expired
    const isProofExpired = new Date(proof.expiresAt) < new Date();
    if (proof.status !== 'active' || isProofExpired) {
      return NextResponse.json({ error: 'Cannot create share link from a revoked or expired proof.' }, { status: 400 });
    }

    // Cryptographically secure share token (256-bit CSPRNG)
    const tokenBytes = crypto.randomBytes(32).toString('hex');
    const shareToken = `share_${tokenBytes}`;

    const now = new Date();
    const days = Math.max(1, Math.min(90, Number(expiresInDays) || 30));
    const requestedExpiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const proofExpiresAt = new Date(proof.expiresAt);

    // Section 15 Expiration Cap Rule: share.expiresAt <= proof.expiresAt
    const finalExpiresAt = requestedExpiresAt < proofExpiresAt ? requestedExpiresAt : proofExpiresAt;

    const share: ReputationShare = {
      id: `share_id_${crypto.randomBytes(16).toString('hex')}`,
      ownerUserId,
      proofId,
      shareToken,
      disclosureLevel,
      createdAt: now.toISOString(),
      expiresAt: finalExpiresAt.toISOString(),
      status: 'active',
    };

    createReputationShare(share);

    return NextResponse.json({
      success: true,
      share: {
        id: share.id,
        shareToken: share.shareToken,
        disclosureLevel: share.disclosureLevel,
        createdAt: share.createdAt,
        expiresAt: share.expiresAt,
        status: share.status,
        shareUrl: `/verify/${share.shareToken}`,
      },
    });
  } catch (error) {
    console.error('Failed to create reputation share:', error);
    return NextResponse.json({ error: 'Failed to create reputation share.' }, { status: 500 });
  }
}
