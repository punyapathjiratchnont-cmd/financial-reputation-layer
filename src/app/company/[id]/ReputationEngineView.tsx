'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  type LucideIcon,
  X,
  TrendingUp,
  Activity,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  Info,
  DollarSign,
  PieChart,
  PlusCircle,
  Edit3,
  UserCheck,
  ShieldCheck,
  FileText,
  Share2,
  Copy,
  ExternalLink,
  Lock,
  XCircle,
  Check,
  Search,
  ArrowRight,
  ChevronRight,
  Building2,
  Award,
  Layers,
  Clock,
  Shield,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import {
  calculateReputation,
  calculateBusinessReliability,
  ReputationFactors,
  ReputationOutcome,
  ReputationResult,
  ReputationLevel,
  UserFinancialData,
  hasPaymentEvidence,
  hasIncomeEvidence,
  hasSpendingEvidence,
  hasSavingsEvidence,
  hasDebtEvidence,
  hasTransactionEvidence,
} from '@/lib/reputationEngine';
import { MOCK_FINANCIAL_PROFILES } from '@/lib/mockFinancialData';
import { AIAnalysisResult } from '@/lib/aiAnalysisService';
import {
  Claim,
  Company,
  ScoreHistoryItem,
  ReputationProof,
  ReputationShare,
  DisclosureLevel,
} from '@/lib/types';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { ScoreHistoryChart } from './ScoreHistoryChart';
import { FinancialInputModal } from './FinancialInputModal';
import { useLanguage } from '@/lib/i18n';

interface ReputationEngineViewProps {
  userId?: string;
  /**
   * The company this workspace is attached to.
   *
   * Optional and purely contextual: the workspace only reads its name and its
   * real verification status so the header can say who owns what. It never
   * reads a score from here — the reputation shown in this workspace comes
   * only from the engine's outcome.
   */
  company?: Company;
  /** Returns to the public company profile. Owned by the parent view. */
  onViewPublicProfile?: () => void;
}

export type MainNavTab = 'dashboard' | 'my_reputation' | 'verify' | 'proofs' | 'reputation_data';

// ---------------------------------------------------------------------------
// UI Phase 5 — Owner Workspace evidence vocabulary.
//
// The workspace distinguishes three states and never collapses them:
//
//   Available     the owner submitted this group and the engine's evidence
//                 gate for it passes
//   Missing       the group was never submitted
//   Not reported  a specific field is absent from an otherwise present group
//
// `—` means "we do not know". It never means zero.
// ---------------------------------------------------------------------------

const NOT_REPORTED = '—';

/**
 * Formats a value the owner actually submitted.
 *
 * Zero is reported as zero on purpose: "0 late payments" is genuine evidence
 * and hiding it would misreport the record. Only a field that is absent — not
 * a number at all — becomes an em dash. That is why this tests `typeof` and
 * never truthiness.
 */
function reported(value: number | null | undefined, format?: (n: number) => string): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return NOT_REPORTED;
  return format ? format(value) : value.toLocaleString();
}

function baht(value: number | null | undefined): string {
  return reported(value, (n) => `฿${n.toLocaleString()}`);
}

/**
 * A ratio is reported only when both sides exist and the denominator is
 * positive. Otherwise it is "not reported" — never "0.0%", because 0% would
 * assert that the owner reported no income, which is a different claim.
 */
function ratio(
  numerator: number | null | undefined,
  denominator: number | null | undefined
): string {
  if (typeof denominator !== 'number' || !Number.isFinite(denominator) || denominator <= 0) {
    return NOT_REPORTED;
  }
  if (typeof numerator !== 'number' || !Number.isFinite(numerator)) return NOT_REPORTED;
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

interface EvidenceRow {
  label: string;
  value: string;
}

interface EvidenceGroup {
  id: string;
  label: string;
  purpose: string;
  icon: LucideIcon;
  /**
   * The engine's own evidence gate, imported from reputationEngine.
   *
   * Using the engine's predicate rather than a UI heuristic is the point: the
   * workspace must not have a second, looser idea of what counts as evidence.
   */
  has: (d: UserFinancialData) => boolean;
  rows: (d: UserFinancialData) => EvidenceRow[];
}

const EVIDENCE_GROUPS: EvidenceGroup[] = [
  {
    id: 'income',
    label: 'Income & Stability',
    purpose: 'Declared revenue and how long that revenue has held.',
    icon: DollarSign,
    has: (d) => hasIncomeEvidence(d.income),
    rows: (d) => [
      { label: 'Monthly income', value: baht(d.income.monthly) },
      { label: 'Income continuity', value: reported(d.income.stabilityMonths, (n) => `${n} months`) },
      { label: 'Revenue sources', value: reported(d.income.sourcesCount, (n) => `${n} entered`) },
    ],
  },
  {
    id: 'spending',
    label: 'Expenses & Spending',
    purpose: 'Declared monthly outgoings and the discretionary share of income.',
    icon: PieChart,
    has: (d) => hasSpendingEvidence(d.income, d.expenses),
    rows: (d) => [
      { label: 'Monthly expenses', value: baht(d.expenses.monthlyAvg) },
      { label: 'Expense ratio', value: ratio(d.expenses.monthlyAvg, d.income.monthly) },
      {
        label: 'Discretionary share',
        value: reported(d.expenses.discretionaryRatio, (n) => `${(n * 100).toFixed(0)}%`),
      },
    ],
  },
  {
    id: 'payments',
    label: 'Payments & Obligations',
    purpose: 'Obligation history: paid on time, paid late, or missed.',
    icon: CheckCircle2,
    has: (d) => hasPaymentEvidence(d.payments),
    rows: (d) => [
      { label: 'Obligations recorded', value: reported(d.payments.totalDue) },
      { label: 'Paid on time', value: reported(d.payments.onTimeCount) },
      { label: 'Paid late', value: reported(d.payments.lateCount) },
      { label: 'Missed', value: reported(d.payments.missedCount) },
    ],
  },
  {
    id: 'savings',
    label: 'Savings & Reserves',
    purpose: 'The liquid buffer and the monthly contribution building it.',
    icon: Shield,
    has: (d) => hasSavingsEvidence(d.savings),
    rows: (d) => [
      { label: 'Liquid savings balance', value: baht(d.savings.currentBalance) },
      { label: 'Monthly contribution', value: baht(d.savings.monthlyContribution) },
      {
        label: 'Emergency fund cover',
        value: reported(d.savings.emergencyFundMonths, (n) => `${n} months`),
      },
    ],
  },
  {
    id: 'debts',
    label: 'Debt Liabilities',
    purpose: 'Outstanding obligations, available credit and monthly debt service.',
    icon: AlertTriangle,
    has: (d) => hasDebtEvidence(d.debts),
    rows: (d) => [
      { label: 'Total debt', value: baht(d.debts.totalDebt) },
      { label: 'Credit limit', value: baht(d.debts.creditLimit) },
      { label: 'Monthly debt service', value: baht(d.debts.monthlyDebtService) },
      { label: 'Debt service ratio', value: ratio(d.debts.monthlyDebtService, d.income.monthly) },
    ],
  },
  {
    id: 'transactions',
    label: 'Transaction History',
    purpose: 'Observed activity: volume, account age and returned payments.',
    icon: Clock,
    has: (d) => hasTransactionEvidence(d.transactions),
    rows: (d) => [
      { label: 'Transactions, last 6 months', value: reported(d.transactions.count6Months) },
      {
        label: 'Account duration',
        value: reported(d.transactions.oldestAccountYears, (n) => `${n} years`),
      },
      { label: 'Returned payments', value: reported(d.transactions.bouncedCount) },
    ],
  },
];

/**
 * Owner workspace readiness.
 *
 * There is no `percent` field, and that is deliberate. The application does
 * not compute a readiness value, so none is shown. A percentage derived from a
 * field count would be a fabricated score sitting beside a real one.
 */
type ReadinessState =
  | { kind: 'loading' }
  | { kind: 'demo' }
  | { kind: 'none'; reason: string }
  | { kind: 'insufficient'; reason: string; missing: string[] }
  | { kind: 'scored'; result: ReputationResult };

const DISCLOSURE_LABEL: Record<string, string> = {
  score_only: 'Score only',
  score_and_level: 'Score and level',
  score_and_factors: 'Score, level and factors',
};

const WORKSPACE_TABS: Array<{ id: MainNavTab; label: string; icon: LucideIcon }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'my_reputation', label: 'My Reputation', icon: Award },
  { id: 'verify', label: 'Verify Company', icon: ShieldCheck },
  { id: 'proofs', label: 'Proofs', icon: Lock },
  { id: 'reputation_data', label: 'Reputation Data', icon: SlidersHorizontal },
];

