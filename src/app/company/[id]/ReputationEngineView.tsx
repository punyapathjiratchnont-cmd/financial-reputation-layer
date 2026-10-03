'use client';

import { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { calculateReputation, ReputationResult, ReputationLevel, UserFinancialData } from '@/lib/reputationEngine';
import { MOCK_FINANCIAL_PROFILES } from '@/lib/mockFinancialData';
import { AIAnalysisResult } from '@/lib/aiAnalysisService';
import { ScoreHistoryItem, UserFinancialRecord } from '@/lib/types';
import { ScoreHistoryChart } from './ScoreHistoryChart';
import { FinancialInputModal } from './FinancialInputModal';
import { useLanguage } from '@/lib/i18n';

interface ReputationEngineViewProps {
  userId?: string;
}

export function ReputationEngineView({ userId = 'c1' }: ReputationEngineViewProps) {
  const { language } = useLanguage();

  // Mode state: 'real' or 'demo'
  const [dataMode, setDataMode] = useState<'real' | 'demo'>('real');
  const [selectedProfileKey, setSelectedProfileKey] = useState<string>('normal');

  // Real user state
  const [realHasData, setRealHasData] = useState<boolean>(true);
  const [realFinancialData, setRealFinancialData] = useState<UserFinancialData | null>(null);
  const [realReputation, setRealReputation] = useState<ReputationResult | null>(null);
  const [realHistory, setRealHistory] = useState<ScoreHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // AI Analysis state
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(true);
  const [aiError, setAiError] = useState<string | null>(null);

  // Fetch Real Reputation Data from API
  const fetchRealData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reputation?userId=${userId}&mode=real`);
      if (res.ok) {
        const data = await res.json();
        setRealHasData(data.hasData);
        if (data.hasData) {
          setRealReputation(data.reputation);
          setRealHistory(data.history || []);
          setRealFinancialData(data.financialData);
        } else {
          setRealReputation(null);
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
  }, [fetchRealData]);

  // Compute active data based on mode
  const isDemo = dataMode === 'demo';
  const demoProfile = MOCK_FINANCIAL_PROFILES[selectedProfileKey] || MOCK_FINANCIAL_PROFILES.normal;

  const activeReputation: ReputationResult | null = isDemo
    ? calculateReputation(demoProfile.data)
    : realReputation;

  const activeFinancialData: UserFinancialData | null = isDemo
    ? demoProfile.data
    : realFinancialData;

  const activeHistory = isDemo ? demoProfile.history : realHistory;

  // Fetch AI Analysis when active data changes
  const fetchAIAnalysis = useCallback(async () => {
    if (!activeReputation) {
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
          profileKey: isDemo ? selectedProfileKey : undefined,
          financialData: activeFinancialData,
          history: activeHistory,
        }),
      });

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
  }, [activeReputation, activeFinancialData, activeHistory, isDemo, selectedProfileKey]);

  useEffect(() => {
    fetchAIAnalysis();
  }, [fetchAIAnalysis]);

  const getLevelBadge = (level: ReputationLevel) => {
    switch (level) {
      case 'Excellent':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">EXCELLENT</span>;
      case 'Good':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">GOOD</span>;
      case 'Fair':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">FAIR</span>;
      case 'Low':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">LOW</span>;
    }
  };

  // Financial Metrics Calculation (Requirement 9)
  const monthlyInc = activeFinancialData?.income?.monthly || 0;
  const monthlyExp = activeFinancialData?.expenses?.monthlyAvg || 0;
  const monthlySav = activeFinancialData?.savings?.monthlyContribution || 0;
  const totalSav = activeFinancialData?.savings?.currentBalance || 0;
  const totalDebt = activeFinancialData?.debts?.totalDebt || 0;

  const savingsRate = monthlyInc > 0 ? ((monthlySav / monthlyInc) * 100).toFixed(1) : '0.0';
  const expenseRatio = monthlyInc > 0 ? ((monthlyExp / monthlyInc) * 100).toFixed(1) : '0.0';
  const debtRatio = (totalDebt + totalSav) > 0 ? ((totalDebt / (totalDebt + totalSav)) * 100).toFixed(1) : '0.0';

  const factorList = activeReputation ? Object.values(activeReputation.factors) : [];

  return (
    <div className="mt-12 p-6 md:p-8 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-md space-y-8">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-6 h-6 text-indigo-400" />
            <h2 className="text-2xl font-bold text-slate-100">Financial Reputation Dashboard</h2>
          </div>
          <p className="text-xs text-slate-400">
            Real user financial engine & reputation history (300–850 range).
          </p>
        </div>

        {/* Mode Selector & Edit Trigger */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center rounded-xl bg-black/40 border border-white/10 p-1 text-xs font-medium">
            <button
              onClick={() => setDataMode('real')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                dataMode === 'real' ? 'bg-indigo-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Real User Data
            </button>
            <button
              onClick={() => setDataMode('demo')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                dataMode === 'demo' ? 'bg-indigo-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Demo Mode
            </button>
          </div>

          {isDemo ? (
            <select
              value={selectedProfileKey}
              onChange={(e) => setSelectedProfileKey(e.target.value)}
              className="px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-slate-200 text-xs focus:outline-none"
            >
              {Object.entries(MOCK_FINANCIAL_PROFILES).map(([key, item]) => (
                <option key={key} value={key} className="bg-slate-900 text-slate-200">
                  {item.label}
                </option>
              ))}
            </select>
          ) : (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Update Financial Data
            </button>
          )}
        </div>
      </div>

      {/* DEMO MODE WARNING BADGE */}
      {isDemo && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0" />
          <span>
            <strong>DEMO MODE ACTIVE:</strong> Currently displaying mock financial test profile (<code className="bg-black/30 px-1 rounded">{selectedProfileKey}</code>). Switch to Real User Data for live metrics.
          </span>
        </div>
      )}

      {/* EMPTY STATE HANDLING (Requirement 12) */}
      {!isDemo && !loading && !realHasData && (
        <div className="p-10 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 text-center space-y-4">
          <PieChart className="w-12 h-12 text-slate-600 mx-auto" />
          <div>
            <h3 className="text-lg font-medium text-slate-200">Financial data is not available yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Add your verified monthly income, savings, and expense details to generate your official Financial Reputation Score.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors inline-flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Add Financial Data
          </button>
        </div>
      )}

      {/* MAIN DASHBOARD CONTENT (When data exists) */}
      {(isDemo || realHasData) && activeReputation && (
        <div className="space-y-8">
          {/* Main Score & Level Card */}
          <div className="grid md:grid-cols-3 gap-6 items-center bg-black/30 p-6 rounded-2xl border border-white/5">
            <div className="text-center md:text-left space-y-1">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Engine Computed Score</span>
              <div className="flex items-baseline justify-center md:justify-start gap-3">
                <span className="text-5xl font-extrabold tracking-tight text-white">{activeReputation.score}</span>
                <span className="text-sm font-medium text-slate-400">/ 850</span>
              </div>
              <div className="pt-1">{getLevelBadge(activeReputation.level)}</div>
            </div>

            {/* SVG Score History Line Chart (Requirement 8) */}
            <div className="md:col-span-2 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
              <ScoreHistoryChart history={activeHistory} />
            </div>
          </div>

          {/* FINANCIAL OVERVIEW SUMMARY CARDS & DERIVED METRICS (Requirement 9) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-sm font-semibold uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Financial Overview Summary
              </h3>
              <span className="text-xs text-slate-500 font-mono">FINANCIAL METRICS (NOT SCORES)</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-1">
                <span className="text-[11px] text-slate-400">Monthly Income</span>
                <span className="block text-lg font-bold text-slate-100">฿{monthlyInc.toLocaleString()}</span>
              </div>
              <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-1">
                <span className="text-[11px] text-slate-400">Monthly Expenses</span>
                <span className="block text-lg font-bold text-slate-100">฿{monthlyExp.toLocaleString()}</span>
              </div>
              <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-1">
                <span className="text-[11px] text-slate-400">Total Savings</span>
                <span className="block text-lg font-bold text-emerald-400">฿{totalSav.toLocaleString()}</span>
              </div>
              <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-1">
                <span className="text-[11px] text-slate-400">Total Debt</span>
                <span className="block text-lg font-bold text-amber-400">฿{totalDebt.toLocaleString()}</span>
              </div>
            </div>

            {/* Derived Ratios */}
            <div className="grid grid-cols-3 gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Savings Rate</span>
                <strong className="text-emerald-400 text-sm font-mono">{savingsRate}%</strong>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Expense Ratio</span>
                <strong className="text-indigo-400 text-sm font-mono">{expenseRatio}%</strong>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Debt-to-Asset Ratio</span>
                <strong className="text-amber-400 text-sm font-mono">{debtRatio}%</strong>
              </div>
            </div>
          </div>

          {/* FACTOR BREAKDOWN (Requirement 7) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-sm font-semibold uppercase text-slate-300 tracking-wider">
                Factor Breakdown & Score Impact
              </h3>
              <span className="text-xs text-slate-400 font-mono">6 FRL ENGINE FACTORS</span>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {factorList.map((factor) => (
                <div
                  key={factor.name}
                  className="p-4 rounded-xl bg-black/20 border border-white/5 flex items-center justify-between hover:border-white/10 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-slate-200">{factor.name}</h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                        {factor.refAxis}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>Score: <strong className="text-slate-100">{factor.score}</strong></span>
                      <span>•</span>
                      <span>Weight: {(factor.weight * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        factor.impact >= 0
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {factor.impact >= 0 ? `+${factor.impact}` : factor.impact} impact
                    </span>
                    <span className="block text-[11px] text-slate-500 mt-1">{factor.level}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI FINANCIAL ANALYSIS LAYER (Requirement 10) */}
          <div className="pt-6 border-t border-white/10 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">
                    {language === 'th' ? 'การวิเคราะห์การเงินด้วย AI (AI Financial Analysis)' : 'AI Financial Analysis'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {language === 'th'
                      ? 'AI สรุปและอธิบายที่มาของคะแนนจาก Reputation Engine โดยไม่มีอำนาจแก้ไขคะแนน'
                      : 'Analytical insight layer strictly summarizing engine factors without score modification power.'}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2 py-1 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 self-start md:self-auto">
                AI Service Layer (Rule-Engine Abstraction)
              </span>
            </div>

            {/* Loading State */}
            {aiLoading && (
              <div className="p-8 rounded-2xl bg-black/20 border border-white/5 text-center space-y-3">
                <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
                <p className="text-xs text-slate-400">
                  {language === 'th' ? 'กำลังวิเคราะห์ข้อมูลทางการเงิน...' : 'Analyzing financial data...'}
                </p>
              </div>
            )}

            {/* Error State */}
            {aiError && !aiLoading && (
              <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-3">
                <AlertTriangle className="w-6 h-6 text-rose-400 mx-auto" />
                <p className="text-sm font-medium text-rose-300">
                  {language === 'th' ? 'ไม่สามารถประมวลผลการวิเคราะห์ได้ในขณะนี้' : 'Unable to generate analysis right now.'}
                </p>
                <button
                  onClick={fetchAIAnalysis}
                  className="px-4 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 text-xs font-medium transition-colors"
                >
                  {language === 'th' ? 'ลองใหม่อีกครั้ง (Retry)' : 'Retry Analysis'}
                </button>
              </div>
            )}

            {/* Successful Analysis Output */}
            {analysis && !aiLoading && !aiError && (
              <div className="space-y-6">
                {/* Executive Summary Box */}
                <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-indigo-300">
                    <span className="flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-indigo-400" />
                      {language === 'th' ? 'บทสรุปผู้บริหารโดย AI' : 'Executive Summary'}
                    </span>
                    <span className="font-mono text-[10px] text-indigo-400/80">
                      Analyzed {new Date(analysis.analyzedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed">{analysis.summary}</p>
                </div>

                {/* Strengths & Concerns Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Strengths */}
                  <div className="p-5 rounded-2xl bg-black/20 border border-emerald-500/20 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      {language === 'th' ? 'จุดแข็งที่สนับสนุนคะแนน (Strengths)' : 'Verified Strengths'}
                    </h4>
                    {analysis.strengths.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No specific strengths flagged for current baseline.</p>
                    ) : (
                      <ul className="space-y-2 text-xs text-slate-300">
                        {analysis.strengths.map((str, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-emerald-400 font-bold shrink-0">✓</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Areas to Monitor */}
                  <div className="p-5 rounded-2xl bg-black/20 border border-amber-500/20 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      {language === 'th' ? 'ปัจจัยที่ควรติดตาม (Areas to Monitor)' : 'Areas to Monitor'}
                    </h4>
                    {analysis.concerns.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No risk concerns detected.</p>
                    ) : (
                      <ul className="space-y-2 text-xs text-slate-300">
                        {analysis.concerns.map((con, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-amber-400 font-bold shrink-0">△</span>
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Trend & Actionable Recommendations */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Trend Analysis */}
                  <div className="p-5 rounded-2xl bg-black/20 border border-white/5 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-indigo-400" />
                      {language === 'th' ? 'การวิเคราะห์แนวโน้ม (Trend Analysis)' : 'Trend Analysis'}
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {analysis.trends.map((tr, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-indigo-400 font-bold shrink-0">↑</span>
                          <span>{tr}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Actionable Recommendations */}
                  <div className="p-5 rounded-2xl bg-black/20 border border-white/5 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-indigo-400" />
                      {language === 'th' ? 'ข้อแนะนำเชิงสร้างสรรค์ (AI Recommendations)' : 'Non-Judgmental Guidance'}
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {analysis.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-slate-400 font-bold shrink-0">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
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
