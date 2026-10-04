/**
 * Core Financial Reputation Engine (FRL)
 *
 * ABSOLUTE EVIDENCE POLICY:
 *   NO EVIDENCE      -> INSUFFICIENT DATA
 *   PARTIAL EVIDENCE -> INSUFFICIENT DATA
 *   ALL SIX FACTORS WITH EVIDENCE -> SCORE
 *
 * There is deliberately:
 *   - NO default financial profile
 *   - NO baseline score for a missing factor
 *   - NO numeric sentinel standing in for "unknown"
 *
 * A factor with no evidence returns `null`. A single `null` factor makes the
 * whole reputation insufficient: `score` is `null` and `level` is `null`.
 * `null` is never clamped, averaged, weighted, or passed to getReputationLevel().
 *
 * Scores that DO exist are bounded 300-850 by clampScore().
 */

import { Claim } from './types';
import type { FactorSummary } from './types';

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
  /** null means this factor has no evidence. It is never replaced by a baseline. */
  score: number | null;
  /** null whenever `score` is null. Never derived from missing evidence. */
  level: ReputationLevel | null;
  /** null whenever `score` is null. */
  impact: number | null;
  weight: number;
  refAxis: string;
  isSufficient: boolean;
  /** Only present when isSufficient === false. Names the absent evidence. */
  missingEvidence?: string;
}

export interface ReputationFactors {
  paymentReliability: FactorDetail;
  incomeConsistency: FactorDetail;
  spendingStability: FactorDetail;
  savingBehavior: FactorDetail;
  debtBehavior: FactorDetail;
  transactionHistory: FactorDetail;
}

/**
 * A factor that genuinely has evidence.
 * The non-null types here are what stop downstream code (including the AI
 * layer) from ever comparing or averaging a score that does not exist.
 */
export interface ScoredFactorDetail
  extends Omit<FactorDetail, 'score' | 'level' | 'impact' | 'isSufficient'> {
  score: number;
  level: ReputationLevel;
  impact: number;
  isSufficient: true;
}

export interface ScoredFactors {
  paymentReliability: ScoredFactorDetail;
  incomeConsistency: ScoredFactorDetail;
  spendingStability: ScoredFactorDetail;
  savingBehavior: ScoredFactorDetail;
  debtBehavior: ScoredFactorDetail;
  transactionHistory: ScoredFactorDetail;
}

/** Present only when every required factor had evidence. */
export interface ReputationResult {
  score: number; // 300-850
  level: ReputationLevel;
  factors: ScoredFactors;
  calculatedAt: string;
}

export type ReputationOutcome =
  | { status: 'scored'; result: ReputationResult; factors: ScoredFactors }
  | { status: 'insufficient'; reason: string; factors: ReputationFactors };

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

// Clamp function to enforce 300-850 range strictly. Applied ONLY to real scores.
export function clampScore(value: number): number {
  return Math.min(850, Math.max(300, Math.round(value)));
}

/**
 * Reputation Level calculation.
 *
 * Accepts a number on purpose: TypeScript plus this runtime guard make it
 * impossible for a null/NaN score to become 'Excellent'/'Good'/'Fair'/'Low'.
 */
