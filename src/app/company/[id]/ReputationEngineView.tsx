'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  type LucideIcon,
  TrendingUp,
  Activity,
  Sliders,
  Sparkles,
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
  BarChart3,
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

          {/* SECTION 6: PROMINENT "VERIFY A COMPANY" CARD */}
          <div className="p-8 rounded-3xl border border-indigo-500/20 bg-indigo-500/[0.03] backdrop-blur-xl shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  Verify a Company
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Review a company's verified FRL reputation information before doing business.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('verify')}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 self-start sm:self-auto"
              >
                Go to Verification Center <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Verification Input */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={verifyInput}
                  onChange={(e) => setVerifyInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyCompanyLookup()}
                  placeholder="Enter FRL Verification Link or ID (e.g. proof_... or share_...)"
                  className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/15 rounded-xl text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <button
                onClick={() => handleVerifyCompanyLookup()}
                disabled={verifyingCompany || !verifyInput.trim()}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shrink-0 flex items-center justify-center gap-2"
              >
                {verifyingCompany ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Verify Company
              </button>
            </div>

            {verificationError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{verificationError}</span>
              </div>
            )}

            {/* Inline Result Render if Quick Lookup Triggered */}
            {verificationResult && verificationResult.valid === true && (
              <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-4 text-left">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-xs font-mono text-indigo-400 font-bold uppercase">Verification Lookup Result</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ✓ Verified by FRL
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-400 block">Business Reputation Score</span>
                    <span className="text-4xl font-extrabold text-white block mt-1">{verificationResult.reputation?.score || 'N/A'}</span>
                    {verificationResult.reputation?.level && (
                      <div className="mt-1">{getLevelBadge(verificationResult.reputation.level)}</div>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 space-y-1 sm:text-right">
                    <div>Status: <strong className="text-slate-200 capitalize">{verificationResult.status}</strong></div>
                    <div>Verified: <strong className="text-slate-200">{new Date(verificationResult.verifiedAt).toLocaleDateString()}</strong></div>
                    <div>Expires: <strong className="text-slate-200">{new Date(verificationResult.expiresAt).toLocaleDateString()}</strong></div>
                  </div>
                </div>

                {/* Neutral B2B Disclosure Notice */}
                <p className="text-[11px] text-slate-400 pt-3 border-t border-white/5 leading-relaxed">
                  FRL verifies the reputation information shown here. This information is intended to support business decisions and does not guarantee future business performance.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MY REPUTATION (Sections 8, 10, 13)                                 */}
      {/* ========================================================================= */}
      {activeTab === 'my_reputation' && (isDemo || realHasData) && scored && (
        <div className="space-y-8">
          <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-2xl space-y-6">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-2xl font-bold text-slate-100">My Business Reputation Details</h2>
              <p className="text-xs text-slate-400 mt-1">
                Detailed view of score breakdown, engine factors, historical trend, and AI analytical explanation.
              </p>
            </div>

            {/* Score & Level Display */}
            <div className="grid md:grid-cols-3 gap-6 items-center bg-black/30 p-6 rounded-2xl border border-white/5">
              <div className="text-center md:text-left space-y-1">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Engine Computed Score</span>
                <div className="flex items-baseline justify-center md:justify-start gap-3">
                  <span className="text-5xl font-extrabold tracking-tight text-white">{scored.score}</span>
                  <span className="text-sm font-medium text-slate-400">/ 850</span>
                </div>
                <div className="pt-1">{getLevelBadge(scored.level)}</div>
              </div>

              <div className="md:col-span-2 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
                <ScoreHistoryChart history={activeHistory} />
              </div>
            </div>

            {/* 4 B2B Dimensions Explanations (Section 10) */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-bold uppercase text-slate-300 tracking-wider">
                Major Reputation Dimensions
              </h3>

              <div className="grid sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-200 text-sm">Payment Reliability</strong>
                    <span className="font-bold text-emerald-400">{b2bDimensions.paymentReliability}</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Evaluates how consistently financial obligations and supplier invoices are paid on time.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-200 text-sm">Business Reliability</strong>
                    <span className="font-bold text-indigo-400">{b2bDimensions.businessReliability}</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Signals derived from operational transaction behavior and counterparty consistency.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-200 text-sm">Financial Stability</strong>
                    <span className="font-bold text-slate-200">{b2bDimensions.financialStability}</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Signals related to revenue consistency, expense coverage, and liquid savings buffers.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-200 text-sm">Transaction History</strong>
                    <span className="font-bold text-amber-400">{b2bDimensions.transactionHistory}</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Signals derived from historical transaction activity, account duration, and bounced checks.
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 8 & 13: WHY IS MY SCORE LIKE THIS? (AI REPUTATION ANALYSIS) */}
            <div className="pt-8 border-t border-white/10 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-xl font-bold text-slate-100">Why is my score like this?</h3>
                </div>
                <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  Reputation Analysis
                </span>
              </div>

              {/* Disclaimer */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-white/10 text-[11px] text-slate-400 flex items-start gap-2">
                <FileText className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  AI-generated insights are informational and based strictly on the financial data available in your profile. They do not determine your reputation score or constitute financial, lending, or investment decisions.
                </span>
              </div>

              {aiLoading && (
                <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                  <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin mx-auto" />
                  <p>Analyzing reputation factors...</p>
                </div>
              )}

              {/* Errors are surfaced, never silently swallowed. No result is
                  shown and no request is retried automatically: the retry is a
                  deliberate user action. */}
              {aiError && !aiLoading && (
                <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <strong className="block uppercase tracking-wider">
                        Analysis unavailable
                      </strong>
                      <span className="text-amber-300/90">{aiError}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => fetchAIAnalysis()}
                    className="shrink-0 self-start sm:self-auto px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 hover:bg-amber-500/25 text-xs font-semibold transition-colors"
                  >
                    Try again
                  </button>
                </div>
              )}

              {analysis && !aiLoading && (
                <div className="space-y-6 text-xs">
                  <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
                    <h4 className="font-bold text-indigo-300 uppercase tracking-wider text-[11px]">Executive Summary</h4>
                    <p className="text-slate-200 text-sm leading-relaxed">{analysis.summary}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-5 rounded-2xl bg-black/20 border border-emerald-500/20 space-y-3">
                      <h4 className="font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Verified Strengths
                      </h4>
                      <ul className="space-y-2 text-slate-300">
                        {analysis.strengths.map((str, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-emerald-400 font-bold">✓</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-5 rounded-2xl bg-black/20 border border-amber-500/20 space-y-3">
                      <h4 className="font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        Areas to Monitor
                      </h4>
                      <ul className="space-y-2 text-slate-300">
                        {analysis.concerns.map((con, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-amber-400 font-bold">△</span>
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: VERIFY COMPANY (Sections 6 & 7)                                   */}
      {/* ========================================================================= */}
      {activeTab === 'verify' && (
        <div className="space-y-8 max-w-3xl mx-auto">
          <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-2xl space-y-6">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-indigo-400" />
                Verify a Company
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Review a company's verified FRL reputation information before doing business.
              </p>
            </div>

            {/* Verification Search Bar */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Enter FRL Verification Link or ID
              </label>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={verifyInput}
                  onChange={(e) => setVerifyInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyCompanyLookup()}
                  placeholder="Paste verification URL or ID (e.g. proof_... or share_...)"
                  className="flex-1 px-4 py-3 bg-black/40 border border-white/15 rounded-xl text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />

                <button
                  onClick={() => handleVerifyCompanyLookup()}
                  disabled={verifyingCompany || !verifyInput.trim()}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 shrink-0"
                >
                  {verifyingCompany ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Verify Company
                </button>
              </div>

              {/* Sample Quick Testing Links */}
              <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-400 flex-wrap">
                <span>Try sample links:</span>
                {proofs[0] && (
                  <button
                    onClick={() => {
                      setVerifyInput(proofs[0].id);
                      handleVerifyCompanyLookup(proofs[0].id);
                    }}
                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-indigo-300 font-mono"
                  >
                    {proofs[0].id.substring(0, 16)}...
                  </button>
                )}
                {shares[0] && (
                  <button
                    onClick={() => {
                      setVerifyInput(shares[0].shareToken);
                      handleVerifyCompanyLookup(shares[0].shareToken);
                    }}
                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-indigo-300 font-mono"
                  >
                    {shares[0].shareToken.substring(0, 16)}...
                  </button>
                )}
              </div>
            </div>

            {verificationError && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{verificationError}</span>
              </div>
            )}

            {verificationResult && verificationResult.valid !== true && (
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="block uppercase tracking-wider">This record is not valid</strong>
                  <span className="text-amber-300/90">
                    Status: {String(verificationResult.status || 'unknown')}. FRL shows no score
                    for this record because it is no longer a valid verification.
                  </span>
                </div>
              </div>
            )}

            {/* SECTION 7: COMPANY VERIFICATION RESULT PAGE */}
            {verificationResult && verificationResult.valid === true && (
              <div className="p-8 rounded-3xl bg-black/40 border border-white/15 space-y-6 text-center shadow-2xl">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-extrabold uppercase tracking-widest">
                  <CheckCircle2 className="w-4 h-4" />
                  ✓ Verified by FRL
                </div>

                <h3 className="text-2xl font-black text-slate-100">
                  Business Reputation
                </h3>

                <div className="py-4 border-y border-white/10 space-y-1">
                  <div className="text-6xl font-black text-white tracking-tight">
                    {verificationResult.reputation?.score || 'N/A'}
                  </div>
                  {verificationResult.reputation?.level && (
                    <div className="text-lg font-bold text-indigo-400 uppercase tracking-wider">
                      {verificationResult.reputation.level}
                    </div>
                  )}
                </div>

                {/* 4 Major Reputation Dimensions Breakdown */}
                <div className="space-y-3 text-left pt-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center mb-4">
                    Verified Reputation Dimensions
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
                      <span className="text-slate-400 font-medium">Payment Reliability</span>
                      <strong className="text-slate-100 font-bold text-sm mt-1">
                        {verificationResult.reputation?.factors?.paymentReliability || b2bDimensions.paymentReliability}
                      </strong>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
                      <span className="text-slate-400 font-medium">Business Reliability</span>
                      <strong className="text-slate-100 font-bold text-sm mt-1">
                        {b2bDimensions.businessReliability}
                      </strong>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
                      <span className="text-slate-400 font-medium">Financial Stability</span>
                      <strong className="text-slate-100 font-bold text-sm mt-1">
                        {verificationResult.reputation?.factors?.incomeConsistency || b2bDimensions.financialStability}
                      </strong>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
                      <span className="text-slate-400 font-medium">Transaction History</span>
                      <strong className="text-slate-100 font-bold text-sm mt-1">
                        {verificationResult.reputation?.factors?.transactionHistory || b2bDimensions.transactionHistory}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Metadata Dates */}
                <div className="grid grid-cols-2 gap-3 text-xs py-3 px-4 rounded-xl bg-black/30 border border-white/5">
                  <div>
                    <span className="block text-slate-500 text-[10px] uppercase">Verified Date</span>
                    <strong className="text-slate-200">{new Date(verificationResult.verifiedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-[10px] uppercase">Expiration Date</span>
                    <strong className="text-slate-200">{new Date(verificationResult.expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                  </div>
                </div>

                {/* Official Non-Sensational Explanation (Section 7) */}
                <p className="text-xs text-slate-400 leading-relaxed pt-3 border-t border-white/10 italic">
                  "FRL verifies the reputation information shown here. This information is intended to support business decisions and does not guarantee future business performance."
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PROOFS & SELECTIVE DISCLOSURE SHARES (Sections 11 & 12)             */}
      {/* ========================================================================= */}
      {activeTab === 'proofs' && (
        <div className="space-y-8">
          <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-2xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-100">My Reputation Proofs</h2>
                {/* Section 12 Required Wording */}
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  Create a verified snapshot of your current Business Reputation that you can share with another company.
                </p>
              </div>

              {/* Primary Action Button (Section 12) */}
              <button
                onClick={handleGenerateProof}
                disabled={generatingProof || (!isDemo && !realHasData)}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 shrink-0"
              >
                {generatingProof ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Create Reputation Proof
              </button>
            </div>

            {proofError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                {proofError}
              </div>
            )}

            {/* Active Proofs Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Active Reputation Proofs
              </h3>

              {proofsLoading ? (
                <div className="p-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Loading proofs...
                </div>
              ) : proofs.filter(p => p.status === 'active').length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-slate-800 bg-black/20 text-center text-slate-400 text-xs">
                  You haven't created an active Reputation Proof yet. Click "Create Reputation Proof" above to generate a verified snapshot for business sharing.
                </div>
              ) : (
                <div className="space-y-3">
                  {proofs.filter(p => p.status === 'active').map((proof) => (
                    <div
                      key={proof.id}
                      className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-200">
                            Proof #{proof.id.substring(6, 14)}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Active
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                          <strong className="text-white font-extrabold text-sm">{proof.score} {proof.level}</strong>
                          <span>•</span>
                          <span>Expires: {new Date(proof.expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <button
                          onClick={() => {
                            setSelectedProofForShare(proof);
                            setShareModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          Create Share Link
                        </button>

                        <a
                          href={`/verify/${proof.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          View
                        </a>

                        <button
                          onClick={() => handleCopyLink(proof.id)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-200 text-xs font-medium transition-colors flex items-center gap-1"
                        >
                          {copiedProofId === proof.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          Copy Link
                        </button>

                        <button
                          onClick={() => handleRevokeProof(proof.id)}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium transition-colors flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          Revoke
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Controlled Reputation Disclosure Shares Section */}
            <div className="space-y-4 pt-6 border-t border-white/10">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-400" />
                Controlled Selective Disclosure Links
              </h3>

              {sharesLoading ? (
                <div className="p-4 text-center text-xs text-slate-500">Loading shares...</div>
              ) : shares.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-slate-800 bg-black/20 text-center text-slate-400 text-xs">
                  No selective disclosure links created yet. Click "Create Share Link" on any active proof to generate a custom disclosure link.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {shares.map((share) => (
                    <div
                      key={share.id}
                      className="p-4 rounded-xl border border-white/10 bg-black/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-indigo-300 uppercase font-mono text-[11px] px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                            {share.disclosureLevel.replace('_', ' ')}
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">{share.shareToken.substring(0, 16)}...</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {share.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Expires: {new Date(share.expiresAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={`/verify/${share.shareToken}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 text-slate-200 hover:bg-white/10 text-xs"
                        >
                          View
                        </a>
                        <button
                          onClick={() => handleCopyLink(share.shareToken, true)}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-200 hover:bg-indigo-600/40 text-xs"
                        >
                          Copy
                        </button>
                        {share.status === 'active' && (
                          <button
                            onClick={() => handleRevokeShare(share.shareToken)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-xs"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past Proofs Section (Section 11) */}
            {proofs.filter(p => p.status !== 'active').length > 0 && (
              <div className="space-y-4 pt-6 border-t border-white/10">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Past Proofs (Expired / Revoked)
                </h3>

                <div className="space-y-2 opacity-70">
                  {proofs.filter(p => p.status !== 'active').map((proof) => (
                    <div key={proof.id} className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono text-slate-400">Proof #{proof.id.substring(6, 14)}</span>
                        <span className="ml-2 font-bold text-slate-300">{proof.score} {proof.level}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase">
                        {proof.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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


      {/* SHARE LINK CREATION MODAL */}
      {shareModalOpen && selectedProofForShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-white/15 shadow-2xl space-y-6 text-left">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-slate-100">Create Controlled Share Link</h3>
              </div>
              <button onClick={() => setShareModalOpen(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-medium">Selected Proof Baseline:</span>
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between text-xs">
                <span className="font-mono text-slate-200 font-bold">Proof #{selectedProofForShare.id.substring(6, 14)}</span>
                <span className="text-indigo-400 font-bold">Score: {selectedProofForShare.score} ({selectedProofForShare.level})</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Select Disclosure Level</label>
              <div className="space-y-2 text-xs">
                <label onClick={() => setSelectedDisclosureLevel('score_only')} className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${selectedDisclosureLevel === 'score_only' ? 'bg-indigo-600/20 border-indigo-500/50 text-slate-100 ring-1 ring-indigo-500/50' : 'bg-black/30 border-white/10 text-slate-400'}`}>
                  <input type="radio" name="disclosure" checked={selectedDisclosureLevel === 'score_only'} onChange={() => setSelectedDisclosureLevel('score_only')} className="mt-0.5 accent-indigo-500" />
                  <div>
                    <strong className="block text-slate-200 font-semibold mb-0.5">○ Score Only</strong>
                    <span className="text-slate-400 text-[11px]">Share only my reputation score.</span>
                  </div>
                </label>

                <label onClick={() => setSelectedDisclosureLevel('score_and_level')} className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${selectedDisclosureLevel === 'score_and_level' ? 'bg-indigo-600/20 border-indigo-500/50 text-slate-100 ring-1 ring-indigo-500/50' : 'bg-black/30 border-white/10 text-slate-400'}`}>
                  <input type="radio" name="disclosure" checked={selectedDisclosureLevel === 'score_and_level'} onChange={() => setSelectedDisclosureLevel('score_and_level')} className="mt-0.5 accent-indigo-500" />
                  <div>
                    <strong className="block text-slate-200 font-semibold mb-0.5">○ Score + Level</strong>
                    <span className="text-slate-400 text-[11px]">Share my score and reputation level.</span>
                  </div>
                </label>

                <label onClick={() => setSelectedDisclosureLevel('score_and_factors')} className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${selectedDisclosureLevel === 'score_and_factors' ? 'bg-indigo-600/20 border-indigo-500/50 text-slate-100 ring-1 ring-indigo-500/50' : 'bg-black/30 border-white/10 text-slate-400'}`}>
                  <input type="radio" name="disclosure" checked={selectedDisclosureLevel === 'score_and_factors'} onChange={() => setSelectedDisclosureLevel('score_and_factors')} className="mt-0.5 accent-indigo-500" />
                  <div>
                    <strong className="block text-slate-200 font-semibold mb-0.5">○ Score + Factors</strong>
                    <span className="text-slate-400 text-[11px]">Share my score, level, and qualitative reputation factors.</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Link Expiration</label>
              <div className="grid grid-cols-3 gap-2">
                {[7, 30, 90].map((days) => (
                  <button key={days} type="button" onClick={() => setSelectedExpiryDays(days)} className={`py-2 rounded-xl text-xs font-medium border transition-colors ${selectedExpiryDays === days ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-black/30 border-white/10 text-slate-400'}`}>
                    {days === 90 ? '90 days / Max' : `${days} days`}
                  </button>
                ))}
              </div>
            </div>

            {shareError && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">{shareError}</div>}

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/10">
              <button type="button" onClick={() => setShareModalOpen(false)} className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-medium">Cancel</button>
              <button type="button" onClick={handleCreateShare} disabled={creatingShare} className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5">
                {creatingShare ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
                Create Share Link
              </button>
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
