/**
 * Core Financial Reputation Engine (FRL)
 * 
 * Rules:
 * - Scores are strictly bounded between 300 and 850.
 * - Factor weights are configurable via FACTOR_WEIGHTS.
 * - Scores are calculated server-side/engine-side from financial data; cannot be mutated directly.
 * - Maps factor breakdowns to the 6 FRL Reputation Axes:
 *   1. Payment Reliability    -> Reliability Axis
 *   2. Income Consistency     -> Stability Axis
 *   3. Spending Stability     -> Resilience Axis
 *   4. Saving Behavior        -> Data Confidence Axis
 *   5. Debt / Credit Behavior -> Leverage Axis
 *   6. Transaction History    -> Track Record Axis
 */

export type ReputationLevel = 'Low' | 'Fair' | 'Good' | 'Excellent';

export interface UserFinancialData {
  income: {
    monthly: number;
    stabilityMonths: number;
    sourcesCount: number;
  };
  expenses: {
    monthlyAvg: number;
    discretionaryRatio: number; // 0 to 1
  };
  payments: {
    totalDue: number;
    onTimeCount: number;
    lateCount: number;
    missedCount: number;
  };
  savings: {
    currentBalance: number;
    monthlyContribution: number;
    emergencyFundMonths: number;
  };
  debts: {
    totalDebt: number;
    creditLimit: number;
    utilizationRatio: number; // 0 to 1
    monthlyDebtService: number;
  };
  transactions: {
    count6Months: number;
    bouncedCount: number;
    oldestAccountYears: number;
  };
}

export interface FactorDetail {
  name: string;
  score: number; // 300–850
  level: ReputationLevel;
  impact: number;
  weight: number;
  refAxis: string;
}

export interface ReputationResult {
  score: number; // 300–850
  level: ReputationLevel;
  factors: {
    paymentReliability: FactorDetail;
    incomeConsistency: FactorDetail;
    spendingStability: FactorDetail;
    savingBehavior: FactorDetail;
    debtBehavior: FactorDetail;
    transactionHistory: FactorDetail;
  };
  calculatedAt: string;
}

export interface ScoreHistoryPoint {
  date: string;
  score: number;
  level: ReputationLevel;
}

// Configurable Factor Weights (Total = 1.0)
export const FACTOR_WEIGHTS = {
  paymentReliability: 0.30,
  incomeConsistency: 0.20,
  spendingStability: 0.15,
  savingBehavior: 0.15,
  debtBehavior: 0.10,
  transactionHistory: 0.10,
};

// Clamp function to enforce 300–850 range strictly
export function clampScore(value: number): number {
  return Math.min(850, Math.max(300, Math.round(value)));
}

// 2. Reputation Level calculation
export function getReputationLevel(score: number): ReputationLevel {
  if (score >= 750) return 'Excellent';
  if (score >= 650) return 'Good';
  if (score >= 500) return 'Fair';
  return 'Low';
}

// 3. Impact calculation (+12, -4, etc.)
export function getScoreImpact(factorScore: number, averageScore: number): number {
  const diff = factorScore - averageScore;
  return Math.round(diff * 0.15);
}

// Individual Factor Calculators
export function calculatePaymentReliability(payments: UserFinancialData['payments']): number {
  const total = payments.onTimeCount + payments.lateCount + payments.missedCount;
  if (total === 0) return 550; // Baseline when no history

  const onTimeRatio = payments.onTimeCount / total;
  const penalty = (payments.lateCount * 30) + (payments.missedCount * 80);

  const raw = 300 + (onTimeRatio * 550) - penalty;
  return clampScore(raw);
}

export function calculateIncomeConsistency(income: UserFinancialData['income']): number {
  if (income.monthly === 0) return 350;

  let base = 500;
  // Stability months boost
  base += Math.min(200, income.stabilityMonths * 10);
  // Source diversification boost
  base += Math.min(50, (income.sourcesCount - 1) * 25);
  // Income volume scale
  if (income.monthly >= 100000) base += 100;
  else if (income.monthly >= 50000) base += 60;
  else if (income.monthly >= 20000) base += 30;

  return clampScore(base);
}

export function calculateSpendingStability(
  income: UserFinancialData['income'],
  expenses: UserFinancialData['expenses']
): number {
  if (income.monthly === 0) return 350;

  const expenseRatio = expenses.monthlyAvg / income.monthly;
  let score = 750;

  if (expenseRatio > 1.0) score -= 250; // Spending > Income
  else if (expenseRatio > 0.8) score -= 150;
  else if (expenseRatio > 0.6) score -= 50;
  else score += 50;

  // Discretionary spending ratio penalty
  if (expenses.discretionaryRatio > 0.5) {
    score -= (expenses.discretionaryRatio - 0.5) * 200;
  }

  return clampScore(score);
}

export function calculateSavingBehavior(
  savings: UserFinancialData['savings'],
  income: UserFinancialData['income']
): number {
  let score = 400;

  // Emergency fund months boost
  score += Math.min(250, savings.emergencyFundMonths * 40);

  // Monthly contribution ratio boost
  if (income.monthly > 0) {
    const saveRate = savings.monthlyContribution / income.monthly;
    score += Math.min(200, saveRate * 1000);
  }

  return clampScore(score);
}

export function calculateDebtBehavior(
  debts: UserFinancialData['debts'],
  income: UserFinancialData['income']
): number {
  let score = 800;

  // Credit utilization penalty
  if (debts.utilizationRatio > 0.8) score -= 250;
  else if (debts.utilizationRatio > 0.5) score -= 150;
  else if (debts.utilizationRatio > 0.3) score -= 50;

  // Debt service to income ratio
  if (income.monthly > 0) {
    const dti = debts.monthlyDebtService / income.monthly;
    if (dti > 0.5) score -= 200;
    else if (dti > 0.35) score -= 100;
  }

  return clampScore(score);
}

