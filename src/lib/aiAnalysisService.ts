import {
  ReputationOutcome,
  ScoreHistoryPoint,
  UserFinancialData,
} from './reputationEngine';

export interface AIAnalysisResult {
  summary: string;
  strengths: string[];
  concerns: string[];
  trends: string[];
  recommendations: string[];
  analyzedAt: string;
  provider: 'rule-engine' | 'gemini-api' | 'openai-api';
  model?: string;
  inputVersion?: string;
}

export interface AIAnalysisInput {
  userId?: string;
  reputation: ReputationOutcome;
  history?: ScoreHistoryPoint[];
  financialData?: Partial<UserFinancialData>;
}

/**
 * The only analysis FRL may produce when there is not enough evidence.
 *
 * It states the insufficiency and stops. There are no strengths, no concerns,
 * no trends and no recommendations, because each of those would be a factual
 * conclusion drawn from data FRL does not have.
 */
function insufficientEvidenceResult(
  provider: AIAnalysisResult['provider'],
  model: string
): AIAnalysisResult {
  return {
    summary:
      'Insufficient evidence. FRL has not received enough verified financial data to evaluate this ' +
      'reputation, so no score and no conclusions have been produced.',
    strengths: [],
    concerns: [],
    trends: [],
    recommendations: [],
    analyzedAt: new Date().toISOString(),
    provider,
    model,
    inputVersion: 'insufficient_v1',
  };
}

export interface AIAnalysisProvider {
  name: string;
  analyze(input: AIAnalysisInput): Promise<AIAnalysisResult>;
}

// In-Memory AI Analysis Cache (Section 10)
const AI_CACHE: Map<string, { result: AIAnalysisResult; createdAt: number }> = new Map();

function generateCacheKey(input: AIAnalysisInput): string {
  const userId = input.userId || 'default';
  const score = input.reputation.status === 'scored' ? input.reputation.result.score : 'none';
  const updatedAt = input.financialData?.income?.monthly || 0;
  return `${userId}_${score}_${updatedAt}`;
}

/**
 * Deterministic Rule-Based AI Analysis Provider (Fallback & Baseline).
 */
export class RuleBasedAIProvider implements AIAnalysisProvider {
  name = 'rule-engine';

  async analyze(input: AIAnalysisInput): Promise<AIAnalysisResult> {
    const { reputation, history = [] } = input;

    // EVIDENCE POLICY: gate on the engine's explicit outcome, never on a
    // numeric threshold such as "score > 300".
    if (reputation.status !== 'scored') {
      return insufficientEvidenceResult('rule-engine', 'rule-engine-v1');
    }

    const { score, level, factors } = reputation.result;
    const factorList = Object.values(factors);

    const sortedFactors = [...factorList].sort((a, b) => b.score - a.score);
    const topFactors = sortedFactors.slice(0, 2);
    const bottomFactors = sortedFactors.filter((f) => f.score < 680 || f.impact < 0);

    const topNames = topFactors.map((f) => f.name).join(' and ');
    const bottomNames = bottomFactors.length > 0 ? bottomFactors.map((f) => f.name).join(', ') : 'none';

    let summary = `Your current reputation score is evaluated at ${score} (${level}). Primary score drivers are supported by strong performance in ${topNames}.`;
    if (bottomFactors.length > 0) {
      summary += ` Areas requiring ongoing monitoring include ${bottomNames}.`;
    } else {
      summary += ` Financial indicators remain consistently strong across all evaluated factors.`;
    }

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
    // No fallback strength is invented when no factor clears the bar.
    // An empty list is the honest result.

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
    // No fallback concern is invented either. "No risk flags detected" would be
    // a positive factual conclusion drawn from the absence of evidence.

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
      trends.push('Not enough historical data points to determine a score trend.');
    }

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
    // No default recommendation: any recommendation here would imply proven
    // financial behaviour.

    return {
      summary,
      strengths: strengths.slice(0, 4),
      concerns: concerns.slice(0, 4),
      trends,
      recommendations: recommendations.slice(0, 4),
      analyzedAt: new Date().toISOString(),
      provider: 'rule-engine',
      model: 'rule-engine-v1',
      inputVersion: `${score}_v3`,
    };
  }
}

/**
 * Real LLM Provider (Google Gemini API) (Section 3 & 4)
 * Runs strictly server-side using GEMINI_API_KEY or LLM_API_KEY environment variable.
 */
export class RealGeminiLLMProvider implements AIAnalysisProvider {
  name = 'gemini-api';

