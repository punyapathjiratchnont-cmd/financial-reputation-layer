import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateReputation,
  calculatePaymentReliability,
  calculateDebtBehavior,
  calculateBusinessReliability,
  evaluateProofEligibility,
  generateFactorSummary,
  getReputationLevel,
  FACTOR_WEIGHTS,
  ReputationOutcome,
  UserFinancialData,
} from '../reputationEngine';
import { RuleBasedAIProvider } from '../aiAnalysisService';
import type { Claim } from '../types';

/**
 * REAL EVIDENCE -> REAL REPUTATION
 * NO EVIDENCE -> INSUFFICIENT DATA
 *
 * Every path in this file previously produced a number out of nothing:
 * a fabricated default financial profile (score 808 / "Excellent") and six
 * hardcoded baselines (score 473 / "Low", with debt scoring a perfect 800 on
 * no debt evidence at all).
 */

const ZERO: UserFinancialData = {
  income: { monthly: 0, stabilityMonths: 0, sourcesCount: 0 },
  expenses: { monthlyAvg: 0, discretionaryRatio: 0 },
  payments: { totalDue: 0, onTimeCount: 0, lateCount: 0, missedCount: 0 },
  savings: { currentBalance: 0, monthlyContribution: 0, emergencyFundMonths: 0 },
  debts: { totalDebt: 0, creditLimit: 0, utilizationRatio: 0, monthlyDebtService: 0 },
  transactions: { count6Months: 0, bouncedCount: 0, oldestAccountYears: 0 },
};

const COMPLETE: UserFinancialData = {
  income: { monthly: 75000, stabilityMonths: 36, sourcesCount: 2 },
  expenses: { monthlyAvg: 42000, discretionaryRatio: 0.2 },
  payments: { totalDue: 24, onTimeCount: 24, lateCount: 0, missedCount: 0 },
  savings: { currentBalance: 350000, monthlyContribution: 15000, emergencyFundMonths: 8 },
  debts: { totalDebt: 120000, creditLimit: 500000, utilizationRatio: 0.24, monthlyDebtService: 12000 },
  transactions: { count6Months: 240, bouncedCount: 0, oldestAccountYears: 6 },
};

function scoreOf(outcome: ReputationOutcome): number | null {
  return outcome.status === 'scored' ? outcome.result.score : null;
}

function levelOf(outcome: ReputationOutcome): string | null {
  return outcome.status === 'scored' ? outcome.result.level : null;
}

describe('calculateReputation — no evidence', () => {
  it('calculateReputation(undefined) is insufficient, never a score', () => {
    const outcome = calculateReputation(undefined);

    assert.equal(outcome.status, 'insufficient');
    assert.equal(scoreOf(outcome), null);
    assert.equal(levelOf(outcome), null);
    assert.ok(!('result' in outcome), 'an insufficient outcome must carry no result object');
  });

  it('calculateReputation(null) is insufficient too', () => {
    assert.equal(calculateReputation(null).status, 'insufficient');
  });

  it('all-zero evidence is insufficient', () => {
    const outcome = calculateReputation(ZERO);

    assert.equal(outcome.status, 'insufficient');
    assert.equal(scoreOf(outcome), null);
    assert.equal(levelOf(outcome), null);

    for (const factor of Object.values(outcome.factors)) {
      assert.equal(factor.score, null, `${factor.name} must not have a score`);
      assert.equal(factor.level, null, `${factor.name} must not have a level`);
      assert.equal(factor.impact, null, `${factor.name} must not have an impact`);
      assert.equal(factor.isSufficient, false);
      assert.ok(factor.missingEvidence, `${factor.name} must name the missing evidence`);
    }
  });

  it('an empty object is insufficient', () => {
    assert.equal(calculateReputation({}).status, 'insufficient');
  });
});

describe('factor evidence gates', () => {
  it('missing payment evidence yields null, not the old 550 baseline', () => {
    assert.equal(calculatePaymentReliability(ZERO.payments), null);
    assert.notEqual(calculatePaymentReliability(ZERO.payments), 550);

    const withPayments = { ...ZERO, payments: { totalDue: 12, onTimeCount: 12, lateCount: 0, missedCount: 0 } };
    assert.equal(calculatePaymentReliability(withPayments.payments), 850);
  });

  it('missing debt evidence yields null, never 800 and never "Strong"', () => {
    const debtScore = calculateDebtBehavior(ZERO.debts, ZERO.income);

    assert.equal(debtScore, null);
    assert.notEqual(debtScore, 800, 'absence of debt evidence must not be a perfect score');

    const outcome = calculateReputation(ZERO);
    assert.equal(outcome.factors.debtBehavior.score, null);
    assert.equal(outcome.factors.debtBehavior.level, null);
    assert.equal(outcome.factors.debtBehavior.isSufficient, false);

    const summary = generateFactorSummary(outcome.factors);
    assert.notEqual(summary.debtBehavior, 'Strong');
    assert.equal(summary.debtBehavior, 'Insufficient Data');
  });

  it('debt evidence that is present still produces a score', () => {
    const debtScore = calculateDebtBehavior(COMPLETE.debts, COMPLETE.income);
    assert.equal(typeof debtScore, 'number');
    assert.ok((debtScore as number) >= 300 && (debtScore as number) <= 850);
  });
});

