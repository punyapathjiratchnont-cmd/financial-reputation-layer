'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
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
} from '@/lib/reputationEngine';
import { MOCK_FINANCIAL_PROFILES } from '@/lib/mockFinancialData';
import { AIAnalysisResult } from '@/lib/aiAnalysisService';
import {
  Claim,
  ScoreHistoryItem,
  ReputationProof,
  ReputationShare,
  DisclosureLevel,
} from '@/lib/types';
import { ScoreHistoryChart } from './ScoreHistoryChart';
import { FinancialInputModal } from './FinancialInputModal';
import { useLanguage } from '@/lib/i18n';

interface ReputationEngineViewProps {
  userId?: string;
}

export type MainNavTab = 'dashboard' | 'my_reputation' | 'verify' | 'proofs' | 'reputation_data';

export function ReputationEngineView({ userId = 'c1' }: ReputationEngineViewProps) {
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

  // Financial Audited Ratios (Section 9)
  const monthlyInc = activeFinancialData?.income?.monthly || 0;
  const monthlyExp = activeFinancialData?.expenses?.monthlyAvg || 0;
  const monthlySav = activeFinancialData?.savings?.monthlyContribution || 0;
  const totalSav = activeFinancialData?.savings?.currentBalance || 0;
  const totalDebt = activeFinancialData?.debts?.totalDebt || 0;
  const monthlyDebtService = activeFinancialData?.debts?.monthlyDebtService || 0;

  const savingsRate = monthlyInc > 0 ? ((monthlySav / monthlyInc) * 100).toFixed(1) : '0.0';
  const expenseRatio = monthlyInc > 0 ? ((monthlyExp / monthlyInc) * 100).toFixed(1) : '0.0';
  const dtiRatio = monthlyInc > 0 ? ((monthlyDebtService / monthlyInc) * 100).toFixed(1) : '0.0';

  return (
    <div className="mt-8 space-y-8">
      {/* SECTION 3: NEW MAIN NAVIGATION BAR */}
      <div className="p-2 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-xl flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('my_reputation')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'my_reputation'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Award className="w-4 h-4" />
            My Reputation
          </button>

          <button
            onClick={() => setActiveTab('verify')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'verify'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Verify Company
          </button>

          <button
            onClick={() => setActiveTab('proofs')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'proofs'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Lock className="w-4 h-4" />
            Proofs ({proofs.filter(p => p.status === 'active').length})
          </button>

          <button
            onClick={() => setActiveTab('reputation_data')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'reputation_data'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Reputation Data
          </button>
        </div>

        {/* Mode Selector & Status Badge */}
        <div className="flex flex-wrap items-center gap-2 px-2 min-w-0">
          <div className="inline-flex items-center rounded-xl bg-black/40 border border-white/10 p-1 text-[11px]">
            <button
              onClick={() => setDataMode('real')}
              className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                dataMode === 'real' ? 'bg-indigo-600/80 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3 h-3" />
              Real Data
            </button>
            <button
              onClick={() => setDataMode('demo')}
              className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                dataMode === 'demo' ? 'bg-indigo-600/80 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3 h-3" />
              Demo Mode
            </button>
          </div>

          {isDemo && (
            <select
              value={selectedProfileKey}
              onChange={(e) => setSelectedProfileKey(e.target.value)}
              className="px-2.5 py-1 rounded-xl bg-black/40 border border-white/15 text-slate-200 text-[11px] focus:outline-none w-full sm:w-auto max-w-full min-w-0"
            >
              {Object.entries(MOCK_FINANCIAL_PROFILES).map(([key, item]) => (
                <option key={key} value={key} className="bg-slate-900 text-slate-200">
                  {item.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* DEMO MODE NOTICE (Section 17) */}
      {isDemo && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              <strong>DEMO MODE:</strong> Currently using sample business data profile (<code className="bg-black/40 px-1.5 py-0.5 rounded text-amber-200">{selectedProfileKey}</code>).
            </span>
          </div>
          <button
            onClick={() => setDataMode('real')}
            className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-bold transition-colors shrink-0"
          >
            Switch to Real Data
          </button>
        </div>
      )}

      {/* EVIDENCE POLICY: missing or partial evidence never renders a score. */}
      {!loading && activeOutcome && activeOutcome.status === 'insufficient' && (
        <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="block uppercase tracking-wider">Insufficient Data</strong>
            <span className="text-amber-300/90">{activeOutcome.reason}</span>
            <span className="block text-amber-300/70">
              FRL will not publish a reputation score until every required factor has verified evidence.
            </span>
          </div>
        </div>
      )}

      {/* SECTION 16: EMPTY STATE HANDLING */}
      {!isDemo && !loading && !realHasData && (
        <div className="p-12 rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 backdrop-blur-md text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <PieChart className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-xl font-bold text-slate-100">Your Business Reputation is not ready yet</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Add your financial and transaction information to calculate your first reputation score and generate verifiable business signals.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all inline-flex items-center gap-2 shadow-lg shadow-indigo-600/30"
          >
            <PlusCircle className="w-4 h-4" />
            Add Reputation Data
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: DASHBOARD (Sections 4, 5, 6)                                       */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (isDemo || realHasData) && scored && (
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
      {/* TAB 5: REPUTATION DATA / FINANCIAL METRICS MANAGEMENT (Section 9)           */}
      {/* ========================================================================= */}
      {activeTab === 'reputation_data' && (
        <div className="space-y-8 max-w-4xl mx-auto">
          <div className="p-8 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-2xl space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-100">Manage Reputation Data</h2>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  This information is used by FRL to calculate your Business Reputation. Raw financial information is not exposed through public reputation verification.
                </p>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 shrink-0"
              >
                <Edit3 className="w-4 h-4" />
                Update Reputation Data
              </button>
            </div>

            {/* Grouped Financial Sections (Section 9) */}
            <div className="grid md:grid-cols-2 gap-6 text-xs">
              {/* Group 1: Income & Stability */}
              <div className="p-5 rounded-2xl bg-black/30 border border-white/10 space-y-3">
                <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Income & Stability
                </h3>
                <div className="space-y-2 text-slate-300">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span>Monthly Income:</span>
                    <strong className="text-slate-100">฿{monthlyInc.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span>Stability Duration:</span>
                    <strong className="text-slate-100">{activeFinancialData?.income?.stabilityMonths || 0} Months</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Revenue Sources:</span>
                    <strong className="text-slate-100">{activeFinancialData?.income?.sourcesCount || 1} Sources</strong>
                  </div>
                </div>
              </div>

              {/* Group 2: Expenses & Spending */}
              <div className="p-5 rounded-2xl bg-black/30 border border-white/10 space-y-3">
                <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-indigo-400" />
                  Expenses & Spending
                </h3>
                <div className="space-y-2 text-slate-300">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span>Monthly Average Expenses:</span>
                    <strong className="text-slate-100">฿{monthlyExp.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Expense Ratio:</span>
                    <strong className="text-indigo-400">{expenseRatio}%</strong>
                  </div>
                </div>
              </div>

              {/* Group 3: Payments */}
              <div className="p-5 rounded-2xl bg-black/30 border border-white/10 space-y-3">
                <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Payments & Obligations
                </h3>
                <div className="space-y-2 text-slate-300">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span>Total Payments Due:</span>
                    <strong className="text-slate-100">{activeFinancialData?.payments?.totalDue || 0}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span>On-time Count:</span>
                    <strong className="text-emerald-400">{activeFinancialData?.payments?.onTimeCount || 0}</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Late / Missed:</span>
                    <strong className="text-amber-400">
                      {(activeFinancialData?.payments?.lateCount || 0) + (activeFinancialData?.payments?.missedCount || 0)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Group 4: Savings */}
              <div className="p-5 rounded-2xl bg-black/30 border border-white/10 space-y-3">
                <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  Savings & Reserves
                </h3>
                <div className="space-y-2 text-slate-300">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span>Total Liquid Balance:</span>
                    <strong className="text-emerald-400">฿{totalSav.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span>Monthly Contribution:</span>
                    <strong className="text-slate-100">฿{monthlySav.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Savings Rate:</span>
                    <strong className="text-emerald-400">{savingsRate}%</strong>
                  </div>
                </div>
              </div>

              {/* Group 5: Debt */}
              <div className="p-5 rounded-2xl bg-black/30 border border-white/10 space-y-3">
                <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Debt Liabilities
                </h3>
                <div className="space-y-2 text-slate-300">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span>Total Liabilities:</span>
                    <strong className="text-amber-400">฿{totalDebt.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span>Monthly Debt Service:</span>
                    <strong className="text-slate-100">฿{monthlyDebtService.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>DTI Ratio:</span>
                    <strong className="text-amber-400">{dtiRatio}%</strong>
                  </div>
                </div>
              </div>

              {/* Group 6: Transaction History */}
              <div className="p-5 rounded-2xl bg-black/30 border border-white/10 space-y-3">
                <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  Transaction History
                </h3>
                <div className="space-y-2 text-slate-300">
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span>6-Month Transactions:</span>
                    <strong className="text-slate-100">{activeFinancialData?.transactions?.count6Months || 0}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span>Account Duration:</span>
                    <strong className="text-slate-100">{activeFinancialData?.transactions?.oldestAccountYears || 0} Years</strong>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Bounced Checks:</span>
                    <strong className="text-rose-400">{activeFinancialData?.transactions?.bouncedCount || 0}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
