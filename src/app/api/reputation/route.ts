import { NextResponse } from 'next/server';
import { calculateReputation, UserFinancialData } from '@/lib/reputationEngine';
import { MOCK_FINANCIAL_PROFILES } from '@/lib/mockFinancialData';
import {
  getUserFinancialData,
  saveUserFinancialData,
  getUserScoreHistory,
  recordScoreHistory,
} from '@/lib/db';
import { UserFinancialRecord } from '@/lib/types';

// Helper to validate non-negative numbers
function validateNonNegative(value: any, fallback = 0): number {
  const num = Number(value);
  if (isNaN(num) || !isFinite(num) || num < 0) {
    return fallback;
  }
  return num;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId') || searchParams.get('companyId') || 'c1';
  const mode = searchParams.get('mode') || 'real'; // 'real' or 'demo'
  const profileKey = searchParams.get('profile') || 'normal';

  if (mode === 'demo') {
    const selected = MOCK_FINANCIAL_PROFILES[profileKey] || MOCK_FINANCIAL_PROFILES.normal;
    const outcome = calculateReputation(selected.data);
    return NextResponse.json({
      mode: 'demo',
      profileKey,
      profileLabel: selected.label,
      status: outcome.status,
      outcome,
      reputation: outcome.status === 'scored' ? outcome.result : null,
      history: selected.history,
      financialData: selected.data,
    });
  }

  // Real Data Mode
  let userRecord = getUserFinancialData(userId);

  if (!userRecord) {
    // No financial record at all. There is no evidence, so there is no score.
    return NextResponse.json({
      mode: 'real',
      userId,
      hasData: false,
      status: 'insufficient',
      reputation: null,
      reason: 'No financial evidence has been submitted to FRL.',
      history: [],
      financialData: null,
    });
  }

  const outcome = calculateReputation(userRecord);
  const history = getUserScoreHistory(userId);

  return NextResponse.json({
    mode: 'real',
    userId,
    hasData: true,
    status: outcome.status,
    outcome,
    reputation: outcome.status === 'scored' ? outcome.result : null,
    reason: outcome.status === 'insufficient' ? outcome.reason : undefined,
    history,
    financialData: userRecord,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = body.userId || 'c1';

    // SECURITY GUARANTEE: Ignore any direct 'score' or 'level' client parameter
    // All scores MUST be computed engine-side from validated financial metrics!
    const rawData = body.financialData || body;

    const validatedData: UserFinancialData = {
      income: {
        monthly: validateNonNegative(rawData?.income?.monthly, 0),
        stabilityMonths: Math.min(120, validateNonNegative(rawData?.income?.stabilityMonths, 0)),
        sourcesCount: Math.min(10, validateNonNegative(rawData?.income?.sourcesCount, 1)),
      },
      expenses: {
        monthlyAvg: validateNonNegative(rawData?.expenses?.monthlyAvg, 0),
        discretionaryRatio: Math.min(1, Math.max(0, Number(rawData?.expenses?.discretionaryRatio || 0.2))),
      },
      payments: {
        totalDue: validateNonNegative(rawData?.payments?.totalDue, 0),
        onTimeCount: validateNonNegative(rawData?.payments?.onTimeCount, 0),
        lateCount: validateNonNegative(rawData?.payments?.lateCount, 0),
        missedCount: validateNonNegative(rawData?.payments?.missedCount, 0),
      },
      savings: {
        currentBalance: validateNonNegative(rawData?.savings?.currentBalance, 0),
        monthlyContribution: validateNonNegative(rawData?.savings?.monthlyContribution, 0),
        emergencyFundMonths: validateNonNegative(rawData?.savings?.emergencyFundMonths, 0),
      },
      debts: {
        totalDebt: validateNonNegative(rawData?.debts?.totalDebt, 0),
        creditLimit: validateNonNegative(rawData?.debts?.creditLimit, 0),
        utilizationRatio: Math.min(1, Math.max(0, Number(rawData?.debts?.utilizationRatio || 0))),
        monthlyDebtService: validateNonNegative(rawData?.debts?.monthlyDebtService, 0),
      },
      transactions: {
        count6Months: validateNonNegative(rawData?.transactions?.count6Months, 0),
        bouncedCount: validateNonNegative(rawData?.transactions?.bouncedCount, 0),
        oldestAccountYears: validateNonNegative(rawData?.transactions?.oldestAccountYears, 0),
      },
    };

    // Calculate using the Core Engine. A partial profile yields no score.
    const outcome = calculateReputation(validatedData);

    // Save Real Financial Record
    const recordToSave: UserFinancialRecord = {
      userId,
      ...validatedData,
      updatedAt: new Date().toISOString(),
    };
    saveUserFinancialData(userId, recordToSave);

    // Score history is only written when a real score exists. Nothing is
    // recorded for an insufficient outcome.
    let updatedHistory = getUserScoreHistory(userId);
    if (outcome.status === 'scored') {
      updatedHistory = recordScoreHistory(
        userId,
        outcome.result.score,
        outcome.result.level,
        'User financial data updated'
      );
    }

    return NextResponse.json({
      mode: 'real',
      userId,
      hasData: true,
      status: outcome.status,
      outcome,
      reputation: outcome.status === 'scored' ? outcome.result : null,
      reason: outcome.status === 'insufficient' ? outcome.reason : undefined,
      history: updatedHistory,
      financialData: recordToSave,
      message:
        outcome.status === 'scored'
          ? 'Financial data updated and reputation recalculated engine-side.'
          : 'Financial data saved. FRL requires evidence for every reputation factor before a score can be produced.',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid financial data payload provided.' },
      { status: 400 }
    );
  }
}
