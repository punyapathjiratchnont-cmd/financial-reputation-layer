'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  ShieldCheck, 
  TrendingUp, 
  Award, 
  Calendar, 
  HelpCircle, 
  Globe, 
  FileText, 
  Lock,
  MessageSquare,
  Sparkles,
  ArrowRight,
  PieChart
} from 'lucide-react';
import { Company } from '@/lib/types';
import { ReputationEngineView } from './ReputationEngineView';

interface Props {
  company: Company;
}

export function CompanyProfileView({ company }: Props) {
  const [viewMode, setViewMode] = useState<'profile' | 'workspace'>('profile');

  const hasScore = company.reputationScore !== null && company.reputationScore !== undefined;
  const dims = company.dimensions;

  // Development sample records must never read as a real, verified company.
  const isDemoCompany = company.sourceInfo?.sourceType === 'internal_demo';

  // The UI states the record's real verification status. It never asserts one.
  const verificationStatus = company.sourceInfo?.verificationStatus;
  const verificationLabel =
    verificationStatus === 'verified'
      ? 'Verified by FRL'
      : verificationStatus === 'unverified'
        ? 'Not verified by FRL'
        : 'Verification status not reported';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30 pb-24">
      {/* Top Sticky Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <span className="font-semibold text-lg tracking-tight">FRL</span>
            <span className="text-xs text-slate-500 font-mono ml-2 border-l border-white/10 pl-2">Directory</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/search"
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              Search Companies
            </Link>

            {/* Mode Switcher Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-white/10">
              <button
                onClick={() => setViewMode('profile')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'profile'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Company Profile
              </button>
              <button
                onClick={() => setViewMode('workspace')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'workspace'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Owner Workspace
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="pt-24 max-w-5xl mx-auto px-6">
        {isDemoCompany && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-100 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <strong className="block uppercase tracking-wider text-amber-300 mb-1">
                Demo data — not a real company
              </strong>
              This record is development sample data. It is not a verified company, the score
              shown below is not a real reputation, and FRL has verified nothing about it.
            </div>
          </div>
        )}

        {viewMode === 'workspace' ? (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-indigo-400" />
                <div>
                  <h2 className="text-sm font-bold text-slate-100">Private Owner Workspace</h2>
                  <p className="text-xs text-slate-400">
                    Manage financial inputs, create reputation proofs, and control selective disclosure shares for {company.name}.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewMode('profile')}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold transition-colors"
              >
                View Public Profile
              </button>
            </div>
            <ReputationEngineView />
          </div>
        ) : (
          <div className="space-y-12">
            {/* Header Profile Title Card */}
            <div className="p-8 rounded-3xl bg-slate-900/90 border border-white/10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
                <div className="flex items-start gap-5">
                  <div className="w-20 h-20 bg-slate-800 rounded-2xl border border-white/10 flex items-center justify-center text-4xl shrink-0 shadow-inner">
                    {company.logo || '🏢'}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                        {company.name}
                      </h1>
                      {isDemoCompany ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-400/40">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          Demo Data — Not a Real Company
                        </span>
                      ) : company.isClaimed ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                          Official Claimed Profile
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          <Info className="w-3.5 h-3.5 text-amber-400" />
                          Public Profile (Unclaimed)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Reg ID: <span className="font-mono text-slate-300">{company.registration_no}</span> &bull; {company.industry} &bull; {company.country ?? 'Country not reported'} &bull; Founded {company.founded_date}
                    </p>

                    {/* Compact provenance strip inside the existing header card.
                        Answers "where did this information come from?" without adding a
                        new section. Every value falls back to an honest unknown state. */}
                    <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px]">
                      <span className="inline-flex items-center gap-1.5">
                        <Globe className="w-3 h-3 text-indigo-400" />
                        <span className="text-slate-500">Source</span>
                        <span className="font-semibold text-slate-200">
                          {company.sourceInfo?.provider ?? 'Not reported'}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <ShieldCheck className="w-3 h-3 text-indigo-400" />
                        <span className="text-slate-500">Verification</span>
                        <span className="font-semibold text-slate-200">{verificationLabel}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-indigo-400" />
                        <span className="text-slate-500">Retrieved</span>
                        <span className="font-semibold text-slate-200">
                          {company.sourceInfo?.retrievedAt
                            ? new Date(company.sourceInfo.retrievedAt).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Not reported'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Action */}
                <div className="shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('workspace')}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold transition-all flex items-center gap-2"
                  >
                    <Lock className="w-3.5 h-3.5 text-indigo-400" />
                    Manage Profile Data
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION 1: ⭐ BUSINESS REPUTATION (HERO SECTION) */}
            <section className="p-8 rounded-3xl bg-slate-900 border border-indigo-500/30 shadow-2xl relative">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-8 pb-8 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-amber-400 mb-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    1. Business Reputation (Hero)
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Reputation Signal</h2>
                  <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
                    Composite business reputation generated from verified payment reliability, historical transactions, and financial stability indicators available to FRL.
                  </p>

                  {/* State B: Insufficient Data is a legitimate data state, not an error.
                      Applies to any company record that carries no score, demo or real. */}
                  {!hasScore && (
                    <p className="text-xs text-amber-300/90 max-w-lg leading-relaxed">
                      <strong className="font-bold">Insufficient Data.</strong> FRL does not
                      have enough verified financial evidence to calculate a reputation score for
                      this company. This is a normal data state, not an error.
                    </p>
                  )}
                </div>

                {/* Score Hero Badge */}
                <div className="text-left md:text-right shrink-0 bg-slate-950 p-6 rounded-2xl border border-white/10 min-w-[220px]">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                    {isDemoCompany ? 'Demo Reputation Score (not real)' : 'Reputation Score'}
                  </span>
                  {hasScore ? (
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-amber-400 tracking-tight">
                          {company.reputationScore}
                        </span>
                        <span className="text-sm font-semibold text-slate-500">/ 1000</span>
                      </div>
                      <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {company.reputationLevel ?? 'Insufficient Data'}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <div className="text-3xl font-bold text-amber-400/80 tracking-tight">
                        — / 1000
                      </div>
                      <span className="inline-block mt-2 px-3 py-1 rounded-md text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        Insufficient Data
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 4 Core Dimensions */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Reputation Dimensions
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Payment Reliability */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-slate-200">Payment Reliability</span>
                      {dims?.paymentReliability?.isSufficient && dims.paymentReliability.score ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-emerald-400">
                            {dims.paymentReliability.score} / 1000
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {dims.paymentReliability.label}
                          </span>
                        </div>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          Insufficient Data
                        </span>
                      )}
                    </div>
                    {dims?.paymentReliability?.isSufficient && dims.paymentReliability.score ? (
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${(dims.paymentReliability.score / 1000) * 100}%` }}
                        />
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 mt-1">Not enough verified payment records.</p>
                    )}
                  </div>

                  {/* Business Reliability */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-slate-200">Business Reliability</span>
                      {dims?.businessReliability?.isSufficient && dims.businessReliability.score ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-indigo-400">
                            {dims.businessReliability.score} / 1000
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                            {dims.businessReliability.label}
                          </span>
                        </div>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          Insufficient Data
                        </span>
                      )}
                    </div>
                    {dims?.businessReliability?.isSufficient && dims.businessReliability.score ? (
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all"
                          style={{ width: `${(dims.businessReliability.score / 1000) * 100}%` }}
                        />
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 mt-1">Not enough verified business attestation data.</p>
                    )}
                  </div>

                  {/* Financial Stability */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-slate-200">Financial Stability</span>
                      {dims?.financialStability?.isSufficient && dims.financialStability.score ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-cyan-400">
                            {dims.financialStability.score} / 1000
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                            {dims.financialStability.label}
                          </span>
                        </div>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          Insufficient Data
                        </span>
                      )}
                    </div>
                    {dims?.financialStability?.isSufficient && dims.financialStability.score ? (
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                        <div
                          className="bg-cyan-500 h-full rounded-full transition-all"
                          style={{ width: `${(dims.financialStability.score / 1000) * 100}%` }}
                        />
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 mt-1">Financial stability metrics unavailable.</p>
                    )}
                  </div>

                  {/* Transaction History */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-slate-200">Transaction History</span>
                      {dims?.transactionHistory?.isSufficient && dims.transactionHistory.score ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-amber-400">
                            {dims.transactionHistory.score} / 1000
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            {dims.transactionHistory.label}
                          </span>
                        </div>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          Insufficient Data
                        </span>
                      )}
                    </div>
                    {dims?.transactionHistory?.isSufficient && dims.transactionHistory.score ? (
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                        <div
                          className="bg-amber-500 h-full rounded-full transition-all"
                          style={{ width: `${(dims.transactionHistory.score / 1000) * 100}%` }}
                        />
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 mt-1">Transaction history data not submitted.</p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 2: 💡 SCORE EXPLANATION ("Why this score?") */}
            <section className="p-8 rounded-3xl bg-slate-900/90 border border-white/10 shadow-xl">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">
                <HelpCircle className="w-4 h-4" />
                2. Score Explanation
              </div>
              <h2 className="text-xl font-bold text-white mb-6">Why does this company have this score?</h2>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <h4 className="text-xs font-bold text-slate-300 uppercase mb-1">Payment Reliability</h4>
                  <p className="text-xs text-slate-400">
                    {dims?.paymentReliability?.explanation ?? 'Insufficient Data'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <h4 className="text-xs font-bold text-slate-300 uppercase mb-1">Business Reliability</h4>
                  <p className="text-xs text-slate-400">
                    {dims?.businessReliability?.explanation ?? 'Insufficient Data'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <h4 className="text-xs font-bold text-slate-300 uppercase mb-1">Financial Stability</h4>
                  <p className="text-xs text-slate-400">
                    {dims?.financialStability?.explanation ?? 'Insufficient Data'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <h4 className="text-xs font-bold text-slate-300 uppercase mb-1">Transaction History</h4>
                  <p className="text-xs text-slate-400">
                    {dims?.transactionHistory?.explanation ?? 'Insufficient Data'}
                  </p>
                </div>
              </div>
            </section>

            {/* SECTION 3: 🏢 COMPANY INFORMATION */}
            <section className="p-8 rounded-3xl bg-slate-900/90 border border-white/10 shadow-xl">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">
                <Building2 className="w-4 h-4" />
                3. Company Information
              </div>
              <h2 className="text-xl font-bold text-white mb-6">Corporate Details</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[11px] text-slate-500 uppercase font-bold block mb-1">Company Name</span>
                  <span className="text-sm font-semibold text-slate-100">{company.name}</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[11px] text-slate-500 uppercase font-bold block mb-1">Business Type</span>
                  <span className="text-sm font-semibold text-slate-100">{company.industry}</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[11px] text-slate-500 uppercase font-bold block mb-1">Country</span>
                  <span className="text-sm font-semibold text-slate-100">{company.country ?? 'Country not reported'}</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-[11px] text-slate-500 uppercase font-bold block mb-1">Founded Year</span>
                  <span className="text-sm font-semibold text-slate-100">{company.founded_date}</span>
                </div>
              </div>
            </section>

            {/* SECTION 4: 📖 COMPANY OVERVIEW */}
            <section className="p-8 rounded-3xl bg-slate-900/90 border border-white/10 shadow-xl">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">
                <FileText className="w-4 h-4" />
                4. Company Overview
              </div>
              <h2 className="text-xl font-bold text-white mb-3">About {company.name}</h2>
              <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                {company.overview ?? 'Company overview not available.'}
              </p>
            </section>

            {/* SECTION 5: 📋 QUICK SUMMARY */}
            <section className="p-8 rounded-3xl bg-slate-900/90 border border-white/10 shadow-xl">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">
                <PieChart className="w-4 h-4" />
                5. Quick Summary
              </div>
              <h2 className="text-xl font-bold text-white mb-6">Key Signals & Data Status</h2>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Strengths */}
                <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                  <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-3">
                    🟢 Strengths
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {company.quickSummary?.strengths.map((st, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-400">&bull;</span>
                        <span>{st}</span>
                      </li>
                    )) || <li>No specific strengths recorded.</li>}
                  </ul>
                </div>

                {/* Things to Consider */}
                <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                  <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2 mb-3">
                    🟠 Things to Consider
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {company.quickSummary?.thingsToConsider.map((tc, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-400">&bull;</span>
                        <span>{tc}</span>
                      </li>
                    )) || <li>No specific warnings recorded.</li>}
                  </ul>
                </div>

                {/* Data Status */}
                <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20">
                  <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-2 mb-3">
                    📊 Data Status
                  </h3>
                  <p className="text-xs text-slate-300 font-semibold mb-2">
                    {company.quickSummary?.dataStatus ?? 'Data status not reported'}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {verificationLabel}
                    {company.sourceInfo?.provider
                      ? ` Source: ${company.sourceInfo.provider}.`
                      : ' No source recorded for this record.'}
                  </p>
                </div>
              </div>
            </section>

            {/* SECTION 6: 🏆 BUSINESS TRACK RECORD */}
            <section className="p-8 rounded-3xl bg-slate-900/90 border border-white/10 shadow-xl">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">
                <Award className="w-4 h-4" />
                6. Business Track Record
              </div>
              <h2 className="text-xl font-bold text-white mb-6">Achievements, Partnerships & Performance</h2>

              <div className="space-y-6">
                {/* Achievements */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Achievements & Projects</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {company.trackRecord?.achievements.map((ach, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-bold text-slate-200">{ach.title}</h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                            {ach.source}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{ach.description}</p>
                      </div>
                    )) || <p className="text-xs text-slate-500">No public achievements listed.</p>}
                  </div>
                </div>

                {/* Business Relationships */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Business Relationships</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {company.trackRecord?.relationships.map((rel, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-slate-200">{rel.partner}</h4>
                          <p className="text-xs text-slate-400">{rel.relationshipType}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                          {rel.source}
                        </span>
                      </div>
                    )) || <p className="text-xs text-slate-500">No public relationship records listed.</p>}
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 7: 📜 REPUTATION HISTORY */}
            <section className="p-8 rounded-3xl bg-slate-900/90 border border-white/10 shadow-xl">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">
                <Calendar className="w-4 h-4" />
                7. Reputation History
              </div>
              <h2 className="text-xl font-bold text-white mb-6">Historical Events & Milestones</h2>

              <div className="relative pl-6 border-l-2 border-indigo-500/30 space-y-6">
                {company.reputationHistory?.map((ev, i) => (
                  <div key={i} className="relative group">
                    <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-slate-900 border-2 border-indigo-400 group-hover:bg-indigo-500 transition-colors" />
                    <span className="text-xs font-mono font-bold text-indigo-400">{ev.year}</span>
                    <h4 className="text-sm font-bold text-slate-200 mt-0.5">{ev.event}</h4>
                    <span className="text-[11px] text-slate-500 font-semibold">{ev.source}</span>
                  </div>
                )) || <p className="text-xs text-slate-500">No historical events recorded.</p>}
              </div>
            </section>

            {/* SECTION 8: 📊 DATA & TRENDS */}
            <section className="p-8 rounded-3xl bg-slate-900/90 border border-white/10 shadow-xl">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">
                <TrendingUp className="w-4 h-4" />
                8. Data & Trends
              </div>
              <h2 className="text-xl font-bold text-white mb-6">Reputation Trend Analytics</h2>

              {company.scoreHistory && company.scoreHistory.length > 0 ? (
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                    Score Trend Over Time (0 - 1000)
                  </h3>
                  {/* SVG Line Chart */}
                  <div className="h-40 w-full flex items-end justify-between gap-2 pt-4 px-2">
                    {company.scoreHistory.map((item, idx) => {
                      const heightPct = (item.score / 1000) * 100;
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                          <span className="text-[11px] font-bold text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.score}
                          </span>
                          <div className="w-full bg-slate-800 rounded-t-lg overflow-hidden flex items-end h-32">
                            <div
                              className="w-full bg-gradient-to-t from-indigo-600 to-amber-400 rounded-t-lg transition-all group-hover:brightness-125"
                              style={{ height: `${heightPct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">{item.date}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-start gap-2">
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3.5 py-1 rounded-md border border-amber-500/20">
                    Insufficient Data
                  </span>
                  <p className="text-xs text-slate-400 mt-1">
                    No historical reputation data is available.
                  </p>
                </div>
              )}
            </section>

            {/* SECTION 9: ⚠️ CURRENT ISSUES */}
            <section className="p-8 rounded-3xl bg-slate-900/90 border border-white/10 shadow-xl">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">
                <AlertTriangle className="w-4 h-4" />
                9. Current Issues
              </div>
              <h2 className="text-xl font-bold text-white mb-6">Verified Issues, Gaps & AI Analysis</h2>

              {/* 🟢 Clean State Check */}
              {(!company.currentIssues ||
                (company.currentIssues.verifiedIssues.length === 0 &&
                  company.currentIssues.informationGaps.length === 0 &&
                  company.currentIssues.aiAnalysis.length === 0)) ? (
                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-emerald-300">🟢 No Current Issues</h3>
                    <p className="text-xs text-emerald-400/80">
                      No verified issues have been identified from the available data.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* 🔴 VERIFIED ISSUES */}
                  {company.currentIssues?.verifiedIssues && company.currentIssues.verifiedIssues.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                        🔴 Verified Issues (Evidence-backed)
                      </h3>
                      {company.currentIssues.verifiedIssues.map((iss, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30">
                          <h4 className="text-sm font-bold text-rose-300">{iss.title}</h4>
                          <p className="text-xs text-slate-300 mt-1">{iss.detail}</p>
                          <span className="text-[10px] text-rose-400 font-mono mt-2 block">
                            Source: {iss.source}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 🟡 INFORMATION GAPS */}
                  {company.currentIssues?.informationGaps && company.currentIssues.informationGaps.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        🟡 Information Gaps
                      </h3>
                      {company.currentIssues.informationGaps.map((gap, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                          <h4 className="text-sm font-bold text-amber-300">{gap.title}</h4>
                          <p className="text-xs text-slate-300 mt-1">{gap.detail}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 🔵 AI ANALYSIS */}
                  {company.currentIssues?.aiAnalysis && company.currentIssues.aiAnalysis.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        🔵 AI Reputation Analysis (Interpretation Layer)
                      </h3>
                      {company.currentIssues.aiAnalysis.map((ai, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30">
                          <h4 className="text-sm font-bold text-indigo-300">{ai.title}</h4>
                          <p className="text-xs text-slate-300 mt-1">{ai.detail}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
