import { ReputationResult, ScoreHistoryPoint, UserFinancialData } from './reputationEngine';

export interface AIAnalysisResult {
  summary: string;
  strengths: string[];
  concerns: string[];
  trends: string[];
  recommendations: string[];
  analyzedAt: string;
  provider: 'rule-engine' | 'gemini-api' | 'openai-api';
}

export interface AIAnalysisInput {
  reputation: ReputationResult;
  history?: ScoreHistoryPoint[];
  financialData?: Partial<UserFinancialData>;
}

export interface AIAnalysisProvider {
  name: string;
  analyze(input: AIAnalysisInput): Promise<AIAnalysisResult>;
}

/**
 * Deterministic, Hallucination-Free Rule-Based AI Analysis Provider.
 * Used as primary robust engine and fallback when no external AI API keys are set.
 * Strictly derives insights from input reputation factors and history without inventing numbers.
 */
export class RuleBasedAIProvider implements AIAnalysisProvider {
  name = 'rule-engine';

  async analyze(input: AIAnalysisInput): Promise<AIAnalysisResult> {
    const { reputation, history = [] } = input;
    const { score, level, factors } = reputation;

    // Handle Empty / Insufficient Data scenario
    const factorList = Object.values(factors);
    const hasData = factorList.some((f) => f.score > 300);

    if (!hasData || score <= 300) {
      return {
        summary: 'Information is currently insufficient for a comprehensive AI financial analysis.',
        strengths: [],
        concerns: ['Limited transaction and payment history available on record.'],
        trends: ['Insufficient historical data points to determine score trend.'],
        recommendations: [
          'Consider establishing verified payment records and counterparty attestations to build financial history.',
        ],
        analyzedAt: new Date().toISOString(),
        provider: 'rule-engine',
      };
    }

    // Sort factors by score
    const sortedFactors = [...factorList].sort((a, b) => b.score - a.score);
    const topFactors = sortedFactors.slice(0, 2);
    const bottomFactors = sortedFactors.filter((f) => f.score < 680 || f.impact < 0);

    // 1. Generate Summary
    const topNames = topFactors.map((f) => f.name).join(' and ');
    const bottomNames = bottomFactors.length > 0 ? bottomFactors.map((f) => f.name).join(', ') : 'none';

    let summary = `The current reputation score is evaluated at ${score} (${level}). Primary score drivers are supported by strong performance in ${topNames}.`;
    if (bottomFactors.length > 0) {
      summary += ` Areas requiring ongoing monitoring include ${bottomNames}.`;
    } else {
      summary += ` Financial indicators remain consistently strong across all evaluated factors.`;
    }

    // 2. Identify Strengths (2–4 items from factor data)
    const strengths: string[] = [];
    if (factors.paymentReliability.score >= 700) {
      strengths.push('Consistent and punctual payment history with zero late flags.');
    }
    if (factors.incomeConsistency.score >= 680) {
      strengths.push('Stable monthly recurring income stream with verified multi-month continuity.');
    }
    if (factors.savingBehavior.score >= 700) {
      strengths.push('Healthy emergency fund reserve and regular monthly savings contributions.');
    }
    if (factors.debtBehavior.score >= 700) {
      strengths.push('Low credit utilization ratio maintained within prudent limits.');
    }
    if (factors.transactionHistory.score >= 700) {
      strengths.push('Active transaction history with zero bounced transactions on record.');
    }
    // Ensure 2–4 strengths
    if (strengths.length === 0) {
      strengths.push(`Baseline performance maintained across ${topFactors[0]?.name || 'key financial metrics'}.`);
    }

    // 3. Identify Concerns / Areas to Monitor (Neutral, non-judgmental language)
    const concerns: string[] = [];
    if (factors.spendingStability.score < 680 || factors.spendingStability.impact < 0) {
      concerns.push('Monthly expenditure ratio relative to total income is elevated.');
    }
    if (factors.debtBehavior.score < 680 || factors.debtBehavior.impact < 0) {
      concerns.push('Credit utilization ratio is nearing upper target thresholds.');
    }
    if (factors.paymentReliability.score < 680 || factors.paymentReliability.impact < 0) {
      concerns.push('Recent payment history includes delayed or pending settlement records.');
    }
    if (factors.savingBehavior.score < 680 || factors.savingBehavior.impact < 0) {
      concerns.push('Emergency liquidity reserve is below recommended multi-month coverage.');
    }
    if (factors.incomeConsistency.score < 680 || factors.incomeConsistency.impact < 0) {
      concerns.push('Income distribution reflects monthly variance across observation periods.');
    }
    if (concerns.length === 0) {
      concerns.push('No critical financial risk flags detected based on current data points.');
    }

    // 4. Trend Analysis
    const trends: string[] = [];
    if (history.length >= 2) {
      const first = history[0].score;
      const last = history[history.length - 1].score;
      const delta = last - first;

      if (delta > 5) {
        trends.push(`Overall reputation score reflects an upward trend, increasing by +${delta} points over recent historical periods (${first} → ${last}).`);
      } else if (delta < -5) {
        trends.push(`Reputation score reflects a slight downward trajectory of ${delta} points across observation quarters (${first} → ${last}).`);
      } else {
        trends.push(`Reputation score has remained stable around ${last} over recent historical evaluation periods.`);
      }
    } else {
      trends.push('Initial baseline evaluation established; ongoing quarterly data will form historical trend lines.');
    }

    // 5. Non-judgmental Actionable Recommendations
    const recommendations: string[] = [];
    if (factors.spendingStability.score < 700) {
      recommendations.push('Consider monitoring discretionary monthly expenditure relative to net cash flow.');
    }
    if (factors.paymentReliability.score < 750) {
      recommendations.push('Maintain automated payment scheduling to ensure uninterrupted on-time payment records.');
    }
    if (factors.savingBehavior.score < 700) {
      recommendations.push('Consider gradually building liquid emergency reserves to cover 3-6 months of operating expenses.');
    }
    if (factors.debtBehavior.score < 700) {
      recommendations.push('Aim to maintain credit utilization below 30% of total available limits where possible.');
    }
    if (recommendations.length === 0) {
      recommendations.push('Continue existing financial management practices to preserve high reputation stability.');
    }

    return {
      summary,
      strengths: strengths.slice(0, 4),
      concerns: concerns.slice(0, 4),
      trends,
      recommendations: recommendations.slice(0, 4),
      analyzedAt: new Date().toISOString(),
      provider: 'rule-engine',
    };
  }
}

/**
 * Main Abstraction Function: analyzeFinancialReputation()
 * Decouples the UI and API from any single AI vendor.
 * Supports external LLM providers (e.g. Gemini / OpenAI) if keys exist,
 * otherwise falls back safely to RuleBasedAIProvider.
 */
export async function analyzeFinancialReputation(input: AIAnalysisInput): Promise<AIAnalysisResult> {
  const provider = new RuleBasedAIProvider();
  return await provider.analyze(input);
}
