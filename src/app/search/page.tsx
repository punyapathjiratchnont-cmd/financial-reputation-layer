'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search as SearchIcon, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle, Loader2, Globe } from 'lucide-react';
import { CompanySearchResult } from '@/lib/types';
import { useLanguage, LanguageToggle } from '@/lib/i18n';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState<'all' | 'claimed' | 'unclaimed'>('all');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<CompanySearchResult[]>([]);
  const [providerInfo, setProviderInfo] = useState<{ provider?: string; configured?: boolean; message?: string }>({});

  const { t } = useLanguage();

  // Perform search against Next.js server API (/api/companies/search)
  const performSearch = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || trimmed.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/companies/search?q=${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      if (!res.ok && data.error) {
        setError(data.error);
        setResults([]);
      } else {
        setResults(data.results || []);
        setProviderInfo({
          provider: data.provider,
          configured: data.configured,
          message: data.message,
        });
      }
    } catch (err) {
      setError('Unable to search companies right now. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Run search on initial load if query exists
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveQuery(query);
    performSearch(query);
  };

  // Filter client-side by claimed / unclaimed status
  const filteredResults = results.filter((item) => {
    if (statusFilter === 'claimed') return item.profileStatus === 'claimed';
    if (statusFilter === 'unclaimed') return item.profileStatus === 'unclaimed';
    return true;
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
            Search real corporate identities via OpenCorporates and the FRL Business Reputation Directory.
          </p>
        </div>

        {/* Search Bar Form */}
        <form onSubmit={handleSearchSubmit} className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-indigo-400" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search company name, registration ID, or Toyota, Microsoft..."
            className="block w-full pl-11 pr-28 py-4 bg-slate-900 border border-white/15 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500 transition-all text-sm shadow-xl"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-2 bottom-2 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </button>
        </form>

        {/* Provider Info Banner */}
        {providerInfo.message && (
          <div className="mb-6 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{providerInfo.message}</span>
          </div>
        )}

        {/* Status Filter Pills */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 mr-1">Filter:</span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border-white/10 hover:bg-white/5'
            }`}
          >
            All Statuses
          </button>
          <button
            onClick={() => setStatusFilter('claimed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              statusFilter === 'claimed'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border-white/10 hover:bg-white/5'
            }`}
          >
            Official Claimed
          </button>
          <button
            onClick={() => setStatusFilter('unclaimed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              statusFilter === 'unclaimed'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border-white/10 hover:bg-white/5'
            }`}
          >
            Public Unclaimed
          </button>
        </div>

        {/* Search Results Area */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {loading ? 'Searching...' : `Search Results (${filteredResults.length})`}
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center rounded-2xl bg-white/5 border border-white/10">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-200 mb-1">Searching companies...</h3>
              <p className="text-xs text-slate-400">Querying real company business registry data.</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-rose-300 mb-1">Unable to search companies right now</h3>
              <p className="text-xs text-slate-400 mb-4">{error}</p>
              <button
                onClick={() => performSearch(query)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-500 transition-colors"
              >
                Please Try Again
              </button>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white/5 border border-white/10">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold mb-1">No Companies Found</h3>
              <p className="text-xs text-slate-400 mb-4">
                No company matching &quot;{activeQuery || query}&quot; was found. Try a different company name or ID.
              </p>
            </div>
          ) : (
            filteredResults.map((item) => {
              const isClaimed = item.profileStatus === 'claimed';

              return (
                <div
                  key={item.id}
                  className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-indigo-500/40 transition-all shadow-lg hover:shadow-indigo-500/5 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Initials or Logo Avatar Fallback */}
                      <div className="w-14 h-14 bg-slate-800/80 rounded-2xl border border-white/10 flex items-center justify-center text-xl font-bold text-slate-300 shrink-0 group-hover:scale-105 transition-transform">
                        {item.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.logoUrl} alt={item.name} className="w-10 h-10 object-contain" />
                        ) : (
                          item.name.substring(0, 2).toUpperCase()
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-lg font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
                            {item.name}
                          </h3>
                          {isClaimed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              <CheckCircle2 className="w-3 h-3 text-indigo-400" />
                              Official Claimed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                              Public Profile (Unclaimed)
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-400 mb-1.5">
                          {item.businessType || item.industry || 'Corporate Entity'} &bull; Reg:{' '}
                          {item.registrationNumber || 'N/A'} &bull; {item.country || 'Global'}
                        </p>

                        {/* Provenance / Source Label */}
                        <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                          <span>Source:</span>
                          <span className="text-indigo-400/90">{item.source?.provider || 'OpenCorporates'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-white/10 shrink-0 gap-3">
                      <div className="text-left sm:text-right">
                        <span className="text-[11px] text-slate-400 block font-semibold">
                          Business Reputation
                        </span>
                        {/* STRICT PRODUCT RULE: REAL COMPANY IDENTITY DOES NOT AUTOMATICALLY CREATE A REPUTATION SCORE */}
                        {isClaimed ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-2xl font-extrabold text-amber-400">⭐ 815</span>
                            <span className="text-xs font-semibold text-slate-400">/ 1000</span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-amber-400/90 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 inline-block mt-0.5">
                            — / 1000 Insufficient Data
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/company/${item.id}`}
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
    <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading search directory...</div>}>
      <SearchContent />
    </Suspense>
  );
}