describe('composite requires all six factors', () => {
  const cases: Array<[string, Partial<UserFinancialData>]> = [
    ['payments', { payments: ZERO.payments, debts: COMPLETE.debts }],
    ['income', { income: ZERO.income, debts: COMPLETE.debts }],
    ['spending', { expenses: ZERO.expenses, debts: COMPLETE.debts }],
    ['savings', { savings: ZERO.savings, debts: COMPLETE.debts }],
    ['debts', { debts: ZERO.debts }],
    ['transactions', { transactions: ZERO.transactions, debts: COMPLETE.debts }],
  ];

  for (const [name, override] of cases) {
    it(`removing ${name} evidence makes the whole reputation insufficient`, () => {
      const outcome = calculateReputation({ ...COMPLETE, ...override });

      assert.equal(outcome.status, 'insufficient');
      assert.equal(scoreOf(outcome), null);
      assert.equal(levelOf(outcome), null);
    });
  }

  it('complete evidence for all six factors does produce a score', () => {
    const outcome = calculateReputation(COMPLETE);

    assert.equal(outcome.status, 'scored');
    if (outcome.status !== 'scored') return;

    const score = outcome.result.score;
    assert.ok(score >= 300 && score <= 850, `score ${score} must stay inside 300-850`);
    assert.ok(['Low', 'Fair', 'Good', 'Excellent'].includes(outcome.result.level));

    for (const factor of Object.values(outcome.result.factors)) {
      assert.equal(factor.isSufficient, true);
      assert.equal(typeof factor.score, 'number');
      assert.notEqual(factor.level, null);
    }
  });

  it('the weights still sum to 1.0', () => {
    const total = Object.values(FACTOR_WEIGHTS).reduce((sum, w) => sum + w, 0);
    assert.ok(Math.abs(total - 1) < 1e-9);
  });
});

describe('null can never become a level', () => {
  it('getReputationLevel rejects null and NaN', () => {
    assert.throws(
      () => getReputationLevel(null as unknown as number),
      /must never be converted into a reputation level/
    );
    assert.throws(() => getReputationLevel(Number.NaN));
    assert.throws(() => getReputationLevel(undefined as unknown as number));
  });

  it('an insufficient outcome contains no reputation level anywhere', () => {
    const outcome = calculateReputation(ZERO);
    const levels = Object.values(outcome.factors).map((f) => f.level);

    for (const level of levels) {
      assert.equal(level, null);
    }
    assert.ok(
      !levels.includes('Low' as never) &&
        !levels.includes('Fair' as never) &&
        !levels.includes('Good' as never) &&
        !levels.includes('Excellent' as never)
    );
  });
});

describe('generateFactorSummary', () => {
  it('maps a null factor to "Insufficient Data"', () => {
    const summary = generateFactorSummary(calculateReputation(ZERO).factors);

    for (const value of Object.values(summary)) {
      assert.equal(value, 'Insufficient Data');
    }
  });

  it('labels scored factors normally', () => {
    const outcome = calculateReputation(COMPLETE);
    if (outcome.status !== 'scored') return;

    const summary = generateFactorSummary(outcome.result.factors);
    for (const value of Object.values(summary)) {
      assert.notEqual(value, 'Insufficient Data');
    }
  });
});

