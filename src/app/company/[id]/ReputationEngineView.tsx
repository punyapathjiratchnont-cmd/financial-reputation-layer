'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  ChevronRight,
  Activity,
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  Info,
} from 'lucide-react';
import { calculateReputation, ReputationResult, ReputationLevel } from '@/lib/reputationEngine';
import { MOCK_FINANCIAL_PROFILES } from '@/lib/mockFinancialData';
import { AIAnalysisResult } from '@/lib/aiAnalysisService';
import { useLanguage } from '@/lib/i18n';

export function ReputationEngineView() {
  const { t, language } = useLanguage();
  const [selectedProfileKey, setSelectedProfileKey] = useState<string>('normal');

  // AI Analysis state
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(true);
  const [aiError, setAiError] = useState<string | null>(null);

  const currentProfile = MOCK_FINANCIAL_PROFILES[selectedProfileKey] || MOCK_FINANCIAL_PROFILES.normal;
  const result: ReputationResult = calculateReputation(currentProfile.data);
  const history = currentProfile.history;

  const fetchAIAnalysis = useCallback(async (profileKey: string) => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/reputation/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileKey,
          financialData: MOCK_FINANCIAL_PROFILES[profileKey]?.data,
          history: MOCK_FINANCIAL_PROFILES[profileKey]?.history,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch AI financial analysis.');
      }

      const data = await res.json();
      setAnalysis(data.analysis);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Unable to generate analysis right now.');
    } finally {
      setAiLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAIAnalysis(selectedProfileKey);
  }, [selectedProfileKey, fetchAIAnalysis]);

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

  const factorList = Object.values(result.factors);

  return (
    <div className="mt-12 p-6 md:p-8 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md space-y-8">
      {/* Header & Interactive Profile Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-slate-100">Financial Reputation Engine</h2>
          </div>
          <p className="text-xs text-slate-400">
            Real-time engine calculation based on financial data parameters (300–850 scale).
          </p>
        </div>

        {/* Profile Test Selector */}
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedProfileKey}
            onChange={(e) => setSelectedProfileKey(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/15 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
          >
            {Object.entries(MOCK_FINANCIAL_PROFILES).map(([key, item]) => (
              <option key={key} value={key} className="bg-slate-900 text-slate-200">
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Score Display & Level */}
      <div className="grid md:grid-cols-3 gap-6 items-center bg-black/30 p-6 rounded-2xl border border-white/5">
        <div className="text-center md:text-left space-y-1">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Engine Computed Score</span>
          <div className="flex items-baseline justify-center md:justify-start gap-3">
            <span className="text-5xl font-extrabold tracking-tight text-white">{result.score}</span>
            <span className="text-sm font-medium text-slate-400">/ 850</span>
          </div>
          <div className="pt-1">{getLevelBadge(result.level)}</div>
        </div>

        {/* Score History Progression */}
        <div className="md:col-span-2 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold flex items-center gap-1.5 text-slate-300">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Score History & Progression
            </span>
            <span className="font-mono text-[11px] text-slate-500">Last 4 Quarters</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {history.map((pt, idx) => (
              <div key={idx} className="flex items-center gap-2 shrink-0">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center min-w-[80px]">
                  <span className="block text-[10px] text-slate-500 font-mono">{pt.date}</span>
                  <span className="text-sm font-bold text-slate-200">{pt.score}</span>
                </div>
                {idx < history.length - 1 && <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Factor Breakdown */}
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

      {/* AI FINANCIAL ANALYSIS LAYER */}
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
              onClick={() => fetchAIAnalysis(selectedProfileKey)}
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
                <span className="font-mono text-[10px] text-indigo-400/80">Analyzed {new Date(analysis.analyzedAt).toLocaleTimeString()}</span>
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
  );
}