  async analyze(input: AIAnalysisInput): Promise<AIAnalysisResult> {
    // Insufficient evidence is enforced BEFORE the model is consulted, so no
    // model-generated conclusion can ever be accepted for a profile that has
    // no evidence behind it.
    if (input.reputation.status !== 'scored') {
      return insufficientEvidenceResult('gemini-api', 'gemini-1.5-flash');
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;

    if (!apiKey) {
      throw new Error('LLM_API_KEY environment variable is not configured.');
    }

    const systemPrompt = `You are a financial data analysis assistant for the Financial Reputation Layer (FRL).
Your task is strictly to analyze, explain, and summarize the provided structured financial reputation data.

CRITICAL ARCHITECTURE RULES:
1. You must ONLY analyze the provided structured JSON data.
2. You must NOT invent or hallucinate financial numbers, scores, transactions, or user facts.
3. You must NOT modify, calculate, or override the reputation score or factor scores.
4. You must NOT provide investment, credit card, loan approval, or lending decisions.
5. Output MUST be valid JSON adhering strictly to the schema:
{
  "summary": "Explaining why the score is at X based on inputs",
  "strengths": ["string", "string"],
  "concerns": ["string"],
  "trends": ["string"],
  "recommendations": ["string"]
}`;

    const userPayload = {
      score: input.reputation.result.score,
      level: input.reputation.result.level,
      factors: input.reputation.result.factors,
      history: input.history || [],
      financialOverview: input.financialData ? {
        monthlyIncome: input.financialData.income?.monthly,
        monthlyExpenses: input.financialData.expenses?.monthlyAvg,
        currentSavings: input.financialData.savings?.currentBalance,
        totalDebt: input.financialData.debts?.totalDebt,
      } : undefined,
    };

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: `${systemPrompt}\n\nDATA TO ANALYZE:\n${JSON.stringify(userPayload, null, 2)}` },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2, // Low temperature for deterministic analysis
        responseMimeType: 'application/json',
      },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Gemini API call failed with status ${response.status}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error('Gemini API returned empty response.');
    }

    const parsed = JSON.parse(rawText);

    // ANTI-HALLUCINATION RESPONSE VALIDATION (Section 8)
    if (!parsed.summary || !Array.isArray(parsed.strengths) || !Array.isArray(parsed.concerns)) {
      throw new Error('Gemini response failed JSON schema validation.');
    }

    // Validate that score referenced matches input exactly
    if (parsed.summary.includes('score') && !parsed.summary.includes(String(input.reputation.result.score))) {
      // If hallucinated score detected, throw to fallback
      throw new Error('Hallucinated score detected in LLM output.');
    }

    return {
      summary: parsed.summary,
      strengths: parsed.strengths.slice(0, 4),
      concerns: parsed.concerns.slice(0, 4),
      trends: Array.isArray(parsed.trends) ? parsed.trends : ['Score history trends analyzed.'],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      analyzedAt: new Date().toISOString(),
      provider: 'gemini-api',
      model: 'gemini-1.5-flash',
      inputVersion: `${input.reputation.result.score}_v4`,
    };
  }
}

/**
 * Main Abstraction Function: analyzeFinancialReputation()
 * 1. Checks AI Analysis Cache (Section 10)
 * 2. Attempts Real LLM Provider (Gemini API) if API key exists
 * 3. Fallback to RuleBasedAIProvider (Section 9) on any timeout/error/hallucination failure
 */
export async function analyzeFinancialReputation(input: AIAnalysisInput): Promise<AIAnalysisResult> {
  const cacheKey = generateCacheKey(input);
  const cached = AI_CACHE.get(cacheKey);

  // Return cached result if fresh (< 10 minutes)
  if (cached && Date.now() - cached.createdAt < 600000) {
    return cached.result;
  }

  let result: AIAnalysisResult;

  const apiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY;

  if (apiKey) {
    try {
      const llmProvider = new RealGeminiLLMProvider();
      result = await llmProvider.analyze(input);
    } catch (error) {
      console.warn('Real LLM Provider failed or hallucination caught. Falling back to RuleBasedAIProvider:', error);
      const fallbackProvider = new RuleBasedAIProvider();
      result = await fallbackProvider.analyze(input);
    }
  } else {
    // Standard Rule-Based Fallback Engine
    const fallbackProvider = new RuleBasedAIProvider();
    result = await fallbackProvider.analyze(input);
  }

  AI_CACHE.set(cacheKey, { result, createdAt: Date.now() });
  return result;
}
