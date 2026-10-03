import { NextResponse } from 'next/server';
import { getReputationProof } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ verificationId: string }> }
) {
  const { verificationId } = await params;

  if (!verificationId) {
    return NextResponse.json({ valid: false, error: 'Verification ID required' }, { status: 400 });
  }

  const proof = getReputationProof(verificationId);

  if (!proof) {
    return NextResponse.json(
      {
        valid: false,
        error: 'Reputation proof not found',
      },
      { status: 404 }
    );
  }

  // Check auto-expiration
  const isExpiredByTime = new Date(proof.expiresAt) < new Date();
  const effectiveStatus = isExpiredByTime ? 'expired' : proof.status;
  const isValid = effectiveStatus === 'active';

  // Return strictly sanitized object (NO raw financial figures exposed!)
  return NextResponse.json({
    valid: isValid,
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
    expiresAt: proof.expiresAt,
    status: effectiveStatus,
  });
}