export function getReputationLevel(score: number): ReputationLevel {
  if (typeof score !== 'number' || !Number.isFinite(score)) {
    throw new Error(
      'FRL: getReputationLevel requires a finite numeric score. ' +
        'Missing evidence must never be converted into a reputation level.'
    );
  }
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

// ---------------------------------------------------------------------------
// EVIDENCE GATES
// Each gate answers "has this factor got any evidence at all?".
// A false gate means the factor MUST be null. It never means a default score.
// ---------------------------------------------------------------------------

export function hasPaymentEvidence(payments: UserFinancialData['payments']): boolean {
  return (
    payments.totalDue + payments.onTimeCount + payments.lateCount + payments.missedCount > 0
  );
}

export function hasIncomeEvidence(income: UserFinancialData['income']): boolean {
  return income.monthly > 0;
}

export function hasSpendingEvidence(
  income: UserFinancialData['income'],
  expenses: UserFinancialData['expenses']
): boolean {
  return income.monthly > 0 && expenses.monthlyAvg > 0;
}

export function hasSavingsEvidence(savings: UserFinancialData['savings']): boolean {
  return savings.currentBalance + savings.monthlyContribution + savings.emergencyFundMonths > 0;
}

export function hasDebtEvidence(debts: UserFinancialData['debts']): boolean {
  return (
    debts.totalDebt + debts.creditLimit + debts.utilizationRatio + debts.monthlyDebtService > 0
  );
}

export function hasTransactionEvidence(
  transactions: UserFinancialData['transactions']
): boolean {
  return transactions.count6Months + transactions.oldestAccountYears + transactions.bouncedCount > 0;
}

// ---------------------------------------------------------------------------
// FACTOR CALCULATORS — each returns number | null
// ---------------------------------------------------------------------------

export function calculatePaymentReliability(
  payments: UserFinancialData['payments']
): number | null {
  if (!hasPaymentEvidence(payments)) return null;

  const total = payments.onTimeCount + payments.lateCount + payments.missedCount;
  if (total === 0) return null;

  const onTimeRatio = payments.onTimeCount / total;
  const penalty = payments.lateCount * 30 + payments.missedCount * 80;

  const raw = 300 + onTimeRatio * 550 - penalty;
  return clampScore(raw);
}

export function calculateIncomeConsistency(income: UserFinancialData['income']): number | null {
  if (!hasIncomeEvidence(income)) return null;

  let base = 500;
  base += Math.min(200, income.stabilityMonths * 10);
  base += Math.min(50, (income.sourcesCount - 1) * 25);
  if (income.monthly >= 100000) base += 100;
  else if (income.monthly >= 50000) base += 60;
  else if (income.monthly >= 20000) base += 30;

  return clampScore(base);
}

export function calculateSpendingStability(
  income: UserFinancialData['income'],
  expenses: UserFinancialData['expenses']
): number | null {
  if (!hasSpendingEvidence(income, expenses)) return null;

  const expenseRatio = expenses.monthlyAvg / income.monthly;
  let score = 750;

  if (expenseRatio > 1.0) score -= 250; // Spending > Income
  else if (expenseRatio > 0.8) score -= 150;
  else if (expenseRatio > 0.6) score -= 50;
  else score += 50;

  if (expenses.discretionaryRatio > 0.5) {
    score -= (expenses.discretionaryRatio - 0.5) * 200;
  }

  return clampScore(score);
}

export function calculateSavingBehavior(
  savings: UserFinancialData['savings'],
  income: UserFinancialData['income']
): number | null {
  if (!hasSavingsEvidence(savings)) return null;

  let score = 400;

  score += Math.min(250, savings.emergencyFundMonths * 40);

  if (income.monthly > 0) {
    const saveRate = savings.monthlyContribution / income.monthly;
    score += Math.min(200, saveRate * 1000);
  }

  return clampScore(score);
}

export function calculateDebtBehavior(
  debts: UserFinancialData['debts'],
  income: UserFinancialData['income']
): number | null {
  // Absence of debt evidence is NOT excellent debt behaviour. It is no evidence.
  if (!hasDebtEvidence(debts)) return null;

  let score = 800;

  if (debts.utilizationRatio > 0.8) score -= 250;
  else if (debts.utilizationRatio > 0.5) score -= 150;
  else if (debts.utilizationRatio > 0.3) score -= 50;

  if (income.monthly > 0) {
    const dti = debts.monthlyDebtService / income.monthly;
    if (dti > 0.5) score -= 200;
    else if (dti > 0.35) score -= 100;
  }

  return clampScore(score);
}

export function calculateTransactionHistory(
  transactions: UserFinancialData['transactions']
): number | null {
  if (!hasTransactionEvidence(transactions)) return null;

  let score = 450;

  score += Math.min(150, (transactions.count6Months / 50) * 150);
  score += Math.min(150, transactions.oldestAccountYears * 25);
  score -= transactions.bouncedCount * 120;

  return clampScore(score);
}

/**
 * Business Reliability Calculation Mapping:
 * Business Reliability represents verified business-related evidence (e.g. counterparty attestations,
 * trade agreement fulfillments, and official business claims).
 *
 * It is derived ONLY from claims. It must never read personal financial data,
 * because a person's personal banking behaviour is not evidence about a business.
 *
 * Logic:
 * - Inspects active claims with axis_ref === 'reliability' or 'track_record' and tier 'official' | 'counterparty_attested'.
 * - If no verified counterparty attestations exist: returns null (Insufficient Data).
 * - If verified claims exist: calculates score bounded between 300 and 850 based on evidence tier & claim status.
 */
export function calculateBusinessReliability(claims?: Claim[]): {
  score: number | null;
  label: string;
  isSufficient: boolean;
  explanation: string;
} {
  if (!claims || claims.length === 0) {
    return {
      score: null,
      label: 'Insufficient Data',
      isSufficient: false,
      explanation: 'No verified counterparty attestations or business trade claims recorded.',
    };
  }

  const activeClaims = claims.filter(
    (c) => c.status === 'active' && (c.axis_ref === 'reliability' || c.axis_ref === 'track_record')
  );

  if (activeClaims.length === 0) {
    return {
      score: null,
      label: 'Insufficient Data',
      isSufficient: false,
      explanation: 'No active verified counterparty claims found for business reliability.',
    };
  }

  // Weight by evidence tier
  let baseScore = 600;
  activeClaims.forEach((c) => {
    if (c.evidence_tier === 'official') baseScore += 120;
    else if (c.evidence_tier === 'counterparty_attested') baseScore += 90;
    else baseScore += 40;
  });

  const finalScore = clampScore(baseScore);
  const level = getReputationLevel(finalScore);
  const label = level === 'Excellent' ? 'Strong' : level === 'Good' ? 'Good' : 'Moderate';

  return {
    score: finalScore,
    label,
    isSufficient: true,
    explanation: `Based on ${activeClaims.length} verified counterparty attestation(s) and business trade record(s).`,
  };
}

// ---------------------------------------------------------------------------
// FACTOR ASSEMBLY
// ---------------------------------------------------------------------------

type FactorKey = keyof ReputationFactors;

interface FactorSpec {
  key: FactorKey;
  name: string;
  weight: number;
  refAxis: string;
  missingEvidence: string;
}

const FACTOR_SPECS: readonly FactorSpec[] = [
  {
    key: 'paymentReliability',
    name: 'Payment Reliability',
    weight: FACTOR_WEIGHTS.paymentReliability,
    refAxis: 'reliability',
    missingEvidence: 'No payment obligation records have been submitted to FRL.',
  },
  {
    key: 'incomeConsistency',
    name: 'Income Consistency',
    weight: FACTOR_WEIGHTS.incomeConsistency,
    refAxis: 'stability',
    missingEvidence: 'No recurring income records have been submitted to FRL.',
  },
  {
    key: 'spendingStability',
    name: 'Spending Stability',
    weight: FACTOR_WEIGHTS.spendingStability,
    refAxis: 'resilience',
    missingEvidence: 'No income and expense records have been submitted to FRL.',
  },
  {
    key: 'savingBehavior',
    name: 'Saving Behavior',
    weight: FACTOR_WEIGHTS.savingBehavior,
    refAxis: 'data_confidence',
    missingEvidence: 'No savings or reserve records have been submitted to FRL.',
  },
  {
    key: 'debtBehavior',
    name: 'Debt / Credit Behavior',
    weight: FACTOR_WEIGHTS.debtBehavior,
    refAxis: 'leverage',
    missingEvidence: 'No debt or credit records have been submitted to FRL.',
  },
  {
    key: 'transactionHistory',
    name: 'Transaction History',
    weight: FACTOR_WEIGHTS.transactionHistory,
    refAxis: 'track_record',
    missingEvidence: 'No transaction records have been submitted to FRL.',
  },
];

const FACTOR_SPEC_BY_KEY: Readonly<Record<FactorKey, FactorSpec>> = FACTOR_SPECS.reduce(
  (acc, spec) => {
    acc[spec.key] = spec;
    return acc;
  },
  {} as Record<FactorKey, FactorSpec>
);

function buildFactor(
  spec: FactorSpec,
  score: number | null,
  composite: number | null
): FactorDetail {
  const isSufficient = score !== null;

  // A level or an impact is only ever derived from a real number.
  const level =
    isSufficient && composite !== null ? getReputationLevel(score as number) : null;
  const impact =
    isSufficient && composite !== null ? getScoreImpact(score as number, composite) : null;

  return {
    name: spec.name,
    score,
    level,
    impact,
    weight: spec.weight,
    refAxis: spec.refAxis,
    isSufficient,
    ...(isSufficient ? {} : { missingEvidence: spec.missingEvidence }),
  };
}

function buildScoredFactor(
  spec: FactorSpec,
  score: number,
  composite: number
): ScoredFactorDetail {
  return {
    name: spec.name,
    score,
    level: getReputationLevel(score),
    impact: getScoreImpact(score, composite),
    weight: spec.weight,
    refAxis: spec.refAxis,
    isSufficient: true,
  };
}

/** Builds the all-evidence factor map. Every field here is a real number. */
function buildScoredFactors(
  scores: Readonly<Record<FactorKey, number>>,
  composite: number
): ScoredFactors {
  const build = (key: FactorKey): ScoredFactorDetail =>
    buildScoredFactor(FACTOR_SPEC_BY_KEY[key], scores[key], composite);

  return {
    paymentReliability: build('paymentReliability'),
    incomeConsistency: build('incomeConsistency'),
    spendingStability: build('spendingStability'),
    savingBehavior: build('savingBehavior'),
    debtBehavior: build('debtBehavior'),
    transactionHistory: build('transactionHistory'),
  };
}

function buildFactors(
  scores: Readonly<Record<FactorKey, number | null>>,
  composite: number | null
): ReputationFactors {
  const build = (key: FactorKey) => buildFactor(FACTOR_SPEC_BY_KEY[key], scores[key], composite);

  return {
    paymentReliability: build('paymentReliability'),
    incomeConsistency: build('incomeConsistency'),
    spendingStability: build('spendingStability'),
    savingBehavior: build('savingBehavior'),
    debtBehavior: build('debtBehavior'),
    transactionHistory: build('transactionHistory'),
  };
}

// Zero-filled sections are used ONLY so an absent section reads as "no evidence".
// They are never scored: every gate below maps an all-zero section to null.
const NO_INCOME: UserFinancialData['income'] = { monthly: 0, stabilityMonths: 0, sourcesCount: 0 };
const NO_EXPENSES: UserFinancialData['expenses'] = { monthlyAvg: 0, discretionaryRatio: 0 };
const NO_PAYMENTS: UserFinancialData['payments'] = {
  totalDue: 0,
  onTimeCount: 0,
  lateCount: 0,
  missedCount: 0,
};
const NO_SAVINGS: UserFinancialData['savings'] = {
  currentBalance: 0,
  monthlyContribution: 0,
  emergencyFundMonths: 0,
};
const NO_DEBTS: UserFinancialData['debts'] = {
  totalDebt: 0,
  creditLimit: 0,
  utilizationRatio: 0,
  monthlyDebtService: 0,
};
const NO_TRANSACTIONS: UserFinancialData['transactions'] = {
  count6Months: 0,
  bouncedCount: 0,
  oldestAccountYears: 0,
};

// ---------------------------------------------------------------------------
// MAIN ENGINE
// ---------------------------------------------------------------------------

/**
 * Calculates reputation from verified financial evidence.
 *
 * STRICT POLICY: a score exists only when ALL SIX required factors have evidence.
 * Partial evidence is NOT enough; there is no partial score.
 */
export function calculateReputation(
  data?: Partial<UserFinancialData> | null
): ReputationOutcome {
  const income = data?.income ?? NO_INCOME;
  const expenses = data?.expenses ?? NO_EXPENSES;
  const payments = data?.payments ?? NO_PAYMENTS;
  const savings = data?.savings ?? NO_SAVINGS;
  const debts = data?.debts ?? NO_DEBTS;
  const transactions = data?.transactions ?? NO_TRANSACTIONS;

  const paymentReliability = calculatePaymentReliability(payments);
  const incomeConsistency = calculateIncomeConsistency(income);
  const spendingStability = calculateSpendingStability(income, expenses);
  const savingBehavior = calculateSavingBehavior(savings, income);
  const debtBehavior = calculateDebtBehavior(debts, income);
  const transactionHistory = calculateTransactionHistory(transactions);

  const scores: Record<FactorKey, number | null> = {
    paymentReliability,
    incomeConsistency,
    spendingStability,
    savingBehavior,
    debtBehavior,
    transactionHistory,
  };

  const missing = FACTOR_SPECS.filter((spec) => scores[spec.key] === null);

  if (missing.length > 0) {
    return {
      status: 'insufficient',
      reason:
        missing.length === FACTOR_SPECS.length
          ? 'No financial evidence has been submitted to FRL, so no reputation score can be produced.'
          : `FRL requires evidence for all ${FACTOR_SPECS.length} reputation factors before producing a score. ` +
            `Missing: ${missing.map((spec) => spec.name).join(', ')}.`,
      factors: buildFactors(scores, null),
    };
  }

  // Narrows all six to `number` without a cast. The `missing` guard above has
  // already returned in every case this covers; it exists so the compiler can
  // prove the weighted sum below contains no null.
  if (
    paymentReliability === null ||
    incomeConsistency === null ||
    spendingStability === null ||
    savingBehavior === null ||
    debtBehavior === null ||
    transactionHistory === null
  ) {
    return {
      status: 'insufficient',
      reason: 'One or more reputation factors have no evidence.',
      factors: buildFactors(scores, null),
    };
  }

  const rawComposite =
    paymentReliability * FACTOR_WEIGHTS.paymentReliability +
    incomeConsistency * FACTOR_WEIGHTS.incomeConsistency +
    spendingStability * FACTOR_WEIGHTS.spendingStability +
    savingBehavior * FACTOR_WEIGHTS.savingBehavior +
    debtBehavior * FACTOR_WEIGHTS.debtBehavior +
    transactionHistory * FACTOR_WEIGHTS.transactionHistory;

  const finalScore = clampScore(rawComposite);
  const factors = buildScoredFactors(
    {
      paymentReliability,
      incomeConsistency,
      spendingStability,
      savingBehavior,
      debtBehavior,
      transactionHistory,
    },
    finalScore
  );

  return {
    status: 'scored',
    result: {
      score: finalScore,
      level: getReputationLevel(finalScore),
      factors,
      calculatedAt: new Date().toISOString(),
    },
    factors,
  };
}

/**
 * Human-readable factor labels for proofs and shares.
 * A factor without evidence is labelled 'Insufficient Data', never 'Moderate'.
 */
export function generateFactorSummary(factors: ReputationFactors): FactorSummary {
  const labelFor = (
    score: number | null,
    highLabel = 'Strong',
    midHighLabel = 'Good',
    midLabel = 'Moderate',
    lowLabel = 'Weak'
  ): string => {
    if (score === null || typeof score !== 'number' || !Number.isFinite(score)) {
      return 'Insufficient Data';
    }
    if (score >= 750) return highLabel;
    if (score >= 650) return midHighLabel;
    if (score >= 500) return midLabel;
    return lowLabel;
  };

  return {
    paymentReliability: labelFor(
      factors.paymentReliability.score,
      'Strong',
      'Good',
      'Moderate',
      'Needs Improvement'
    ),
    incomeConsistency: labelFor(
      factors.incomeConsistency.score,
      'Stable',
      'Stable',
      'Moderate',
      'Variable'
    ),
    spendingStability: labelFor(
      factors.spendingStability.score,
      'Strong',
      'Stable',
      'Moderate',
      'Variable'
    ),
    savingBehavior: labelFor(factors.savingBehavior.score, 'Strong', 'Good', 'Moderate', 'Low'),
    debtBehavior: labelFor(factors.debtBehavior.score, 'Strong', 'Moderate', 'Elevated', 'High Risk'),
    transactionHistory: labelFor(
      factors.transactionHistory.score,
      'Strong',
      'Good',
      'Moderate',
      'Limited'
    ),
  };
}

// ---------------------------------------------------------------------------
// PROOF ELIGIBILITY
// ---------------------------------------------------------------------------

export type ProofEligibility =
  | {
      eligible: true;
      payload: { score: number; level: ReputationLevel; factorSummary: FactorSummary };
    }
  | { eligible: false; code: 'REPUTATION_INSUFFICIENT_EVIDENCE'; message: string };

/**
 * The single gate a caller must pass before it is allowed to persist anything.
 * Insufficient evidence yields no score, no level and no factor summary, so there
 * is nothing that could be written to storage or published.
 */
export function evaluateProofEligibility(outcome: ReputationOutcome): ProofEligibility {
  if (outcome.status !== 'scored') {
    return {
      eligible: false,
      code: 'REPUTATION_INSUFFICIENT_EVIDENCE',
      message: outcome.reason,
    };
  }

  return {
    eligible: true,
    payload: {
      score: outcome.result.score,
      level: outcome.result.level,
      factorSummary: generateFactorSummary(outcome.result.factors),
    },
  };
}
