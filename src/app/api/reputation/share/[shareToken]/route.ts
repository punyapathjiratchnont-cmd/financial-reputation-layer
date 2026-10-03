import { NextResponse } from 'next/server';
import { getReputationShare, getReputationProof } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shareToken: string }> }
) {
  const { shareToken } = await params;

  if (!shareToken) {
    return NextResponse.json({ valid: false, error: 'Share token required' }, { status: 400 });
  }

  const share = getReputationShare(shareToken);

  if (!share) {
    return NextResponse.json(
      {
        valid: false,
        error: 'Reputation share link not found',
      },
      { status: 404 }
    );
  }

  // Check underlying ReputationProof
  const proof = getReputationProof(share.proofId);

  // Evaluate Server-Side Expiration & Statuses
  const isShareExpired = new Date(share.expiresAt) < new Date();
  const isProofExpired = proof ? new Date(proof.expiresAt) < new Date() : true;

  if (!proof || proof.status === 'revoked') {
    return NextResponse.json({ valid: false, status: 'revoked' });
  }

  if (share.status === 'revoked') {
    return NextResponse.json({ valid: false, status: 'revoked' });
  }

  if (isShareExpired || isProofExpired || share.status === 'expired' || proof.status === 'expired') {
    return NextResponse.json({ valid: false, status: 'expired' });
  }

  // Construct Explicit Sanitized Response DTO based on disclosureLevel
  // MUST NEVER expose ownerUserId, proofId, financialData, or raw numbers!
  if (share.disclosureLevel === 'score_only') {
    return NextResponse.json({
      valid: true,
      status: 'active',
      disclosureLevel: 'score_only',
      reputation: {
        score: proof.score,
      },
      verifiedAt: proof.verifiedAt,
      expiresAt: share.expiresAt,
    });
  }

  if (share.disclosureLevel === 'score_and_level') {
    return NextResponse.json({
      valid: true,
      status: 'active',
      disclosureLevel: 'score_and_level',
      reputation: {
        score: proof.score,
        level: proof.level,
      },
      verifiedAt: proof.verifiedAt,
      expiresAt: share.expiresAt,
    });
  }

  // score_and_factors
  return NextResponse.json({
    valid: true,
    status: 'active',
    disclosureLevel: 'score_and_factors',
    reputation: {
      score: proof.score,
      level: proof.level,
      factors: {
        paymentReliability: proof.factorSummary.paymentReliability,
        incomeConsistency: proof.factorSummary.incomeConsistency,
        spendingStability: proof.factorSummary.spendingStability,
        savingBehavior: proof.factorSummary.savingBehavior,
        debtBehavior: proof.factorSummary.debtBehavior,
        transactionHistory: proof.factorSummary.transactionHistory,
      },
    },
    verifiedAt: proof.verifiedAt,
    expiresAt: share.expiresAt,
  });
}
