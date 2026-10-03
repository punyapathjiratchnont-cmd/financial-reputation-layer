import { NextResponse } from 'next/server';
import { calculateReputation } from '@/lib/reputationEngine';
import { MOCK_FINANCIAL_PROFILES } from '@/lib/mockFinancialData';
import { analyzeFinancialReputation } from '@/lib/aiAnalysisService';
import { getAuthenticatedUser } from '@/lib/authGuard';

// Simple Rate Limiting Tracker (Section 16: Abuse Protection)
const RATE_LIMIT_MAP: Map<string, { count: number; resetAt: number }> = new Map();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const userRate = RATE_LIMIT_MAP.get(identifier);

  if (!userRate || now > userRate.resetAt) {
    RATE_LIMIT_MAP.set(identifier, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (userRate.count >= 15) {
    return false;
  }

  userRate.count += 1;
  return true;
}

export async function POST(request: Request) {
  try {
    // Rate Limiting Check (Section 16)
    const clientIp = request.headers.get('x-forwarded-for') || 'anon_client';
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Too many analysis requests. Please wait a minute before requesting AI analysis again.' },
        { status: 429 }
      );
    }

    const authUser = await getAuthenticatedUser(request);
    const body = await request.json();

    const profileKey = body.profileKey || 'normal';
    const profileMock = MOCK_FINANCIAL_PROFILES[profileKey];

    const inputData = body.financialData || (profileMock ? profileMock.data : undefined);
    const history = profileMock ? profileMock.history : body.history || [];

    // Engine recalculates / verifies reputation result server-side
    const reputationResult = calculateReputation(inputData);

    const userId = authUser?.id || body.userId || 'c1';

    // AI Analysis Layer processes verified engine output
    const analysis = await analyzeFinancialReputation({
      userId,
      reputation: reputationResult,
      history,
      financialData: inputData,
    });

    return NextResponse.json({
      reputation: reputationResult,
      analysis,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Unable to generate financial analysis right now.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
