'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search as SearchIcon, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { MOCK_COMPANIES } from '@/lib/mockData';
import { useLanguage, LanguageToggle } from '@/lib/i18n';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const { t } = useLanguage();

  const filteredCompanies = MOCK_COMPANIES.filter((company) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    return (
      company.name.toLowerCase().includes(q) ||
      company.registration_no.toLowerCase().includes(q) ||
      company.industry.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <span className="font-semibold text-lg tracking-tight">FRL</span>
          </Link>
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <Link href="/principles" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              {t('nav.principles', 'Principles')}
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-28 pb-20 max-w-4xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Find a Company</h1>
          <p className="text-sm text-slate-400">
            Search the FRL Business Reputation Directory by company name or 13-digit registration ID.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-10">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-indigo-400" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type company name, registration number, or industry..."
            className="block w-full pl-11 pr-4 py-4 bg-slate-900 border border-white/15 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500 transition-all text-sm shadow-xl"
          />
        </div>

        {/* Search Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Search Results ({filteredCompanies.length})
            </h2>
          </div>

          {filteredCompanies.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white/5 border border-white/10">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold mb-1">No Companies Found</h3>
              <p className="text-xs text-slate-400 mb-4">
                No company matching &quot;{query}&quot; was found in the reputation directory.
              </p>
              <button
                onClick={() => setQuery('')}
                className="px-4 py-2 bg-indigo-600/30 text-indigo-200 border border-indigo-500/30 rounded-xl text-xs font-semibold hover:bg-indigo-600/40 transition-colors"
              >
                Clear Search
              </button>
            </div>
          ) : (
            filteredCompanies.map((company) => {
              const hasScore = company.reputationScore !== null && company.reputationScore !== undefined;

              return (
                <div
                  key={company.id}
                  className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-indigo-500/40 transition-all shadow-lg hover:shadow-indigo-500/5 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-slate-800/80 rounded-2xl border border-white/10 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                        {company.logo || '🏢'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-lg font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                            {company.name}
                          </h3>
                          {company.isClaimed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              <CheckCircle2 className="w-3 h-3 text-indigo-400" />
                              Official
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                              Public Profile
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          {company.industry} &bull; Reg: {company.registration_no} &bull; {company.country || 'Global'}
                        </p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-white/10 shrink-0 gap-3">
                      <div className="text-left sm:text-right">
                        <span className="text-[11px] text-slate-400 block font-semibold">
                          Business Reputation
                        </span>
                        {hasScore ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-2xl font-extrabold text-amber-400">
                              ⭐ {company.reputationScore}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">/ 1000</span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-amber-400/90 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 inline-block mt-0.5">
                            Insufficient Data
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/company/${company.id}`}
                        className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                      >
                        View Company
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading directory...</div>}>
      <SearchContent />
    </Suspense>
  );
}
