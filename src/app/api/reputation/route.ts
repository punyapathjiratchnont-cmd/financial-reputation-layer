import { NextResponse } from 'next/server';
import { calculateReputation } from '@/lib/reputationEngine';
import { MOCK_FINANCIAL_PROFILES } from '@/lib/mockFinancialData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const profileKey = searchParams.get('profile') || 'normal';

  const selected = MOCK_FINANCIAL_PROFILES[profileKey] || MOCK_FINANCIAL_PROFILES.normal;
  const result = calculateReputation(selected.data);

  return NextResponse.json({
    profile: selected.label,
    reputation: result,
    history: selected.history,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Security check: Ignore any direct 'score' or 'level' parameter sent in payload
    // Scores are STRICTLY calculated engine-side from financial input parameters!
    const { income, expenses, payments, savings, debts, transactions } = body;

    const result = calculateReputation({
      income,
      expenses,
      payments,
      savings,
      debts,
      transactions,
    });

    return NextResponse.json({
      reputation: result,
      message: 'Reputation score successfully calculated by engine server-side.',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid financial data format for engine calculation.' },
      { status: 400 }
    );
  }
}
