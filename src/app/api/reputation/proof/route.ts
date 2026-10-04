import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { calculateReputation, evaluateProofEligibility } from '@/lib/reputationEngine';
import { getUserFinancialData, createReputationProof, getUserReputationProofs } from '@/lib/db';
import { getAuthenticatedUser, verifyOwnership } from '@/lib/authGuard';
import { ReputationProof } from '@/lib/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedUserId = searchParams.get('userId') || searchParams.get('companyId') || 'c1';

  const authUser = await getAuthenticatedUser(request);
  const userId = authUser ? authUser.id : requestedUserId;

  if (authUser && !verifyOwnership(authUser.id, userId)) {
    return NextResponse.json({ error: 'Unauthorized to view another user reputation proofs.' }, { status: 430 });
  }

  const proofs = getUserReputationProofs(userId);
  return NextResponse.json({ success: true, proofs });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const authUser = await getAuthenticatedUser(request);
    
    // Server-enforced User Identity
    const ownerUserId = authUser ? authUser.id : (body.userId || 'c1');

    if (authUser && body.userId && !verifyOwnership(authUser.id, body.userId)) {
      return NextResponse.json({ error: 'Unauthorized to create proof for another user.' }, { status: 403 });
    }

    // Load user financial data. A missing record is passed through as-is: it is
    // never substituted with a default profile.
    const financialData = getUserFinancialData(ownerUserId);

    // SECURITY: Engine recalculates score & level strictly server-side.
    // Client score / level parameter is completely ignored!
    //
    // EVIDENCE POLICY: a proof may only be minted from a scored outcome. When
    // evidence is missing or partial the route returns 409 and persists nothing.
    const outcome = calculateReputation(financialData);
    const eligibility = evaluateProofEligibility(outcome);

    if (!eligibility.eligible) {
      return NextResponse.json(
        { error: eligibility.code, message: eligibility.message },
        { status: 409 }
      );
    }

    const { score, level, factorSummary } = eligibility.payload;

    // Cryptographically secure verification ID
    const randomHex = crypto.randomBytes(16).toString('hex');
    const verificationId = `proof_${randomHex}`;

    const now = new Date();
    const verifiedAt = now.toISOString();
    // Expiration: 90 days from creation
    const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();

    const proof: ReputationProof = {
      id: verificationId,
      ownerUserId,
      score,
      level,
      factorSummary,
      verifiedAt,
      expiresAt,
      status: 'active',
      createdAt: verifiedAt,
      // Marks which evidence policy produced this proof. A proof without this
      // field predates the strict evidence policy and is not valid.
      policyVersion: 'frl-evidence-v1',
    };

    createReputationProof(proof);

    return NextResponse.json({
      success: true,
      proof,
      verificationUrl: `/verify/${proof.id}`,
    });
  } catch (error) {
    console.error('Failed to generate reputation proof:', error);
    return NextResponse.json({ error: 'Failed to generate reputation proof.' }, { status: 500 });
  }
}