export function ReputationEngineView({
  userId = 'c1',
  company,
  onViewPublicProfile,
}: ReputationEngineViewProps) {
  const { language } = useLanguage();

  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<MainNavTab>('dashboard');

  // Mode state: 'real' or 'demo'
  const [dataMode, setDataMode] = useState<'real' | 'demo'>('real');
  const [selectedProfileKey, setSelectedProfileKey] = useState<string>('normal');

  // Real user state
  const [realHasData, setRealHasData] = useState<boolean>(false);
  const [realFinancialData, setRealFinancialData] = useState<UserFinancialData | null>(null);
  const [realOutcome, setRealOutcome] = useState<ReputationOutcome | null>(null);
  const [realHistory, setRealHistory] = useState<ScoreHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // AI Analysis state
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(true);
  const [aiError, setAiError] = useState<string | null>(null);

  // Reputation Proof State
  const [proofs, setProofs] = useState<ReputationProof[]>([]);
  const [proofsLoading, setProofsLoading] = useState<boolean>(false);
  const [generatingProof, setGeneratingProof] = useState<boolean>(false);
  const [copiedProofId, setCopiedProofId] = useState<string | null>(null);
  const [proofError, setProofError] = useState<string | null>(null);

  // Selective Disclosure Share State
  const [shares, setShares] = useState<ReputationShare[]>([]);
  const [sharesLoading, setSharesLoading] = useState<boolean>(false);
  const [shareModalOpen, setShareModalOpen] = useState<boolean>(false);
  const [selectedProofForShare, setSelectedProofForShare] = useState<ReputationProof | null>(null);
  const [selectedDisclosureLevel, setSelectedDisclosureLevel] = useState<DisclosureLevel>('score_only');
  const [selectedExpiryDays, setSelectedExpiryDays] = useState<number>(30);
  const [creatingShare, setCreatingShare] = useState<boolean>(false);
  const [copiedShareToken, setCopiedShareToken] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  // Verify Company Input & Lookup State (Section 6 & 7)
  const [verifyInput, setVerifyInput] = useState<string>('');
  const [verifyingCompany, setVerifyingCompany] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Fetch Shares
  const fetchShares = useCallback(async () => {
    setSharesLoading(true);
    try {
      const res = await fetch(`/api/reputation/share?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setShares(data.shares || []);
      }
    } catch (err) {
      console.error('Failed to load reputation shares:', err);
    } finally {
      setSharesLoading(false);
    }
  }, [userId]);

  // Fetch Proofs
  const fetchProofs = useCallback(async () => {
    setProofsLoading(true);
    try {
      const res = await fetch(`/api/reputation/proof?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setProofs(data.proofs || []);
      }
    } catch (err) {
      console.error('Failed to load reputation proofs:', err);
    } finally {
      setProofsLoading(false);
    }
  }, [userId]);

  // Fetch Real Reputation Data
  const fetchRealData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reputation?userId=${userId}&mode=real`);
      if (res.ok) {
        const data = await res.json();
        setRealHasData(data.hasData);
        if (data.hasData) {
          setRealOutcome(data.outcome ?? null);
          setRealHistory(data.history || []);
          setRealFinancialData(data.financialData);
        } else {
          setRealOutcome(null);
          setRealFinancialData(null);
        }
      }
    } catch (err) {
      console.error('Failed to load real financial data:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRealData();
    fetchProofs();
    fetchShares();
  }, [fetchRealData, fetchProofs, fetchShares]);

  // Active reputation data
  const isDemo = dataMode === 'demo';
  const demoProfile = MOCK_FINANCIAL_PROFILES[selectedProfileKey] || MOCK_FINANCIAL_PROFILES.normal;

  // Memoised on purpose.
  //
  // calculateReputation() returns a NEW object on every call, so computing
  // this inline produced a new object identity on every render. That identity
  // is a dependency of fetchAIAnalysis, which is a dependency of the effect
  // below, so each render re-fired the effect and issued a fresh
  // POST /api/reputation/analysis — a self-sustaining loop, because setting
  // the analysis state caused the next render. One click on Demo Mode issued
  // ~60 requests and exhausted the platform rate limit, leaving the AI panel
  // permanently blank.
  //
  // Memoising on the real inputs makes the identity stable across re-renders,
  // so the request fires once per genuine change of evidence (mode, selected
  // demo profile, or newly loaded real data) and not on every render.
  //
  // The scoring logic itself is untouched: the same calculateReputation() call
  // produces the same outcome, it is simply not recomputed when nothing that
  // feeds it has changed.
  const activeOutcome: ReputationOutcome | null = useMemo(
    () => (isDemo ? calculateReputation(demoProfile.data) : realOutcome),
    [isDemo, demoProfile, realOutcome]
  );

  // A score exists ONLY when the engine produced one. `null` is never rendered
  // as a number and never as a level.
  const scored: ReputationResult | null =
    activeOutcome && activeOutcome.status === 'scored' ? activeOutcome.result : null;

  const activeFinancialData: UserFinancialData | null = isDemo
    ? demoProfile.data
    : realFinancialData;

  const activeHistory = isDemo ? demoProfile.history : realHistory;

  // Fetch AI Analysis
  const fetchAIAnalysis = useCallback(async () => {
    if (!activeOutcome) {
      setAnalysis(null);
      setAiLoading(false);
      return;
    }

    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/reputation/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          profileKey: isDemo ? selectedProfileKey : undefined,
          financialData: activeFinancialData,
          history: activeHistory,
        }),
      });

      if (res.status === 429) {
        // Rate limited. There is deliberately NO automatic retry here: a retry
        // loop is what exhausted the limit in the first place. Any previous
        // result is cleared so nothing stale is presented as fresh, and the
        // user decides when to try again via the explicit button below.
        setAnalysis(null);
        setAiError('AI analysis is temporarily unavailable. Please try again shortly.');
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setAnalysis(data.analysis);
      } else {
        throw new Error('Analysis request failed');
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Unable to generate analysis right now.');
    } finally {
      setAiLoading(false);
    }
  }, [activeOutcome, activeFinancialData, activeHistory, isDemo, selectedProfileKey, userId]);

  useEffect(() => {
    fetchAIAnalysis();
  }, [fetchAIAnalysis]);

  // Handlers
  const handleGenerateProof = async () => {
    setGeneratingProof(true);
    setProofError(null);
    try {
      const res = await fetch('/api/reputation/proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        await fetchProofs();
        setActiveTab('proofs');
      } else {
        const data = await res.json();
        setProofError(data.error || 'Failed to generate reputation proof.');
      }
    } catch (err) {
      setProofError('Network error generating proof.');
    } finally {
      setGeneratingProof(false);
    }
  };

  const handleCreateShare = async () => {
    if (!selectedProofForShare) return;
    setCreatingShare(true);
    setShareError(null);
    try {
      const res = await fetch('/api/reputation/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proofId: selectedProofForShare.id,
          disclosureLevel: selectedDisclosureLevel,
          expiresInDays: selectedExpiryDays,
          userId,
        }),
      });

      if (res.ok) {
        await fetchShares();
        setShareModalOpen(false);
        setSelectedProofForShare(null);
        setActiveTab('proofs');
      } else {
        const data = await res.json();
        setShareError(data.error || 'Failed to create share link.');
      }
    } catch (err) {
      setShareError('Network error creating share link.');
    } finally {
      setCreatingShare(false);
    }
  };

  const handleRevokeProof = async (proofId: string) => {
    try {
      const res = await fetch('/api/reputation/proof/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proofId, userId }),
      });
      if (res.ok) await fetchProofs();
    } catch (err) {
      console.error('Failed to revoke proof:', err);
    }
  };

  const handleRevokeShare = async (shareToken: string) => {
    try {
      const res = await fetch('/api/reputation/share/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareToken, userId }),
      });
      if (res.ok) await fetchShares();
    } catch (err) {
      console.error('Failed to revoke share:', err);
    }
  };

  const handleCopyLink = (text: string, isShare = false) => {
    const url = text.startsWith('http') ? text : `${window.location.origin}/verify/${text}`;
    navigator.clipboard.writeText(url);
    if (isShare) {
      setCopiedShareToken(text);
      setTimeout(() => setCopiedShareToken(null), 2500);
    } else {
      setCopiedProofId(text);
      setTimeout(() => setCopiedProofId(null), 2500);
    }
  };

  // Perform Company Verification Lookup (Section 6 & 7)
  const handleVerifyCompanyLookup = async (tokenToUse?: string) => {
    const query = (tokenToUse || verifyInput).trim();
    if (!query) return;

    // Extract ID from full URL if pasted
    let cleanId = query;
    if (query.includes('/verify/')) {
      cleanId = query.split('/verify/')[1].trim();
    }

    setVerifyingCompany(true);
    setVerificationError(null);
    setVerificationResult(null);

    try {
      // 1. Try share endpoint if starts with share_
      if (cleanId.startsWith('share_')) {
        const res = await fetch(`/api/reputation/share/${cleanId}`);
        const data = await res.json();
        if (res.ok && data.valid !== undefined) {
          setVerificationResult({ type: 'share', token: cleanId, ...data });
          setVerifyingCompany(false);
          return;
        }
      }

      // 2. Try proof endpoint if starts with proof_
      if (cleanId.startsWith('proof_')) {
        const res = await fetch(`/api/reputation/verify/${cleanId}`);
        const data = await res.json();
        if (res.ok && data.valid !== undefined) {
          setVerificationResult({ type: 'proof', token: cleanId, ...data });
          setVerifyingCompany(false);
          return;
        }
      }

      // 3. General verification fallback
      const proofRes = await fetch(`/api/reputation/verify/${cleanId}`);
      if (proofRes.ok) {
        const data = await proofRes.json();
        setVerificationResult({ type: 'proof', token: cleanId, ...data });
        setVerifyingCompany(false);
        return;
      }

      const shareRes = await fetch(`/api/reputation/share/${cleanId}`);
      if (shareRes.ok) {
        const data = await shareRes.json();
        setVerificationResult({ type: 'share', token: cleanId, ...data });
        setVerifyingCompany(false);
        return;
      }

      setVerificationError('No verified business reputation record found for the provided ID or link.');
    } catch (err) {
      setVerificationError('Network error performing verification lookup.');
    } finally {
      setVerifyingCompany(false);
    }
  };

  // Business Reliability comes ONLY from verified business claims (counterparty
  // attestations and official claims). It must never be derived from personal
  // financial behaviour such as transaction history or payment reliability.
  //
  // This view has no verified-claim source wired to it yet, so the honest result
  // of calculateBusinessReliability with no claims is Insufficient Data.
  // Wiring real claims is separate work.
  const VERIFIED_BUSINESS_CLAIMS: Claim[] = [];

  const INSUFFICIENT_LABEL = 'Insufficient Data';

  const labelFor = (
    score: number | null,
    high: string,
    midHigh: string,
    mid: string,
    low: string
  ): string => {
    if (score === null || typeof score !== 'number') return INSUFFICIENT_LABEL;
    if (score >= 750) return high;
    if (score >= 650) return midHigh;
    if (score >= 500) return mid;
    return low;
  };

  const getB2BDimensions = (outcome: ReputationOutcome | null) => {
    if (!outcome) {
      return {
        paymentReliability: INSUFFICIENT_LABEL,
        businessReliability: INSUFFICIENT_LABEL,
        financialStability: INSUFFICIENT_LABEL,
        transactionHistory: INSUFFICIENT_LABEL,
      };
    }

    const factors: ReputationFactors = outcome.factors;
    const business = calculateBusinessReliability(VERIFIED_BUSINESS_CLAIMS);

    const incomeScore = factors.incomeConsistency.score;
    const spendingScore = factors.spendingStability.score;

    let financialStability = INSUFFICIENT_LABEL;
    if (incomeScore !== null && spendingScore !== null) {
      financialStability = incomeScore >= 650 && spendingScore >= 600 ? 'Stable' : 'Moderate';
    }

    return {
      paymentReliability: labelFor(
        factors.paymentReliability.score,
        'Strong',
        'Good',
        'Moderate',
        'Needs Improvement'
      ),
      businessReliability: business.isSufficient ? business.label : INSUFFICIENT_LABEL,
      financialStability,
      transactionHistory: labelFor(
        factors.transactionHistory.score,
        'Strong',
        'Good',
        'Moderate',
        'Limited'
      ),
    };
  };

  const b2bDimensions = getB2BDimensions(activeOutcome);

  const getLevelBadge = (level: ReputationLevel | string | null) => {
    switch (level) {
      case 'Excellent':
        return <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">EXCELLENT</span>;
      case 'Good':
        return <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">GOOD</span>;
      case 'Fair':
        return <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30">FAIR</span>;
      case 'Low':
        return <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30">LOW</span>;
      default:
        // No level was produced, so none is shown. Absence is never 'Low'.
        return <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-slate-500/20 text-slate-300 border border-slate-500/30">INSUFFICIENT DATA</span>;
    }
  };

  // -------------------------------------------------------------------------
  // UI Phase 5 — Owner Workspace readiness.
  //
  // Everything here is read from state the application already holds: the
  // engine's own outcome, the engine's own evidence gates, and the record that
  // was actually submitted. Nothing is estimated and nothing is counted into a
  // percentage.
  // -------------------------------------------------------------------------

  // The engine's own wording for "no record has ever been submitted".
  // Computed rather than retyped so the workspace cannot drift away from the
  // reason the engine would give for the same absence.
  const noEvidenceReason = useMemo(() => {
    const outcome = calculateReputation(null);
    return outcome.status === 'insufficient' ? outcome.reason : null;
  }, []);

  const readiness: ReadinessState = useMemo(() => {
    if (loading) return { kind: 'loading' };
    if (isDemo) return { kind: 'demo' };
    if (!realHasData) {
      return { kind: 'none', reason: noEvidenceReason ?? 'No financial evidence has been submitted to FRL.' };
    }
    if (activeOutcome?.status === 'insufficient') {
      return {
        kind: 'insufficient',
        reason: activeOutcome.reason,
        // Names come from the engine's own factor records, so the list of what
        // is missing is the engine's list and not a UI re-derivation.
        missing: Object.values(activeOutcome.factors)
          .filter((factor) => factor.score === null)
          .map((factor) => factor.name),
      };
    }
    if (scored) return { kind: 'scored', result: scored };
    return { kind: 'none', reason: noEvidenceReason ?? 'No financial evidence has been submitted to FRL.' };
  }, [loading, isDemo, realHasData, activeOutcome, scored, noEvidenceReason]);

  /**
   * Evidence inventory.
   *
   * `available` is the engine's own gate, not a count of populated inputs. In
   * demo mode the underlying record is a sample profile, so every entry is
   * rendered as demo data and never as submitted evidence.
   */
  const evidence = useMemo(
    () =>
      EVIDENCE_GROUPS.map((group) => ({
        group,
        available: activeFinancialData ? group.has(activeFinancialData) : false,
      })),
    [activeFinancialData]
  );

  const evidenceGroupsWithData = evidence.filter((entry) => entry.available).length;

  /**
   * Proof eligibility.
   *
   * A proof can only exist where the engine produced a score, so eligibility is
   * `scored !== null` — not "the owner has any record at all". Where no score
   * exists the workspace says the proof is unavailable instead of offering a
   * button that would fail.
   */
  const canGenerateProof = scored !== null;

  /** The company record's real verification status, stated as reported. */
  const workspaceVerification = company?.sourceInfo?.verificationStatus;
  const workspaceVerificationLabel =
    workspaceVerification === 'verified'
      ? 'Verified by FRL'
      : workspaceVerification === 'unverified'
        ? 'Not verified by FRL'
        : 'Verification status not reported';

  return (
<div className="space-y-6">
      {/* ===================== WORKSPACE IDENTITY HEADER ===================== */}
      <Card tone="glass" padding="none">
        <div className="flex flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="primary" size="sm" dot>
                Owner Workspace
              </Badge>
              <Badge tone={isDemo ? 'demo' : 'insufficient'} size="sm">
                {isDemo ? 'Demo Data' : workspaceVerificationLabel}
              </Badge>
            </div>
            <h2 className="mt-3 text-h2 text-white">{company?.name ?? 'Owner Workspace'}</h2>
            <p className="mt-2 max-w-2xl text-body-sm text-fg-muted">
              Your private workspace. Financial evidence submitted here is read by the FRL reputation
              engine, which produces a score only when every required factor has evidence. FRL
              publishes nothing it has not calculated.
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
            <Button onClick={() => setIsModalOpen(true)} icon={<PlusCircle className="h-4 w-4" />}>
              {realHasData ? 'Update Financial Evidence' : 'Add Financial Evidence'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setActiveTab('reputation_data')}
              icon={<Layers className="h-4 w-4" />}
            >
              Review Evidence
            </Button>
            {onViewPublicProfile && (
              <Button
                variant="outline"
                onClick={onViewPublicProfile}
                icon={<Eye className="h-4 w-4" />}
              >
                View Public Profile
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* ======================== WORKSPACE NAVIGATION ======================== */}
      <nav aria-label="Owner workspace sections" className="frl-glass rounded-lg p-1.5">
        <div className="flex flex-col gap-1.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:flex lg:flex-wrap">
          {WORKSPACE_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            const tabLabel =
              tab.id === 'proofs'
                ? `Proofs (${proofs.filter((p) => p.status === 'active').length})`
                : tab.label;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-md border px-3 text-xs font-semibold transition-[background-color,border-color,color] duration-[var(--frl-dur-fast)] ease-[var(--frl-ease-standard)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-hover focus-visible:ring-offset-2 focus-visible:ring-offset-canvas ${
                  active
                    ? 'border-white/[0.08] bg-white/[0.08] text-white'
                    : 'border-transparent text-fg-muted hover:bg-white/[0.04] hover:text-fg-secondary'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{tabLabel}</span>
              </button>
            );
          })}
          </div>

          {/* Data mode. Demo Mode is a sample profile and is always labelled as
              one; switching it never changes where a real record comes from. */}
          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="Data mode"
              className="inline-flex items-center rounded-md border border-white/[0.08] bg-white/[0.03] p-1"
            >
              <button
                type="button"
                onClick={() => setDataMode('real')}
                aria-pressed={dataMode === 'real'}
                className={`inline-flex h-9 items-center gap-1.5 rounded-sm px-2.5 text-caption font-semibold transition-[background-color,color] duration-[var(--frl-dur-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-hover ${
                  dataMode === 'real'
                    ? 'bg-white/[0.08] text-white'
                    : 'text-fg-muted hover:text-fg-secondary'
                }`}
              >
                <UserCheck className="h-3 w-3" aria-hidden="true" />
                Real Data
              </button>
              <button
                type="button"
                onClick={() => setDataMode('demo')}
                aria-pressed={dataMode === 'demo'}
                className={`inline-flex h-9 items-center gap-1.5 rounded-sm px-2.5 text-caption font-semibold transition-[background-color,color] duration-[var(--frl-dur-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-hover ${
                  dataMode === 'demo'
                    ? 'bg-white/[0.08] text-white'
                    : 'text-fg-muted hover:text-fg-secondary'
                }`}
              >
                <Sliders className="h-3 w-3" aria-hidden="true" />
                Demo Mode
              </button>
            </div>

            {isDemo && (
              <label className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
                <span className="text-caption text-fg-subtle">Profile</span>
                <select
                  value={selectedProfileKey}
                  onChange={(e) => setSelectedProfileKey(e.target.value)}
                  className="h-9 min-w-0 flex-1 rounded-md border border-white/15 bg-black/40 px-2.5 text-caption text-slate-200 transition-colors duration-[var(--frl-dur-fast)] hover:border-white/25 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/25 sm:flex-none"
                >
                  {Object.entries(MOCK_FINANCIAL_PROFILES).map(([key, item]) => (
                    <option key={key} value={key} className="bg-slate-900 text-slate-200">
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </div>
      </nav>

      {/* DEMO MODE NOTICE — a sample profile is never presented as evidence. */}
      {isDemo && (
        <div className="flex flex-col gap-3 rounded-md border border-demo-line bg-demo-soft p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5 text-body-sm leading-relaxed text-amber-200/90">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-demo" aria-hidden="true" />
            <span>
              <strong className="text-amber-300">Demo Mode.</strong> Showing the built-in sample
              profile{' '}
              <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-amber-200">
                {selectedProfileKey}
              </code>
              . Nothing here is real evidence, and no score on this screen is a real reputation.
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDataMode('real')}
            icon={<UserCheck className="h-3.5 w-3.5" />}
          >
            Switch to Real Data
          </Button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: DASHBOARD (Sections 4, 5, 6)                                       */}
      {/* ========================================================================= */}
{activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* -------------------------- REPUTATION READINESS -------------------------- */}
          <Card tone="base" padding="md">
            <CardHeader>
              <div>
                <CardTitle>Reputation readiness</CardTitle>
                <CardDescription>
                  This is the engine&apos;s own assessment of your submitted evidence. FRL does not
                  compute a completion percentage, so none is shown here.
                </CardDescription>
              </div>
              {readiness.kind === 'loading' && (
                <Badge tone="neutral" size="sm">
                  Checking
                </Badge>
              )}
              {readiness.kind === 'scored' && (
                <Badge tone="success" size="sm" dot>
                  Score available
                </Badge>
              )}
              {(readiness.kind === 'none' || readiness.kind === 'insufficient') && (
                <Badge tone="insufficient" size="md" dot>
                  Insufficient Data
                </Badge>
              )}
              {readiness.kind === 'demo' && (
                <Badge tone="demo" size="md">
                  Demo Data — Not A Real Score
                </Badge>
              )}
            </CardHeader>

            <CardContent className="mt-5">
              {readiness.kind === 'loading' && (
                <p className="flex items-center gap-2.5 text-body-sm text-fg-muted">
                  <RefreshCw
                    className="h-4 w-4 animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                  Checking the evidence you have submitted.
                </p>
              )}

              {readiness.kind === 'demo' && (
                <div className="rounded-md border border-demo-line bg-demo-soft p-4">
                  <p className="text-body-sm leading-relaxed text-amber-200/90">
                    You are viewing a built-in sample profile. FRL has verified nothing here and no
                    score on this screen reflects a real business. Switch to Real Data to work with
                    your own submitted evidence.
                  </p>
                </div>
              )}

              {readiness.kind === 'none' && (
                <div className="space-y-4">
                  <p className="text-body text-fg-secondary">{readiness.reason}</p>
                  <p className="max-w-2xl text-body-sm text-fg-muted">
                    FRL cannot calculate a reputation score until sufficient evidence exists. Submit
                    your financial evidence to begin. FRL will then name the exact factors that are
                    still missing rather than estimating how far along you are.
                  </p>
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    icon={<PlusCircle className="h-4 w-4" />}
                  >
                    Add Financial Evidence
                  </Button>
                </div>
              )}

              {readiness.kind === 'insufficient' && (
                <div className="space-y-4">
                  <p className="max-w-3xl text-body text-fg-secondary">{readiness.reason}</p>
                  {readiness.missing.length > 0 && (
                    <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-4">
                      <h3 className="text-label text-fg-subtle">Factors without evidence</h3>
                      <ul className="mt-2.5 flex flex-wrap gap-2">
                        {readiness.missing.map((name) => (
                          <li key={name}>
                            <Badge tone="insufficient" size="sm">
                              {name}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="max-w-2xl text-body-sm text-fg-muted">
                    FRL will not publish a reputation score until every required factor has evidence.
                    Complete the evidence below and the engine recalculates.
                  </p>
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    icon={<PlusCircle className="h-4 w-4" />}
                  >
                    Complete Financial Evidence
                  </Button>
                </div>
              )}

              {readiness.kind === 'scored' && (
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-3">
                      <span className="text-metric text-white">{readiness.result.score}</span>
                      <span className="text-body-sm text-fg-muted">/ 850</span>
                      {getLevelBadge(readiness.result.level)}
                    </div>
                    <p className="mt-2 max-w-xl text-body-sm text-fg-muted">
                      Calculated by the FRL reputation engine from the evidence you submitted. FRL has
                      not independently audited that evidence; it reflects what you have declared.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setActiveTab('my_reputation')}
                    icon={<Award className="h-4 w-4" />}
                  >
                    View Reputation Detail
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* --------------------------- EVIDENCE INVENTORY --------------------------- */}
          <Card tone="base" padding="md">
            <CardHeader>
              <div>
                <CardTitle>Financial evidence</CardTitle>
                <CardDescription>
                  What is available, what is missing, and what each group is used for. A field shown
                  as — was not reported. It is not a zero.
                </CardDescription>
              </div>
              <Badge tone={isDemo ? 'demo' : 'neutral'} size="sm">
                {isDemo ? 'Sample profile' : 'Your submission'}
              </Badge>
            </CardHeader>

            <CardContent className="mt-5">
              <p className="text-body-sm text-fg-muted">
                Evidence groups with submitted data:{' '}
                <strong className="text-fg-secondary">
                  {evidenceGroupsWithData} of {EVIDENCE_GROUPS.length}
                </strong>
                . This counts groups, not completeness — FRL publishes a score only when every factor
                has evidence.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {evidence.map(({ group, available }) => {
                  const Icon = group.icon;

                  return (
                    <div
                      key={group.id}
                      className="rounded-md border border-white/[0.08] bg-white/[0.02] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-2.5">
                          <Icon
                            className="mt-0.5 h-4 w-4 shrink-0 text-fg-subtle"
                            aria-hidden="true"
                          />
                          <div className="min-w-0">
                            <h4 className="text-body-sm font-semibold text-slate-100">
                              {group.label}
                            </h4>
                            <p className="mt-1 text-caption leading-relaxed text-fg-muted">
                              {group.purpose}
                            </p>
                          </div>
                        </div>
                        <Badge
                          tone={isDemo ? 'demo' : available ? 'success' : 'insufficient'}
                          size="sm"
                          className="shrink-0"
                        >
                          {isDemo ? 'Sample' : available ? 'Available' : 'Missing'}
                        </Badge>
                      </div>

                      {activeFinancialData && (
                        <dl className="mt-3 space-y-1.5 border-t border-white/[0.06] pt-3">
                          {group.rows(activeFinancialData).map((row) => (
                            <div
                              key={row.label}
                              className="flex items-baseline justify-between gap-3"
                            >
                              <dt className="text-caption text-fg-muted">{row.label}</dt>
                              <dd className="shrink-0 text-caption font-medium text-slate-200">
                                {row.value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="mt-4 text-caption leading-relaxed text-fg-subtle">
                Raw financial information is read by the FRL engine to decide whether a reputation can
                be produced. It is never exposed through public reputation verification.
              </p>
            </CardContent>
          </Card>

          {/* ----------------------------- OWNER ACTIONS ----------------------------- */}
          <Card tone="base" padding="md">
            <CardHeader>
              <div>
                <CardTitle>Owner actions</CardTitle>
                <CardDescription>
                  These are the actions FRL already offers. Nothing on this screen can change a
                  reputation without evidence behind it.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="mt-5 grid gap-3 sm:grid-cols-2">
              <Button
                variant="secondary"
                onClick={() => setIsModalOpen(true)}
                icon={<PlusCircle className="h-4 w-4" />}
              >
                {realHasData ? 'Update financial evidence' : 'Add financial evidence'}
              </Button>

              <Button
                variant="secondary"
                onClick={() => setActiveTab('my_reputation')}
                icon={<Award className="h-4 w-4" />}
              >
                View reputation
              </Button>

              {canGenerateProof ? (
                <Button
                  variant="secondary"
                  onClick={handleGenerateProof}
                  loading={generatingProof}
                  icon={<ShieldCheck className="h-4 w-4" />}
                >
                  Generate reputation proof
                </Button>
              ) : (
                <div className="flex items-start gap-2.5 rounded-md border border-white/[0.08] bg-white/[0.02] p-4">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-fg-subtle" aria-hidden="true" />
                  <div className="min-w-0">
                    <h4 className="text-body-sm font-semibold text-slate-200">Proof unavailable</h4>
                    <p className="mt-1 text-caption leading-relaxed text-fg-muted">
                      A reputation proof can only be minted from a scored outcome. Complete your
                      evidence first.
                    </p>
                  </div>
                </div>
              )}

              <Button
                variant="secondary"
                onClick={() => setActiveTab('verify')}
                icon={<ShieldCheck className="h-4 w-4" />}
              >
                Verify a company
              </Button>

              <Button
                variant="secondary"
                onClick={() => setActiveTab('reputation_data')}
                icon={<Layers className="h-4 w-4" />}
              >
                Review submitted data
              </Button>

              <Button
                variant="secondary"
                onClick={() => setActiveTab('proofs')}
                icon={<Lock className="h-4 w-4" />}
              >
                Manage proofs
              </Button>

              <Link
                href="/search"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/15 bg-white/5 px-4 text-sm font-semibold text-slate-100 transition-[background-color,border-color,color,transform] duration-[var(--frl-dur-fast)] ease-[var(--frl-ease-standard)] hover:border-white/25 hover:bg-white/10 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-hover focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                Return to search
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'dashboard' && scored && (
        <div className="space-y-8">
          {/* SECTION 4: MY BUSINESS REPUTATION HERO CARD */}
          <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-2xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6">
              <div>
                <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest font-semibold flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  B2B Business Reputation Signal
                </span>
                <h2 className="text-3xl font-extrabold text-slate-100">My Business Reputation</h2>
              </div>

              {/* Primary Actions (Section 5) */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => setActiveTab('my_reputation')}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
                >
                  <Award className="w-4 h-4" />
                  View My Reputation
                </button>

                <button
                  onClick={() => setActiveTab('verify')}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-100 border border-white/10 text-xs font-bold transition-all flex items-center gap-2"
                >
                  <Search className="w-4 h-4 text-indigo-400" />
                  Verify a Company
                </button>

                <button
                  onClick={handleGenerateProof}
                  disabled={generatingProof}
                  className="px-4 py-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/30 text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  {generatingProof ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
                  Share Reputation
                </button>
              </div>
            </div>

            {/* Central Score & 4 Major B2B Dimensions */}
            <div className="grid md:grid-cols-3 gap-8 items-center">
              {/* Central Score Display */}
              <div className="text-center md:text-left space-y-2 p-6 rounded-2xl bg-black/30 border border-white/5">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                  {isDemo ? 'Demo Reputation Score (not real)' : 'Official FRL Score'}
                </span>
                <div className="flex items-baseline justify-center md:justify-start gap-3">
                  <span className="text-6xl font-black tracking-tight text-white">{scored.score}</span>
                  <span className="text-sm text-slate-400 font-medium">/ 850</span>
                </div>
                <div className="pt-1">{getLevelBadge(scored.level)}</div>
                <p className="text-[11px] text-slate-400 pt-2 border-t border-white/5">
                  {isDemo
                    ? 'Sample data from a demo profile. This is not a real FRL reputation.'
                    : 'Calculated engine-side from verified financial behavior.'}
                </p>
              </div>

              {/* 4 Major Reputation Dimensions Grid (Section 4 & 10) */}
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-black/20 border border-white/5 space-y-1">
                  <span className="text-xs text-slate-400 font-medium block">Payment Reliability</span>
                  <strong className="text-lg font-extrabold text-emerald-400 block">{b2bDimensions.paymentReliability}</strong>
                  <span className="text-[10px] text-slate-500 block">On-time obligation performance</span>
                </div>

                <div className="p-4 rounded-2xl bg-black/20 border border-white/5 space-y-1">
                  <span className="text-xs text-slate-400 font-medium block">Business Reliability</span>
                  <strong className="text-lg font-extrabold text-indigo-400 block">{b2bDimensions.businessReliability}</strong>
                  <span className="text-[10px] text-slate-500 block">Operational transaction signals</span>
                </div>

                <div className="p-4 rounded-2xl bg-black/20 border border-white/5 space-y-1">
                  <span className="text-xs text-slate-400 font-medium block">Financial Stability</span>
                  <strong className="text-lg font-extrabold text-slate-200 block">{b2bDimensions.financialStability}</strong>
                  <span className="text-[10px] text-slate-500 block">Consistency & liquidity stability</span>
                </div>

                <div className="p-4 rounded-2xl bg-black/20 border border-white/5 space-y-1">
                  <span className="text-xs text-slate-400 font-medium block">Transaction History</span>
                  <strong className="text-lg font-extrabold text-amber-400 block">{b2bDimensions.transactionHistory}</strong>
                  <span className="text-[10px] text-slate-500 block">Historical activity duration</span>
                </div>
              </div>
            </div>

            {/* Neutral Disclaimer (Section 10) */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 text-xs text-slate-400 flex items-start gap-3 leading-relaxed">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                Your Business Reputation is a signal generated from financial and transaction behavior available to FRL. It is intended to support business decisions and does not guarantee future business performance.
              </div>
            </div>
          </div>
{/* Verification entry point.
              The lookup form itself lives on the Verification Centre tab. It
              used to be duplicated inline here, which put two copies of the
              same control on screen and left this one outside the design
              system. */}
          <Card tone="base" padding="md">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <ShieldCheck
                  className="mt-0.5 h-5 w-5 shrink-0 text-primary-hover"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <h3 className="text-h4 text-slate-100">Verify a company</h3>
                  <p className="mt-1.5 max-w-xl text-body-sm leading-relaxed text-fg-muted">
                    Check a company&apos;s reputation proof or controlled disclosure link before you
                    do business with them. FRL reports the record&apos;s real state and shows a
                    score only when that record is valid.
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={() => setActiveTab('verify')}
                trailingIcon={<ArrowRight className="h-4 w-4" />}
                className="shrink-0"
              >
                Open verification centre
              </Button>
            </div>
          </Card>
        </div>
      )}

{activeTab === 'my_reputation' && !scored && (
        /* No score exists yet.
           The detail tab used to render nothing at all in this state, which is
           indistinguishable from a broken page. It now says what is missing and
           points at the one action that changes it. Nothing here invents a
           partial score or a provisional trend to fill the space. */
        <Card tone="base" padding="md">
          <CardContent className="text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.02]">
              <Award className="h-6 w-6 text-fg-subtle" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-h3 text-slate-100">No reputation to show yet</h2>
            <p className="mx-auto mt-2 max-w-md text-body-sm leading-relaxed text-fg-muted">
              FRL has not produced a score for your evidence, so there is no breakdown, no trend
              and no analysis to display. Nothing is shown here rather than a partial figure.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Button
                onClick={() => setActiveTab('dashboard')}
                icon={<LayoutDashboard className="h-4 w-4" />}
              >
                See what is missing
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(true)}
                icon={<PlusCircle className="h-4 w-4" />}
              >
                Add financial evidence
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'my_reputation' && scored && (
        <div className="space-y-6">
          <Card tone="base" padding="md">
            <CardHeader>
              <div>
                <CardTitle>Your reputation, in detail</CardTitle>
                <CardDescription>
                  How the engine scored you, the factors behind that score, and how it has moved
                  over time.
                </CardDescription>
              </div>
              {isDemo && (
                <Badge tone="demo" size="sm">
                  Demo sample
                </Badge>
              )}
            </CardHeader>

            <CardContent className="mt-5 space-y-6">
              <div className="grid gap-6 rounded-md border border-white/[0.06] bg-white/[0.02] p-5 lg:grid-cols-3 lg:items-center">
                <div className="text-center lg:text-left">
                  <span className="text-label text-fg-subtle">
                    {isDemo ? 'Demo score (not real)' : 'Engine score'}
                  </span>
                  <div className="mt-1.5 flex items-baseline justify-center gap-2 lg:justify-start">
                    <span className="text-metric text-white">{scored.score}</span>
                    <span className="text-body-sm text-fg-muted">/ 850</span>
                  </div>
                  <div className="mt-2 flex justify-center lg:justify-start">
                    {getLevelBadge(scored.level)}
                  </div>
                </div>

                <div className="lg:col-span-2 lg:border-l lg:border-white/[0.06] lg:pl-6">
                  <ScoreHistoryChart history={activeHistory} />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-label text-fg-subtle">What sits behind the score</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      label: 'Payment Reliability',
                      value: b2bDimensions.paymentReliability,
                      copy: 'How consistently financial obligations and supplier invoices are paid on time.',
                      accent: 'text-emerald-400',
                    },
                    {
                      label: 'Business Reliability',
                      value: b2bDimensions.businessReliability,
                      copy: 'Derived from counterparty attestations and official claims, never from personal transaction behaviour.',
                      accent: 'text-primary-hover',
                    },
                    {
                      label: 'Financial Stability',
                      value: b2bDimensions.financialStability,
                      copy: 'Revenue consistency, expense coverage and liquid savings buffers.',
                      accent: 'text-slate-200',
                    },
                    {
                      label: 'Transaction History',
                      value: b2bDimensions.transactionHistory,
                      copy: 'Historical transaction activity, account duration and returned payments.',
                      accent: 'text-demo',
                    },
                  ].map((dimension) => (
                    <div
                      key={dimension.label}
                      className="rounded-md border border-white/[0.08] bg-white/[0.02] p-4"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h4 className="text-body-sm font-semibold text-slate-100">
                          {dimension.label}
                        </h4>
                        <span className={`text-body-sm font-semibold ${dimension.accent}`}>
                          {dimension.value}
                        </span>
                      </div>
                      <p className="mt-1.5 text-caption leading-relaxed text-fg-muted">
                        {dimension.copy}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI reputation analysis.
              The panel below is only ever populated from a real response. While
              it is loading, errored or rate-limited the result is empty and the
              owner is told so — the score above never depends on it, and no
              substitute conclusion is written when the service is unavailable. */}
          <Card tone="base" padding="md">
            <CardHeader>
              <div>
                <CardTitle>Why is my score like this?</CardTitle>
                <CardDescription>
                  An interpretation of the evidence you submitted, written by the FRL analysis
                  service.
                </CardDescription>
              </div>
              <Badge tone="neutral" size="sm">
                AI analysis
              </Badge>
            </CardHeader>

            <CardContent className="mt-5 space-y-5">
              <div className="flex items-start gap-2.5 rounded-md border border-white/[0.08] bg-white/[0.02] p-4">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary-hover" aria-hidden="true" />
                <p className="text-caption leading-relaxed text-fg-muted">
                  Generated commentary is informational and based strictly on the financial data in
                  your profile. It does not determine your reputation score and is not financial,
                  lending or investment advice.
                </p>
              </div>

              {aiLoading && (
                <div className="flex flex-col items-center gap-2 py-8 text-body-sm text-fg-muted">
                  <RefreshCw
                    className="h-5 w-5 animate-spin text-primary-hover motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                  <p>Analysing your reputation factors…</p>
                </div>
              )}

              {/* Errors are surfaced, never silently swallowed. No result is
                  shown and no request is retried automatically: the retry is a
                  deliberate user action. */}
              {aiError && !aiLoading && (
                <div className="flex flex-col gap-3 rounded-md border border-demo-line bg-demo-soft p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-demo" aria-hidden="true" />
                    <div>
                      <h4 className="text-body-sm font-semibold text-slate-100">
                        Analysis unavailable
                      </h4>
                      <p className="mt-1 text-body-sm leading-relaxed text-fg-muted">{aiError}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchAIAnalysis()}
                    className="shrink-0"
                  >
                    Try again
                  </Button>
                </div>
              )}

              {analysis && !aiLoading && (
                <div className="space-y-5">
                  <div className="rounded-md border border-white/[0.08] bg-white/[0.02] p-4">
                    <h4 className="text-label text-fg-subtle">Summary</h4>
                    <p className="mt-2 text-body leading-relaxed text-slate-200">
                      {analysis.summary}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-md border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
                      <h4 className="flex items-center gap-1.5 text-label text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Reported strengths
                      </h4>
                      <ul className="mt-2.5 space-y-2">
                        {analysis.strengths.map((strength) => (
                          <li
                            key={strength}
                            className="flex items-start gap-2 text-body-sm leading-relaxed text-slate-300"
                          >
                            <Check
                              className="mt-1 h-3 w-3 shrink-0 text-emerald-400"
                              aria-hidden="true"
                            />
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-md border border-demo-line bg-demo-soft p-4">
                      <h4 className="flex items-center gap-1.5 text-label text-demo">
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                        Areas to monitor
                      </h4>
                      <ul className="mt-2.5 space-y-2">
                        {analysis.concerns.map((concern) => (
                          <li
                            key={concern}
                            className="flex items-start gap-2 text-body-sm leading-relaxed text-slate-300"
                          >
                            <span aria-hidden="true" className="mt-1 text-demo">
                              △
                            </span>
                            <span>{concern}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {!analysis && !aiLoading && !aiError && (
                <p className="py-6 text-center text-body-sm text-fg-subtle">
                  No analysis has been produced for this evidence.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex items-start gap-2.5 rounded-md border border-white/[0.08] bg-white/[0.02] p-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary-hover" aria-hidden="true" />
            <p className="text-caption leading-relaxed text-fg-muted">
              This signal is generated from the financial and transaction behaviour available to
              FRL. It supports a business decision; it does not guarantee future performance.
            </p>
          </div>
        </div>
      )}

{/* ========================================================================= */}
      {/* TAB 3: VERIFICATION CENTRE                                               */}
      {/* ========================================================================= */}
      {activeTab === 'verify' && (
        <div className="space-y-6">
          <Card tone="base" padding="md">
            <CardHeader>
              <div>
                <CardTitle>Verification centre</CardTitle>
                <CardDescription>
                  Look up a reputation proof or a controlled disclosure link. FRL reports the
                  record&apos;s real state and shows a score only when that record is valid.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="mt-5 space-y-5">
              <div>
                <label
                  htmlFor="frl-verify-input"
                  className="mb-1.5 block text-caption font-medium text-fg-secondary"
                >
                  FRL proof or disclosure reference
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    id="frl-verify-input"
                    type="text"
                    value={verifyInput}
                    onChange={(e) => setVerifyInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyCompanyLookup()}
                    placeholder="Paste a verification link, proof_… or share_…"
                    aria-describedby="frl-verify-hint"
                    className="h-11 w-full min-w-0 flex-1 rounded-md border border-white/15 bg-black/40 px-3 text-sm text-slate-100 transition-[border-color,background-color] duration-[var(--frl-dur-fast)] placeholder:text-fg-subtle hover:border-white/25 focus:border-primary/60 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-primary/25"
                  />
                  <Button
                    onClick={() => handleVerifyCompanyLookup()}
                    disabled={!verifyInput.trim()}
                    loading={verifyingCompany}
                    icon={<ShieldCheck className="h-4 w-4" />}
                    className="shrink-0"
                  >
                    Verify
                  </Button>
                </div>
                <p id="frl-verify-hint" className="mt-1.5 text-caption leading-relaxed text-fg-subtle">
                  A full <code className="font-mono">/verify/…</code> link or a bare reference both
                  work. FRL checks the record it resolves to; it never accepts a score from the
                  link itself.
                </p>
              </div>

              {(proofs[0] || shares[0]) && (
                <div className="flex flex-wrap items-center gap-2 text-caption text-fg-muted">
                  <span>Your own references:</span>
                  {proofs[0] && (
                    <button
                      type="button"
                      onClick={() => {
                        setVerifyInput(proofs[0].id);
                        handleVerifyCompanyLookup(proofs[0].id);
                      }}
                      className="rounded-sm border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-primary-hover transition-colors hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-hover"
                    >
                      {proofs[0].id.replace(/^proof_/, '').slice(0, 12)}…
                    </button>
                  )}
                  {shares[0] && (
                    <button
                      type="button"
                      onClick={() => {
                        setVerifyInput(shares[0].shareToken);
                        handleVerifyCompanyLookup(shares[0].shareToken);
                      }}
                      className="rounded-sm border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-primary-hover transition-colors hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-hover"
                    >
                      {shares[0].shareToken.replace(/^share_/, '').slice(0, 12)}…
                    </button>
                  )}
                </div>
              )}

              {verificationError && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-md border border-rose-500/20 bg-rose-500/10 p-4 text-body-sm leading-relaxed text-rose-300"
                >
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" aria-hidden="true" />
                  <span>{verificationError}</span>
                </div>
              )}

              {/* The result is shown only when FRL returned one. `valid` is the
                  API's own determination; the page never re-derives it, and a
                  record that is not valid never carries a reputation payload to
                  display in the first place. */}
              {verificationResult && (
                verificationResult.valid === true ? (
                  <div className="space-y-5 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.04] p-5">
                    <div className="text-center">
                      <Badge tone="success" size="md" dot className="mx-auto">
                        Valid proof
                      </Badge>
                      <h3 className="mt-3 text-h3 text-white">Reputation verified</h3>
                      <p className="mx-auto mt-2 max-w-md text-body-sm leading-relaxed text-fg-muted">
                        This proof is active. FRL shows the reputation recorded when it was issued.
                        The figures below are a snapshot and may have changed since.
                      </p>
                    </div>

                    <div className="flex items-baseline justify-center gap-3 border-y border-white/[0.06] py-6">
                      <span className="text-metric text-white">
                        {verificationResult.reputation?.score ?? '—'}
                      </span>
                      <span className="text-body-sm text-fg-muted">/ 850</span>
                      {verificationResult.reputation?.level && (
                        <span className="text-h4 uppercase tracking-[0.08em] text-primary-hover">
                          {verificationResult.reputation.level}
                        </span>
                      )}
                    </div>

                    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {[
                        ['Payment Reliability', verificationResult.reputation?.factors?.paymentReliability],
                        ['Income Consistency', verificationResult.reputation?.factors?.incomeConsistency],
                        ['Spending Stability', verificationResult.reputation?.factors?.spendingStability],
                        ['Saving Behaviour', verificationResult.reputation?.factors?.savingBehavior],
                        ['Debt Behaviour', verificationResult.reputation?.factors?.debtBehavior],
                        ['Transaction History', verificationResult.reputation?.factors?.transactionHistory],
                      ].map(([label, value]) => (
                        <div
                          key={String(label)}
                          className="flex items-baseline justify-between gap-3 rounded-md border border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5"
                        >
                          <dt className="text-caption text-fg-muted">{label}</dt>
                          <dd className="text-body-sm font-medium text-slate-100">
                            {value ?? 'Not reported'}
                          </dd>
                        </div>
                      ))}
                    </dl>

                    <dl className="grid grid-cols-1 gap-3 border-t border-white/[0.06] pt-4 sm:grid-cols-3">
                      <div>
                        <dt className="text-caption text-fg-subtle">Verified</dt>
                        <dd className="mt-0.5 text-body-sm text-slate-100">
                          {verificationResult.verifiedAt
                            ? new Date(verificationResult.verifiedAt).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Not reported'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-caption text-fg-subtle">Expires</dt>
                        <dd className="mt-0.5 text-body-sm text-slate-100">
                          {verificationResult.expiresAt
                            ? new Date(verificationResult.expiresAt).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Not reported'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-caption text-fg-subtle">Evidence policy</dt>
                        <dd className="mt-0.5 text-body-sm text-slate-100">
                          {verificationResult.policyVersion || 'Not reported'}
                        </dd>
                      </div>
                    </dl>

                    <p className="text-caption leading-relaxed text-fg-subtle">
                      A verified proof supports a business decision. It does not guarantee future
                      business performance.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 rounded-lg border border-white/10 bg-white/[0.02] p-5">
                    <div className="text-center">
                      <Badge
                        tone={
                          verificationResult.status === 'revoked'
                            ? 'danger'
                            : verificationResult.status === 'expired'
                              ? 'warning'
                              : 'insufficient'
                        }
                        size="md"
                        dot
                        className="mx-auto"
                      >
                        {verificationResult.status === 'revoked'
                          ? 'Proof revoked'
                          : verificationResult.status === 'expired'
                            ? 'Proof expired'
                            : 'Invalid proof'}
                      </Badge>
                      <h3 className="mt-3 text-h3 text-white">
                        {verificationResult.status === 'revoked'
                          ? 'This proof was revoked'
                          : verificationResult.status === 'expired'
                            ? 'This proof has expired'
                            : 'This record is not valid'}
                      </h3>
                      <p className="mx-auto mt-2 max-w-md text-body-sm leading-relaxed text-fg-muted">
                        {verificationResult.status === 'revoked'
                          ? 'The owner revoked this proof, so it is no longer a valid verification. FRL displays no score or level for it.'
                          : verificationResult.status === 'expired'
                            ? 'This proof is past its expiry date, so it is no longer a valid verification. FRL displays no score or level for it.'
                            : 'FRL could not resolve this reference to a valid record, so it displays no score, level or factor result.'}
                      </p>
                    </div>

                    <dl className="grid grid-cols-1 gap-3 border-t border-white/[0.06] pt-4 sm:grid-cols-3">
                      <div>
                        <dt className="text-caption text-fg-subtle">Status</dt>
                        <dd className="mt-0.5 text-body-sm capitalize text-slate-100">
                          {String(verificationResult.status || 'unknown')}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-caption text-fg-subtle">Verified</dt>
                        <dd className="mt-0.5 text-body-sm text-slate-100">
                          {verificationResult.verifiedAt
                            ? new Date(verificationResult.verifiedAt).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Not reported'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-caption text-fg-subtle">Evidence policy</dt>
                        <dd className="mt-0.5 text-body-sm text-slate-100">
                          {verificationResult.policyVersion || 'Not reported'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PROOFS & CONTROLLED DISCLOSURES                                      */}
      {/* ========================================================================= */}
      {activeTab === 'proofs' && (
        <div className="space-y-6">
          <Card tone="base" padding="md">
            <CardHeader>
              <div>
                <CardTitle>Reputation proofs</CardTitle>
                <CardDescription>
                  A proof is a dated snapshot of your reputation at a moment in time, produced by
                  the FRL engine from your submitted evidence. Anyone holding the link can read it
                  until it expires or you revoke it.
                </CardDescription>
              </div>
              {canGenerateProof ? (
                <Button
                  onClick={handleGenerateProof}
                  loading={generatingProof}
                  icon={<ShieldCheck className="h-4 w-4" />}
                  className="shrink-0"
                >
                  Create Proof
                </Button>
              ) : null}
            </CardHeader>

            <CardContent className="mt-5 space-y-6">
              {proofError && (
                <div
                  role="alert"
                  className="rounded-md border border-rose-500/20 bg-rose-500/10 p-4 text-body-sm leading-relaxed text-rose-300"
                >
                  {proofError}
                </div>
              )}

              {/* Eligibility. A proof is minted only from a scored outcome, so
                  without one the honest answer is that none is available. */}
              {!canGenerateProof && (
                <div className="flex items-start gap-3 rounded-md border border-white/10 bg-white/[0.02] p-4">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-fg-subtle" aria-hidden="true" />
                  <div className="min-w-0">
                    <h3 className="text-body-sm font-semibold text-slate-100">Proof unavailable</h3>
                    <p className="mt-1 text-body-sm leading-relaxed text-fg-muted">
                      FRL can only mint a proof from a scored reputation, and you do not have one
                      yet. Complete your financial evidence first; the engine will produce a score,
                      and a proof becomes available at that point.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-label text-fg-subtle">Active proofs</h3>
                  <Badge tone="neutral" size="sm">
                    {proofs.filter((p) => p.status === 'active').length}
                  </Badge>
                </div>

                {proofsLoading ? (
                  <div className="flex items-center justify-center gap-2 rounded-md border border-white/[0.06] p-6 text-body-sm text-fg-muted">
                    <RefreshCw className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    Loading proofs…
                  </div>
                ) : proofs.filter((p) => p.status === 'active').length === 0 ? (
                  <div className="rounded-md border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-body-sm leading-relaxed text-fg-muted">
                    {canGenerateProof
                      ? 'No proof has been created yet. Create one to share a verified snapshot of your current reputation.'
                      : 'No proof exists, and none can be created until your evidence supports a reputation score.'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {proofs
                      .filter((p) => p.status === 'active')
                      .map((proof) => (
                        <div
                          key={proof.id}
                          className="rounded-md border border-white/10 bg-white/[0.02] p-4 transition-[border-color,background-color] duration-[var(--frl-dur-normal)] hover:border-white/20"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-caption text-slate-300">
                                  {proof.id.replace(/^proof_/, '').slice(0, 12)}
                                </span>
                                <Badge tone="success" size="sm" dot>
                                  Active
                                </Badge>
                              </div>
                              <div className="mt-2 flex flex-wrap items-baseline gap-3">
                                <span className="text-h3 text-white">{proof.score}</span>
                                <span className="text-body-sm text-fg-muted">/ 850</span>
                                <span className="text-body-sm uppercase tracking-[0.08em] text-primary-hover">
                                  {proof.level}
                                </span>
                              </div>
                              <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
                                <div className="flex items-baseline gap-1.5">
                                  <dt className="text-caption text-fg-subtle">Issued</dt>
                                  <dd className="text-caption text-slate-300">
                                    {new Date(proof.verifiedAt).toLocaleDateString('en-GB', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                  </dd>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                  <dt className="text-caption text-fg-subtle">Expires</dt>
                                  <dd className="text-caption text-slate-300">
                                    {new Date(proof.expiresAt).toLocaleDateString('en-GB', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                  </dd>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                  <dt className="text-caption text-fg-subtle">Policy</dt>
                                  <dd className="text-caption text-slate-300">
                                    {proof.policyVersion || 'Not reported'}
                                  </dd>
                                </div>
                              </dl>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  setSelectedProofForShare(proof);
                                  setShareModalOpen(true);
                                }}
                                icon={<Share2 className="h-3.5 w-3.5" />}
                              >
                                Share
                              </Button>
                              <a
                                href={`/verify/${proof.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-white/20 px-3 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/5"
                              >
                                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                                View
                              </a>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleCopyLink(proof.id)}
                                icon={
                                  copiedProofId === proof.id ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )
                                }
                              >
                                {copiedProofId === proof.id ? 'Copied' : 'Copy link'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRevokeProof(proof.id)}
                                className="text-rose-300 hover:text-rose-200"
                                icon={<XCircle className="h-3.5 w-3.5" />}
                              >
                                Revoke
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="space-y-3 border-t border-white/[0.06] pt-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-label text-fg-subtle">Controlled disclosure links</h3>
                  <Badge tone="neutral" size="sm">
                    {shares.length}
                  </Badge>
                </div>
                <p className="text-caption leading-relaxed text-fg-subtle">
                  A disclosure link releases less than a proof. You choose whether it carries the
                  score alone, the score and level, or the factor results.
                </p>

                {sharesLoading ? (
                  <div className="p-4 text-center text-body-sm text-fg-muted">Loading disclosures…</div>
                ) : shares.length === 0 ? (
                  <div className="rounded-md border border-dashed border-white/10 bg-white/[0.02] p-6 text-center text-body-sm text-fg-muted">
                    No disclosure links yet. Create one from an active proof to control what that
                    recipient can see.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {shares.map((share) => (
                      <div
                        key={share.id}
                        className="flex flex-col gap-3 rounded-md border border-white/10 bg-white/[0.02] p-4 lg:flex-row lg:items-center lg:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone="primary" size="sm">
                              {DISCLOSURE_LABEL[share.disclosureLevel] ?? share.disclosureLevel}
                            </Badge>
                            <span className="font-mono text-caption text-fg-muted">
                              {share.shareToken.replace(/^share_/, '').slice(0, 12)}…
                            </span>
                            <Badge
                              tone={
                                share.status === 'active'
                                  ? 'success'
                                  : share.status === 'revoked'
                                    ? 'danger'
                                    : 'warning'
                              }
                              size="sm"
                            >
                              {share.status === 'active'
                                ? 'Active'
                                : share.status === 'revoked'
                                  ? 'Revoked'
                                  : 'Expired'}
                            </Badge>
                          </div>
                          <p className="mt-1.5 text-caption text-fg-muted">
                            Expires{' '}
                            {new Date(share.expiresAt).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
                          <a
                            href={`/verify/${share.shareToken}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-9 items-center rounded-md border border-white/20 px-3 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/5"
                          >
                            View
                          </a>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleCopyLink(share.shareToken, true)}
                            icon={<Copy className="h-3.5 w-3.5" />}
                          >
                            {copiedShareToken === share.shareToken ? 'Copied' : 'Copy'}
                          </Button>
                          {share.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeShare(share.shareToken)}
                              className="text-rose-300 hover:text-rose-200"
                              icon={<XCircle className="h-3.5 w-3.5" />}
                            >
                              Revoke
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Retired proofs.
                  A revoked or expired proof shows its reference, its dates and
                  its state — but never its score. The score it carried is no
                  longer a current claim, and printing it beside a "revoked"
                  label is exactly how an old figure gets read as valid. */}
              {proofs.filter((p) => p.status !== 'active').length > 0 && (
                <div className="space-y-3 border-t border-white/[0.06] pt-6">
                  <h3 className="text-label text-fg-subtle">Retired proofs</h3>
                  <div className="space-y-2">
                    {proofs
                      .filter((p) => p.status !== 'active')
                      .map((proof) => (
                        <div
                          key={proof.id}
                          className="flex flex-col gap-3 rounded-md border border-white/[0.08] bg-white/[0.02] p-4 lg:flex-row lg:items-center lg:justify-between"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-caption text-fg-subtle">
                                {proof.id.replace(/^proof_/, '').slice(0, 12)}
                              </span>
                              <Badge
                                tone={proof.status === 'revoked' ? 'danger' : 'warning'}
                                size="sm"
                                dot
                              >
                                {proof.status === 'revoked' ? 'Proof revoked' : 'Proof expired'}
                              </Badge>
                            </div>
                            <p className="mt-1.5 text-caption leading-relaxed text-fg-subtle">
                              {proof.status === 'revoked'
                                ? 'Withdrawn by its owner. No longer a valid verification, so FRL displays no score for it.'
                                : 'Past its expiry date. No longer a valid verification, so FRL displays no score for it.'}
                            </p>
                          </div>
                          <span className="text-caption text-fg-subtle lg:shrink-0">
                            Issued{' '}
                            {new Date(proof.verifiedAt).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

{/* ========================================================================= */}
      {/* TAB 5: SUBMITTED FINANCIAL EVIDENCE                                        */}
      {/* ========================================================================= */}
      {activeTab === 'reputation_data' && (
        <div className="space-y-6">
          <Card tone="base" padding="md">
            <CardHeader>
              <div>
                <CardTitle>Submitted financial evidence</CardTitle>
                <CardDescription>
                  Everything the FRL engine reads from you, and exactly what it is missing. A field
                  shown as — was never reported. It is never treated as zero.
                </CardDescription>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                icon={<Edit3 className="h-4 w-4" />}
              >
                Update Evidence
              </Button>
            </CardHeader>

            <CardContent className="mt-5 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={isDemo ? 'demo' : 'neutral'} size="sm">
                  {isDemo ? 'Sample profile — not your evidence' : 'Your submitted evidence'}
                </Badge>
                {!isDemo && (
                  <Badge tone={realHasData ? 'success' : 'insufficient'} size="sm">
                    {realHasData ? 'Record on file' : 'No record on file'}
                  </Badge>
                )}
              </div>

              {!activeFinancialData ? (
                <div className="rounded-md border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
                  <PieChart className="mx-auto h-7 w-7 text-fg-subtle" aria-hidden="true" />
                  <h3 className="mt-3 text-h4 text-slate-100">No evidence has been submitted yet</h3>
                  <p className="mx-auto mt-2 max-w-lg text-body-sm leading-relaxed text-fg-muted">
                    FRL cannot calculate a reputation score until sufficient evidence exists. Nothing
                    is held on this workspace, so there is nothing to show and no score to publish.
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => setIsModalOpen(true)}
                    icon={<PlusCircle className="h-4 w-4" />}
                  >
                    Add Financial Evidence
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-body-sm text-fg-muted">
                    Evidence groups with submitted data:{' '}
                    <strong className="text-fg-secondary">
                      {evidenceGroupsWithData} of {EVIDENCE_GROUPS.length}
                    </strong>
                    . This counts groups rather than completeness, and FRL publishes a score only
                    when every required factor has evidence.
                  </p>

                  <div className="grid gap-3 lg:grid-cols-2">
                    {evidence.map(({ group, available }) => {
                      const Icon = group.icon;
                      const rows = group.rows(activeFinancialData);

                      return (
                        <Card key={group.id} tone="muted" padding="sm">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-2.5">
                              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-fg-subtle" aria-hidden="true" />
                              <div className="min-w-0">
                                <h4 className="text-body-sm font-semibold text-slate-100">
                                  {group.label}
                                </h4>
                                <p className="mt-1 text-caption leading-relaxed text-fg-muted">
                                  {group.purpose}
                                </p>
                              </div>
                            </div>
                            <Badge
                              tone={isDemo ? 'demo' : available ? 'success' : 'insufficient'}
                              size="sm"
                              className="shrink-0"
                            >
                              {isDemo ? 'Sample' : available ? 'Available' : 'Missing'}
                            </Badge>
                          </div>

                          <dl className="mt-4 space-y-0 border-t border-white/[0.06]">
                            {rows.map((row) => (
                              <div
                                key={row.label}
                                className="flex items-baseline justify-between gap-3 border-b border-white/[0.04] py-2 last:border-b-0"
                              >
                                <dt className="text-caption text-fg-muted">{row.label}</dt>
                                <dd
                                  className={`shrink-0 text-caption font-medium ${
                                    row.value === NOT_REPORTED ? 'text-fg-subtle' : 'text-slate-200'
                                  }`}
                                >
                                  {row.value}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        </Card>
                      );
                    })}
                  </div>

                  <p className="text-caption leading-relaxed text-fg-subtle">
                    This information is used by FRL to calculate your Business Reputation. Raw
                    financial information is not exposed through public reputation verification.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}


{/* Controlled disclosure share modal.

          The disclosure level is a real choice about how much the recipient
          learns, so it is a radiogroup: one tab stop, arrow keys, and a single
          code path per option. The previous markup wrapped each radio in a
          clickable <label>, so a click on the label fired both the label's own
          handler and the input's onChange. */}
      {shareModalOpen && selectedProofForShare && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="frl-share-title"
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
        >
          <div className="my-8 w-full max-w-lg rounded-lg border border-white/15 bg-slate-900 p-5 shadow-[var(--shadow-float)] sm:p-6">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <Share2 className="h-5 w-5 shrink-0 text-primary-hover" aria-hidden="true" />
                <h2 id="frl-share-title" className="text-h3 text-slate-100">
                  Create disclosure link
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShareModalOpen(false)}
                aria-label="Close"
                className="-mr-2 -mt-1 shrink-0"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <span className="text-caption text-fg-muted">Snapshot this link will share</span>
                <div className="mt-1.5 flex flex-wrap items-center gap-3 rounded-md border border-white/10 bg-white/[0.02] px-4 py-3">
                  <span className="font-mono text-caption text-fg-muted">
                    {selectedProofForShare.id.replace(/^proof_/, '').slice(0, 12)}
                  </span>
                  <span className="text-body-sm font-medium text-slate-100">
                    {selectedProofForShare.score} / 850
                  </span>
                  <span className="text-caption uppercase tracking-[0.08em] text-primary-hover">
                    {selectedProofForShare.level}
                  </span>
                </div>
              </div>

              <fieldset>
                <legend className="mb-2 text-caption font-medium text-fg-secondary">
                  How much should this recipient see?
                </legend>
                <div role="radiogroup" className="space-y-2">
                  {(
                    [
                      ['score_only', 'Score only', 'Share just the number. The safest option.'],
                      [
                        'score_and_level',
                        'Score and level',
                        'Adds the reputation band, for example Good or Excellent.',
                      ],
                      [
                        'score_and_factors',
                        'Score, level and factors',
                        'Adds the six factor results. No raw financial figures are ever included.',
                      ],
                    ] as const
                  ).map(([value, label, description]) => {
                    const selected = selectedDisclosureLevel === value;

                    return (
                      <label
                        key={value}
                        className={`flex cursor-pointer items-start gap-3 rounded-md border p-3.5 transition-colors ${
                          selected
                            ? 'border-primary/50 bg-primary/[0.08]'
                            : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                        }`}
                      >
                        <input
                          type="radio"
                          name="disclosure"
                          value={value}
                          checked={selected}
                          onChange={() => setSelectedDisclosureLevel(value)}
                          className="mt-1 h-3.5 w-3.5 shrink-0 accent-indigo-500"
                        />
                        <span className="min-w-0">
                          <span className="block text-body-sm font-semibold text-slate-100">
                            {label}
                          </span>
                          <span className="mt-0.5 block text-caption leading-relaxed text-fg-muted">
                            {description}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-2 text-caption font-medium text-fg-secondary">
                  When should the link stop working?
                </legend>
                <div className="grid grid-cols-3 gap-2">
                  {[7, 30, 90].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setSelectedExpiryDays(days)}
                      aria-pressed={selectedExpiryDays === days}
                      className={`h-11 rounded-md border text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-hover ${
                        selectedExpiryDays === days
                          ? 'border-primary/50 bg-primary/[0.12] text-white'
                          : 'border-white/10 text-fg-muted hover:border-white/20 hover:text-slate-200'
                      }`}
                    >
                      {days === 90 ? '90 days' : `${days} days`}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-caption text-fg-subtle">
                  The link stops disclosing anything after this date. You can revoke it sooner.
                </p>
              </fieldset>

              {shareError && (
                <div
                  role="alert"
                  className="rounded-md border border-rose-500/20 bg-rose-500/10 p-3 text-body-sm text-rose-300"
                >
                  {shareError}
                </div>
              )}

              <div className="flex flex-col-reverse gap-2 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-end">
                <Button variant="ghost" onClick={() => setShareModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateShare} loading={creatingShare} icon={<Share2 className="h-4 w-4" />}>
                  Create link
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Financial Input Modal */}
      <FinancialInputModal
        userId={userId}
        initialData={realFinancialData}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setDataMode('real');
          fetchRealData();
        }}
      />
    </div>
  );
}