export function calculateTransactionHistory(transactions: UserFinancialData['transactions']): number {
  let score = 450;

  // Transaction frequency boost
  score += Math.min(150, (transactions.count6Months / 50) * 150);

  // Account age boost
  score += Math.min(150, transactions.oldestAccountYears * 25);

  // Bounced transaction severe penalty
  score -= transactions.bouncedCount * 120;

  return clampScore(score);
}

// Main Engine Calculator
export function calculateReputation(data?: Partial<UserFinancialData>): ReputationResult {
  const defaultData: UserFinancialData = {
    income: { monthly: 65000, stabilityMonths: 24, sourcesCount: 2 },
    expenses: { monthlyAvg: 38000, discretionaryRatio: 0.25 },
    payments: { totalDue: 12, onTimeCount: 12, lateCount: 0, missedCount: 0 },
    savings: { currentBalance: 240000, monthlyContribution: 12000, emergencyFundMonths: 6 },
    debts: { totalDebt: 80000, creditLimit: 300000, utilizationRatio: 0.26, monthlyDebtService: 8500 },
    transactions: { count6Months: 180, bouncedCount: 0, oldestAccountYears: 5 },
  };

  const input: UserFinancialData = {
    income: { ...defaultData.income, ...data?.income },
    expenses: { ...defaultData.expenses, ...data?.expenses },
    payments: { ...defaultData.payments, ...data?.payments },
    savings: { ...defaultData.savings, ...data?.savings },
    debts: { ...defaultData.debts, ...data?.debts },
    transactions: { ...defaultData.transactions, ...data?.transactions },
  };

  const relScore = calculatePaymentReliability(input.payments);
  const incScore = calculateIncomeConsistency(input.income);
  const expScore = calculateSpendingStability(input.income, input.expenses);
  const savScore = calculateSavingBehavior(input.savings, input.income);
  const dbtScore = calculateDebtBehavior(input.debts, input.income);
  const trxScore = calculateTransactionHistory(input.transactions);

  const rawComposite =
    (relScore * FACTOR_WEIGHTS.paymentReliability) +
    (incScore * FACTOR_WEIGHTS.incomeConsistency) +
    (expScore * FACTOR_WEIGHTS.spendingStability) +
    (savScore * FACTOR_WEIGHTS.savingBehavior) +
    (dbtScore * FACTOR_WEIGHTS.debtBehavior) +
    (trxScore * FACTOR_WEIGHTS.transactionHistory);

  const finalScore = clampScore(rawComposite);

  const factors = {
    paymentReliability: {
      name: 'Payment Reliability',
      score: relScore,
      level: getReputationLevel(relScore),
      impact: getScoreImpact(relScore, finalScore),
      weight: FACTOR_WEIGHTS.paymentReliability,
      refAxis: 'reliability',
    },
    incomeConsistency: {
      name: 'Income Consistency',
      score: incScore,
      level: getReputationLevel(incScore),
      impact: getScoreImpact(incScore, finalScore),
      weight: FACTOR_WEIGHTS.incomeConsistency,
      refAxis: 'stability',
    },
    spendingStability: {
      name: 'Spending Stability',
      score: expScore,
      level: getReputationLevel(expScore),
      impact: getScoreImpact(expScore, finalScore),
      weight: FACTOR_WEIGHTS.spendingStability,
      refAxis: 'resilience',
    },
    savingBehavior: {
      name: 'Saving Behavior',
      score: savScore,
      level: getReputationLevel(savScore),
      impact: getScoreImpact(savScore, finalScore),
      weight: FACTOR_WEIGHTS.savingBehavior,
      refAxis: 'data_confidence',
    },
    debtBehavior: {
      name: 'Debt / Credit Behavior',
      score: dbtScore,
      level: getReputationLevel(dbtScore),
      impact: getScoreImpact(dbtScore, finalScore),
      weight: FACTOR_WEIGHTS.debtBehavior,
      refAxis: 'leverage',
    },
    transactionHistory: {
      name: 'Transaction History',
      score: trxScore,
      level: getReputationLevel(trxScore),
      impact: getScoreImpact(trxScore, finalScore),
      weight: FACTOR_WEIGHTS.transactionHistory,
      refAxis: 'track_record',
    },
  };

  return {
    score: finalScore,
    level: getReputationLevel(finalScore),
    factors,
    calculatedAt: new Date().toISOString(),
  };
}

export function generateFactorSummary(factors: ReputationResult['factors']) {
  const getLabel = (score: number, highLabel = 'Strong', midHighLabel = 'Good', midLabel = 'Moderate', lowLabel = 'Weak') => {
    if (score >= 750) return highLabel;
    if (score >= 650) return midHighLabel;
    if (score >= 500) return midLabel;
    return lowLabel;
  };

  return {
    paymentReliability: getLabel(factors.paymentReliability.score, 'Strong', 'Good', 'Moderate', 'Needs Improvement'),
    incomeConsistency: getLabel(factors.incomeConsistency.score, 'Stable', 'Stable', 'Moderate', 'Variable'),
    spendingStability: getLabel(factors.spendingStability.score, 'Strong', 'Stable', 'Moderate', 'Variable'),
    savingBehavior: getLabel(factors.savingBehavior.score, 'Strong', 'Good', 'Moderate', 'Low'),
    debtBehavior: getLabel(factors.debtBehavior.score, 'Strong', 'Moderate', 'Elevated', 'High Risk'),
    transactionHistory: getLabel(factors.transactionHistory.score, 'Strong', 'Good', 'Moderate', 'Limited'),
  };
}