describe('proof eligibility — a proof requires real evidence', () => {
  it('calculateReputation(undefined) makes proof creation ineligible', () => {
    const eligibility = evaluateProofEligibility(calculateReputation(undefined));

    assert.equal(eligibility.eligible, false);
    if (eligibility.eligible) return;
    assert.equal(eligibility.code, 'REPUTATION_INSUFFICIENT_EVIDENCE');
  });

  it('a user with no financial data cannot create a reputation proof', () => {
    // Exactly what proof/route.ts does for a user with no stored record.
    const financialData = null;
    const outcome = calculateReputation(financialData);
    const eligibility = evaluateProofEligibility(outcome);

    assert.equal(outcome.status, 'insufficient');
    assert.equal(eligibility.eligible, false);
    assert.ok(
      !('payload' in eligibility),
      'no score, level or factor summary may exist, so nothing can be persisted'
    );
  });

  it('partial evidence is still ineligible for a proof', () => {
    const partial = { ...COMPLETE, transactions: ZERO.transactions };
    const eligibility = evaluateProofEligibility(calculateReputation(partial));

    assert.equal(eligibility.eligible, false);
    if (eligibility.eligible) return;
    assert.equal(eligibility.code, 'REPUTATION_INSUFFICIENT_EVIDENCE');
    assert.ok(!('payload' in eligibility));
  });

  it('the eligibility gate carries the stable error code the route returns', () => {
    const eligibility = evaluateProofEligibility(calculateReputation(ZERO));
    if (eligibility.eligible) return;

    // proof/route.ts answers with this exact code and HTTP 409.
    assert.equal(eligibility.code, 'REPUTATION_INSUFFICIENT_EVIDENCE');
    assert.equal(typeof eligibility.message, 'string');
    assert.ok(eligibility.message.length > 0);
  });

  it('complete evidence produces a proof payload', () => {
    const eligibility = evaluateProofEligibility(calculateReputation(COMPLETE));

    assert.equal(eligibility.eligible, true);
    if (!eligibility.eligible) return;

    assert.ok(eligibility.payload.score >= 300 && eligibility.payload.score <= 850);
    assert.ok(['Low', 'Fair', 'Good', 'Excellent'].includes(eligibility.payload.level));
    assert.ok(eligibility.payload.factorSummary);
  });
});

describe('Business Reliability is claim-based, never personal finance', () => {
  it('calculateBusinessReliability(undefined) is insufficient', () => {
    const result = calculateBusinessReliability(undefined);

    assert.equal(result.score, null);
    assert.equal(result.label, 'Insufficient Data');
    assert.equal(result.isSufficient, false);
  });

  it('an empty claim list is insufficient', () => {
    assert.equal(calculateBusinessReliability([]).score, null);
  });

  it('it reads only claims, so identical personal finance yields identical results', () => {
    // The signature has no financial parameter at all: personal transaction and
    // payment behaviour cannot reach it.
    assert.equal(calculateBusinessReliability.length, 1);

    const poor = calculateBusinessReliability([]);
    const rich = calculateBusinessReliability([]);
    assert.deepEqual(poor, rich);
  });

  it('a real verified counterparty claim does produce evidence', () => {
    const claims: Claim[] = [
      {
        id: 'claim_1',
        company_id: 'c1',
        statement_text: 'Counterparty attested on-time settlement.',
        axis_ref: 'reliability',
        evidence_tier: 'counterparty_attested',
        status: 'active',
        created_at: '2026-01-01T00:00:00.000Z',
        expires_at: '2027-01-01T00:00:00.000Z',
      },
    ];

    const result = calculateBusinessReliability(claims);
    assert.equal(result.isSufficient, true);
    assert.equal(typeof result.score, 'number');
  });
});

describe('RuleBasedAIProvider — no conclusions from missing evidence', () => {
  const provider = new RuleBasedAIProvider();

  it('produces no strengths and no conclusions for insufficient evidence', async () => {
    const analysis = await provider.analyze({
      reputation: calculateReputation(undefined),
      history: [],
      financialData: undefined,
    });

    assert.deepEqual(analysis.strengths, []);
    assert.deepEqual(analysis.concerns, []);
    assert.deepEqual(analysis.trends, []);
    assert.deepEqual(analysis.recommendations, []);

    const allText = [
      analysis.summary,
      ...analysis.strengths,
      ...analysis.concerns,
      ...analysis.trends,
      ...analysis.recommendations,
    ]
      .join(' ')
      .toLowerCase();

    assert.doesNotMatch(allText, /no critical financial risk flags detected/);
    assert.doesNotMatch(allText, /baseline performance maintained/);
    assert.doesNotMatch(allText, /excellent|strong|stable|good/);
    assert.match(analysis.summary, /insufficient evidence/i);
  });

  it('all-zero evidence produces no conclusions either', async () => {
    const analysis = await provider.analyze({
      reputation: calculateReputation(ZERO),
      history: [{ date: '2024-01-01', score: 480, level: 'Low' }],
      financialData: ZERO,
    });

    assert.deepEqual(analysis.strengths, []);
    assert.deepEqual(analysis.concerns, []);
    assert.equal(analysis.provider, 'rule-engine');
  });

  it('partial evidence produces no conclusions either', async () => {
    const analysis = await provider.analyze({
      reputation: calculateReputation({ ...COMPLETE, savings: ZERO.savings }),
      history: [],
    });

    assert.deepEqual(analysis.strengths, []);
    assert.deepEqual(analysis.concerns, []);
  });

  it('complete evidence still produces a real analysis', async () => {
    const outcome = calculateReputation(COMPLETE);
    assert.equal(outcome.status, 'scored');
    if (outcome.status !== 'scored') return;

    const analysis = await provider.analyze({ reputation: outcome, history: [] });
    assert.equal(analysis.provider, 'rule-engine');
    assert.match(analysis.summary, /reputation score is evaluated at/i);
  });
});
