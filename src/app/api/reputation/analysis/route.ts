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

    // Demo financial data is used ONLY when the caller explicitly asks for a
    // demo profile. It must never become the default evidence for a real
    // request, because that would silently turn demo data into a real score.
    const requestedProfileKey =
      typeof body.profileKey === 'string' ? body.profileKey : undefined;
    const profileMock = requestedProfileKey
      ? MOCK_FINANCIAL_PROFILES[requestedProfileKey]
      : undefined;

    const isDemoProfile = Boolean(profileMock) && body.financialData === undefined;
    const inputData = body.financialData ?? (profileMock ? profileMock.data : undefined);
    const history = profileMock ? profileMock.history : body.history || [];

    // Engine recalculates / verifies reputation result server-side.
    // The outcome carries its own sufficiency, so the AI layer can never be
    // handed a score that was produced from missing evidence.
    const outcome = calculateReputation(inputData);

    const userId = authUser?.id || body.userId || 'c1';

    // AI Analysis Layer processes verified engine output
    const analysis = await analyzeFinancialReputation({
      userId,
      reputation: outcome,
      history,
      financialData: inputData,
    });

    return NextResponse.json({
      mode: isDemoProfile ? 'demo' : 'real',
      profileKey: isDemoProfile ? requestedProfileKey : null,
      status: outcome.status,
      reputation: outcome.status === 'scored' ? outcome.result : null,
      reason: outcome.status === 'insufficient' ? outcome.reason : undefined,
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
