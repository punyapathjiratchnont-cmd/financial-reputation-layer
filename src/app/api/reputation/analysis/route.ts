import { NextResponse } from 'next/server';
import { calculateReputation } from '@/lib/reputationEngine';
import { MOCK_FINANCIAL_PROFILES } from '@/lib/mockFinancialData';
import { analyzeFinancialReputation } from '@/lib/aiAnalysisService';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Security check: Never trust client-submitted 'score' or 'level' directly!
    // Server computes or verifies the reputation result from input financial data or profileKey.
    const profileKey = body.profileKey || 'normal';
    const profileMock = MOCK_FINANCIAL_PROFILES[profileKey];

    const inputData = body.financialData || (profileMock ? profileMock.data : undefined);
    const history = profileMock ? profileMock.history : body.history || [];

    // Engine computes legitimate reputation result
    const reputationResult = calculateReputation(inputData);

    // AI Analysis Layer processes engine output
    const analysis = await analyzeFinancialReputation({
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
