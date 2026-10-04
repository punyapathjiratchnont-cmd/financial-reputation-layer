'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search as SearchIcon,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { CompanySearchResult } from '@/lib/types';
import { useLanguage, LanguageToggle } from '@/lib/i18n';

type ProviderStatus =
  | 'ok'
  | 'not_configured'
  | 'provider_unavailable'
  | 'provider_error'
  | 'malformed_response';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState<'all' | 'claimed' | 'unclaimed'>('all');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<CompanySearchResult[]>([]);
  const [demoResults, setDemoResults] = useState<CompanySearchResult[]>([]);
  const [providerInfo, setProviderInfo] = useState<{
    status?: ProviderStatus;
    code?: string;
    message?: string;
  }>({});

  const { t } = useLanguage();

  const performSearch = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || trimmed.length < 2) {
      setResults([]);
      setDemoResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/companies/search?q=${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      setProviderInfo({
        status: data.status,
        code: data.code,
        message: data.message,
      });
      setResults(Array.isArray(data.results) ? data.results : []);
      setDemoResults(Array.isArray(data.demoResults) ? data.demoResults : []);

      // A provider failure is surfaced as an error, never as an empty result set.
      if (data.status && data.status !== 'ok' && data.status !== 'not_configured') {
        setError(data.message || 'The company registry provider could not be reached.');
        setResults([]);
        setDemoResults([]);
      } else if (!res.ok && data.error) {
        setError(data.error);
        setResults([]);
        setDemoResults([]);
      }
    } catch {
      setError('Unable to search companies right now. Please try again.');
      setResults([]);
      setDemoResults([]);
    } finally {
      setLoading(false);
    }
  };

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

  const matchesFilter = (item: CompanySearchResult) => {
    if (statusFilter === 'claimed') return item.profileStatus === 'claimed';
    if (statusFilter === 'unclaimed') return item.profileStatus === 'unclaimed';
    return true;
  };

  const filteredResults = results.filter(matchesFilter);
  const filteredDemoResults = demoResults.filter(matchesFilter);

  const renderCard = (item: CompanySearchResult, isDemo: boolean) => {
    const hasScore = typeof item.reputationScore === 'number';
    const isClaimed = item.profileStatus === 'claimed';
    // The jurisdiction code is what the registry actually reports. A country
    // name is only shown when the source explicitly provided one.
    const place = item.country || item.jurisdictionCode;

    return (
      <div
        key={item.id}
        className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-indigo-500/40 transition-all shadow-lg hover:shadow-indigo-500/5 group"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
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
                {isDemo ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-400/40">
                    <AlertCircle className="w-3 h-3 text-amber-400" />
                    Demo Record
                  </span>
                ) : isClaimed ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    <CheckCircle2 className="w-3 h-3 text-indigo-400" />
                    Claimed Profile
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                    Unclaimed
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 mb-1.5">
                {item.businessType || item.industry || 'Entity type not reported'}
                {item.registrationNumber ? <> &bull; Reg: {item.registrationNumber}</> : null}
                {place ? <> &bull; {place}</> : null}
              </p>

              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                <span>Source:</span>
                <span className="text-indigo-400/90">{item.source?.provider}</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">
                  {isDemo
                    ? 'Development demo record — not registry data'
                    : `Public registry record · Not verified by FRL`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-white/10 shrink-0 gap-3">
            <div className="text-left sm:text-right">
              <span className="text-[11px] text-slate-400 block font-semibold">
                Business Reputation
              </span>
              {/* STRICT PRODUCT RULE: a registry identity record never carries a score,
                  and demo records never show a number that could read as a real one. */}
              {isDemo ? (
                <span className="text-xs font-bold text-amber-400/90 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 inline-block mt-0.5">
                  Demo data — not a real score
                </span>
              ) : hasScore ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-extrabold text-amber-400">
                    {item.reputationScore}
                  </span>
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
  };

  const notConfigured = providerInfo.status === 'not_configured';
  const showEmptyState =
    !loading && !error && filteredResults.length === 0 && filteredDemoResults.length === 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
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
            Search real corporate identities via the OpenCorporates public registry.
            A registry record is not an FRL verification.
          </p>
        </div>

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

        {notConfigured && (
          <div className="mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              {providerInfo.message ||
                'The company registry provider is not configured, so no real company records can be shown.'}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 mb-8 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 mr-1">Filter:</span>
          {(
            [
              ['all', 'All Statuses'],
              ['claimed', 'Claimed'],
              ['unclaimed', 'Unclaimed'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                statusFilter === value
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 border-white/10 hover:bg-white/5'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {loading
                ? 'Searching...'
                : `Registry Results (${filteredResults.length})`}
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center rounded-2xl bg-white/5 border border-white/10">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-200 mb-1">
                Searching companies...
              </h3>
              <p className="text-xs text-slate-400">
                Querying the public company registry.
              </p>
            </div>
          ) : error ? (
            <div className="p-12 text-center rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-rose-300 mb-1">
                Unable to complete the search
              </h3>
              <p className="text-xs text-slate-400 mb-1">{error}</p>
              {providerInfo.code && (
                <p className="text-[11px] text-slate-500 font-mono mb-4">
                  Reference: {providerInfo.code}
                </p>
              )}
              <button
                onClick={() => performSearch(query)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-500 transition-colors"
              >
                Please Try Again
              </button>
            </div>
          ) : (
            <>
              {filteredResults.map((item) => renderCard(item, false))}

              {filteredDemoResults.length > 0 && (
                <div className="pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Development Demo Records ({filteredDemoResults.length})
                    </h3>
                  </div>
                  <p className="text-[11px] text-amber-300/80 mb-4 flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
                    <span>
                      Sample data for local development. These are NOT real registry
                      records and are never presented as verified companies.
                    </span>
                  </p>
                  <div className="space-y-4">
                    {filteredDemoResults.map((item) => renderCard(item, true))}
                  </div>
                </div>
              )}

              {showEmptyState && (
                <div className="p-12 text-center rounded-2xl bg-white/5 border border-white/10">
                  <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                  <h3 className="text-base font-semibold mb-1">No Companies Found</h3>
                  <p className="text-xs text-slate-400 mb-4">
                    The registry returned no company matching &quot;
                    {activeQuery || query}&quot;. Try a different company name or
                    registration ID.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400">Loading search directory...</div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
