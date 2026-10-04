'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  Info,
  Search as SearchIcon,
  ShieldCheck,
  X,
} from 'lucide-react';
import { CompanySearchResult } from '@/lib/types';
import { useLanguage, LanguageToggle } from '@/lib/i18n';
import { Badge, Button, Container } from '@/components/ui';

/**
 * FRL search page — UI Phase 3.
 *
 * UI ONLY. Every behaviour below is the behaviour that shipped in Phase 0/1:
 *
 *   - URL query handling via useSearchParams().get('q')
 *   - the <2 character short-circuit that clears results without fetching
 *   - the GET /api/companies/search contract and its providerInfo envelope
 *   - a provider failure surfacing as an error, never as an empty result set
 *   - status filtering on profileStatus ('claimed' / 'unclaimed')
 *   - the split between registry results and development demo records
 *
 * Integrity rules that must survive any restyling:
 *
 *   1. A record whose sourceType is 'internal_demo' is demo data. It never
 *      gets a score, a verified badge, or a claimed badge.
 *   2. A registry identity record carries no reputation score, so the card
 *      reads Insufficient Data rather than a number.
 *   3. A missing field is reported as "Not reported" — never filled with a
 *      plausible-looking substitute.
 */

type ProviderStatus =
  | 'ok'
  | 'not_configured'
  | 'provider_unavailable'
  | 'provider_error'
  | 'malformed_response';

const FILTERS = [
  ['all', 'All statuses'],
  ['claimed', 'Claimed'],
  ['unclaimed', 'Unclaimed'],
] as const;

const SOURCE_TYPE_LABEL: Record<string, string> = {
  public_registry: 'Public registry',
  filing: 'Filing',
  company_provided: 'Company provided',
  counterparty: 'Counterparty',
  internal_demo: 'Internal demo',
};

/** Replaces an absent value with an explicit statement of absence. */
function orNotReported(value?: string | null): string {
  return value && value.trim() ? value : 'Not reported';
}

/** Skeleton that mirrors the real card's geometry so nothing jumps on load. */
function ResultCardSkeleton() {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.015] p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 gap-4">
          <div className="h-12 w-12 shrink-0 animate-pulse rounded-md bg-white/[0.06]" />
          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="h-4 w-2/5 animate-pulse rounded bg-white/[0.07]" />
            <div className="h-3 w-3/5 animate-pulse rounded bg-white/[0.05]" />
            <div className="h-3 w-1/4 animate-pulse rounded bg-white/[0.04]" />
          </div>
        </div>
        <div className="shrink-0 space-y-2.5 sm:w-40">
          <div className="h-3 w-24 animate-pulse rounded bg-white/[0.05]" />
          <div className="h-9 w-full animate-pulse rounded-md bg-white/[0.05]" />
        </div>
      </div>
    </div>
  );
}

function ResultCard({ item, isDemo }: { item: CompanySearchResult; isDemo: boolean }) {
  const hasScore = typeof item.reputationScore === 'number';
  const isClaimed = item.profileStatus === 'claimed';
  // The jurisdiction code is what the registry actually reports. A country
  // name is only shown when the source explicitly provided one.
  const place = item.country || item.jurisdictionCode;
  const retrieved = item.source?.retrievedAt;

  return (
    <article className="group rounded-lg border border-white/[0.07] bg-white/[0.015] p-5 transition-[border-color,background-color] duration-[var(--frl-dur-normal)] hover:border-white/[0.16] sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        {/* ---- Identity + provenance ---- */}
        <div className="flex min-w-0 flex-1 gap-4">
          <span
            aria-hidden="true"
            className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-md border border-white/[0.08] bg-white/[0.04] text-sm font-semibold text-fg-muted"
          >
            {item.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.logoUrl} alt="" className="h-9 w-9 object-contain" />
            ) : (
              item.name.substring(0, 2).toUpperCase()
            )}
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-h4 truncate text-white">{item.name}</h3>
              {/* Demo is checked FIRST: a demo record never reaches the claimed
                  or verified branches below, whatever its other fields say. */}
              {isDemo ? (
                <Badge tone="demo" size="sm" dot>
                  Demo record
                </Badge>
              ) : isClaimed ? (
                <Badge tone="primary" size="sm" dot>
                  Claimed profile
                </Badge>
              ) : (
                <Badge tone="neutral" size="sm">
                  Unclaimed
                </Badge>
              )}
            </div>

            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption text-fg-subtle">
              <span>{orNotReported(item.businessType || item.industry)}</span>
              {item.registrationNumber ? (
                <>
                  <span aria-hidden="true" className="text-white/15">
                    /
                  </span>
                  <span className="tabular">Reg: {item.registrationNumber}</span>
                </>
              ) : null}
              {place ? (
                <>
                  <span aria-hidden="true" className="text-white/15">
                    /
                  </span>
                  <span>{place}</span>
                </>
              ) : null}
            </p>

            {/* Provenance. Every value is the real field; absence is stated. */}
            <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[0.6875rem]">
              <div className="flex gap-1.5">
                <dt className="text-fg-subtle">Source</dt>
                <dd className="truncate text-fg-muted">{orNotReported(item.source?.provider)}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="text-fg-subtle">Type</dt>
                <dd className="text-fg-muted">
                  {SOURCE_TYPE_LABEL[item.source?.sourceType] ||
                    orNotReported(item.source?.sourceType)}
                </dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="text-fg-subtle">Verification</dt>
                <dd
                  className={
                    !isDemo && item.source?.verificationStatus === 'verified'
                      ? 'text-success'
                      : 'text-fg-muted'
                  }
                >
                  {isDemo
                    ? 'Not verified by FRL'
                    : item.source?.verificationStatus === 'verified'
                      ? 'Verified by FRL'
                      : item.source?.verificationStatus === 'expired'
                        ? 'Verification expired'
                        : 'Not verified by FRL'}
                </dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="text-fg-subtle">Retrieved</dt>
                <dd className="text-fg-muted">
                  {retrieved ? new Date(retrieved).toLocaleDateString() : 'Not reported'}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* ---- Reputation state + action ----
            Stacks on small screens on purpose: the demo label is the widest
            element on the card and must never be truncated or pushed off the
            edge to save a row. */}
        <div className="flex shrink-0 flex-col items-start gap-3 border-t border-white/[0.06] pt-4 sm:w-44 sm:items-end sm:border-t-0 sm:pt-0">
          <div className="sm:text-right">
            <p className="text-label text-fg-subtle">Reputation</p>
            {/* STRICT PRODUCT RULE: a registry identity record never carries a
                score, and a demo record never shows a number that could read
                as a real one. The label always outranks the numeral. */}
            {isDemo ? (
              <Badge tone="demo" size="sm" className="mt-2">
                Demo data — not a real score
              </Badge>
            ) : hasScore ? (
              <p className="mt-1 text-2xl font-bold tabular text-white">
                {item.reputationScore}
                <span className="ml-1 text-xs font-medium text-fg-subtle">/ 1000</span>
              </p>
            ) : (
              <Badge tone="insufficient" size="sm" className="mt-2">
                Insufficient data
              </Badge>
            )}
          </div>

          <Link
            href={`/company/${item.id}`}
            className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-md border border-primary/35 bg-primary-soft px-4 text-xs font-semibold text-indigo-200 transition-[background-color,border-color,transform] duration-[var(--frl-dur-fast)] ease-[var(--frl-ease-standard)] hover:border-primary/60 hover:bg-indigo-500/15 active:translate-y-px sm:w-auto"
          >
            View profile
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

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

  const notConfigured = providerInfo.status === 'not_configured';
  const showEmptyState =
    !loading && !error && filteredResults.length === 0 && filteredDemoResults.length === 0;
  const hasQuery = Boolean(activeQuery.trim());

  return (
    <div className="min-h-screen bg-canvas text-fg font-sans antialiased selection:bg-primary-soft">
      {/* ============================== NAV ============================== */}
      <nav className="fixed top-0 z-50 w-full frl-glass-nav">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-y-2 px-4 py-2 sm:h-16 sm:px-6 sm:py-0 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="FRL home">
            <span className="grid h-8 w-8 place-items-center rounded-md border border-white/10 bg-white/[0.04]">
              <ShieldCheck className="h-4 w-4 text-primary-hover" aria-hidden="true" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-[0.9375rem] font-semibold tracking-tight text-white">FRL</span>
              <span className="mt-0.5 hidden text-[0.5625rem] uppercase tracking-[0.14em] text-fg-subtle sm:block">
                Reputation Layer
              </span>
            </span>
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2 sm:gap-x-7">
            <LanguageToggle />
            <Link
              href="/search"
              className="text-sm font-medium text-fg-secondary transition-colors duration-[var(--frl-dur-fast)] hover:text-white"
            >
              {t('nav.findCompany', 'Search Companies')}
            </Link>
            <Link
              href="/principles"
              className="hidden text-sm font-medium text-fg-secondary transition-colors duration-[var(--frl-dur-fast)] hover:text-white sm:inline"
            >
              {t('nav.principles', 'Principles')}
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-28 sm:pt-32">
        <Container width="wide">
          {/* ============================ HEADER ============================ */}
          <div className="max-w-2xl">
            <p className="text-label text-primary-hover">Business intelligence</p>
            <h1 className="mt-4 text-h1 text-white">Find a business</h1>
            <p className="mt-5 text-body leading-relaxed text-fg-muted">
              Search business records and inspect the evidence available to FRL.
              A registry record identifies a company; it is not itself a verification,
              and not every record carries financial evidence.
            </p>
          </div>

          {/* ======================= SEARCH COMMAND ======================= */}
          <form onSubmit={handleSearchSubmit} className="mt-10">
            <div className="frl-glass rounded-lg p-2 sm:flex sm:items-center sm:gap-2">
              <div className="relative flex-1">
                <label htmlFor="frl-search-input" className="sr-only">
                  Search company by name or registration number
                </label>
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4"
                >
                  <SearchIcon className="h-[1.125rem] w-[1.125rem] text-fg-subtle" />
                </div>
                <input
                  id="frl-search-input"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Company name, registration ID, or jurisdiction…"
                  className="block h-12 w-full rounded-md border border-transparent bg-transparent pl-11 pr-10 text-sm text-slate-100 placeholder:text-fg-subtle focus:outline-none sm:h-11"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label="Clear search"
                    className="absolute inset-y-0 right-2 grid w-8 place-items-center rounded-sm text-fg-subtle transition-colors duration-[var(--frl-dur-fast)] hover:text-white"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                ) : null}
              </div>

              <div className="mt-2 flex items-center gap-2 sm:mt-0">
                <Button
                  type="submit"
                  size="md"
                  loading={loading}
                  className="w-full sm:w-auto"
                  icon={!loading ? <SearchIcon className="h-4 w-4" aria-hidden="true" /> : undefined}
                >
                  Search
                </Button>
                <kbd
                  aria-hidden="true"
                  className="hidden shrink-0 select-none rounded-sm border border-white/10 px-1.5 py-0.5 font-mono text-[0.625rem] text-fg-subtle lg:block"
                >
                  Enter
                </kbd>
              </div>
            </div>
            <p className="mt-2.5 px-1 text-caption text-fg-subtle">
              Two characters or more. FRL queries the public corporate registry.
            </p>
          </form>

          {/* ======================= PROVIDER NOTICE ======================= */}
          {notConfigured && (
            <div className="mt-8 flex items-start gap-3 rounded-md border border-warning-line bg-warning-soft p-4">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
              <div>
                <p className="text-body-sm font-semibold text-amber-200">
                  Registry provider not configured
                </p>
                <p className="mt-1 text-body-sm leading-relaxed text-amber-300/85">
                  {providerInfo.message ||
                    'The company registry provider is not configured, so no real company records can be shown.'}
                </p>
              </div>
            </div>
          )}

          {/* ===================== QUERY CONTEXT + FILTERS ===================== */}
          {hasQuery && !loading ? (
            <div className="mt-10 flex flex-col gap-4 border-b border-white/[0.06] pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-label text-fg-subtle">Search results</p>
                <p className="mt-1.5 truncate text-h3 text-white">
                  Results for <span className="text-primary-hover">“{activeQuery}”</span>
                </p>
              </div>

              <div
                role="group"
                aria-label="Filter results by profile status"
                className="flex shrink-0 gap-1 self-start rounded-md border border-white/[0.08] bg-white/[0.02] p-1 sm:self-auto"
              >
                {FILTERS.map(([value, label]) => {
                  const active = statusFilter === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setStatusFilter(value)}
                      className={[
                        'h-9 rounded-sm px-3.5 text-xs font-semibold transition-[background-color,color,border-color] duration-[var(--frl-dur-fast)]',
                        active
                          ? 'bg-white/[0.08] text-white shadow-[var(--shadow-surface)]'
                          : 'text-fg-subtle hover:bg-white/[0.04] hover:text-fg-secondary',
                      ].join(' ')}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* ============================ RESULTS ============================ */}
          <section className="mt-8 pb-24" aria-label="Search results">
            {loading ? (
              <div className="space-y-3">
                <ResultCardSkeleton />
                <ResultCardSkeleton />
                <ResultCardSkeleton />
              </div>
            ) : error ? (
              /* Provider / transport failure. Deliberately distinct from both
                 "no results" and "company not found". */
              <div className="rounded-lg border border-danger-line bg-danger-soft p-8 text-center">
                <AlertCircle className="mx-auto h-7 w-7 text-danger" aria-hidden="true" />
                <h2 className="mt-4 text-h4 text-rose-200">Unable to complete the search</h2>
                <p className="mx-auto mt-2 max-w-md text-body-sm leading-relaxed text-fg-secondary">
                  {error}
                </p>
                {providerInfo.code && (
                  <p className="mt-2 font-mono text-caption text-fg-subtle">
                    Reference: {providerInfo.code}
                  </p>
                )}
                <div className="mt-6 flex justify-center">
                  <Button variant="outline" size="md" onClick={() => performSearch(query)}>
                    Try again
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {filteredResults.length > 0 && (
                  <div>
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <h2 className="text-label text-fg-subtle">Registry results</h2>
                      <span className="text-caption tabular text-fg-subtle">
                        {filteredResults.length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {filteredResults.map((item) => (
                        <ResultCard key={item.id} item={item} isDemo={false} />
                      ))}
                    </div>
                  </div>
                )}

                {filteredDemoResults.length > 0 && (
                  <div className="mt-12">
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <h2 className="text-label text-fg-subtle">Development demo records</h2>
                      <span className="text-caption tabular text-fg-subtle">
                        {filteredDemoResults.length}
                      </span>
                    </div>
                    <p className="mb-4 flex items-start gap-2 text-body-sm leading-relaxed text-amber-300/85">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>
                        Sample data for local development. These are NOT real registry
                        records and are never presented as verified companies.
                      </span>
                    </p>
                    <div className="space-y-3">
                      {filteredDemoResults.map((item) => (
                        <ResultCard key={item.id} item={item} isDemo />
                      ))}
                    </div>
                  </div>
                )}

                {showEmptyState && (
                  /* Zero matches. Calm and intentional, with a real next step. */
                  <div className="rounded-lg border border-white/[0.07] bg-white/[0.015] px-6 py-16 text-center">
                    <span className="mx-auto grid h-11 w-11 place-items-center rounded-md border border-white/[0.08] bg-white/[0.04]">
                      <SearchIcon className="h-5 w-5 text-fg-subtle" aria-hidden="true" />
                    </span>
                    <h2 className="mt-5 text-h4 text-white">No matching businesses</h2>
                    <p className="mx-auto mt-2 max-w-sm text-body-sm leading-relaxed text-fg-subtle">
                      {hasQuery
                        ? `FRL could not find a matching record for “${activeQuery}”.`
                        : 'Enter a company name or registration identifier to search the registry.'}
                    </p>
                    <p className="mx-auto mt-4 max-w-sm text-body-sm text-fg-muted">
                      Try another business name or identifier.
                    </p>
                  </div>
                )}
              </>
            )}
          </section>
        </Container>
      </main>

      {/* ============================= FOOTER ============================= */}
      <footer className="border-t border-white/[0.06]">
        <Container width="wide">
          <p className="flex items-start gap-2.5 py-7 text-caption leading-relaxed text-fg-subtle">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>
              Registry retrieval is not FRL verification. Records listed as demo data are
              development samples and are never presented as verified companies.
            </span>
          </p>
        </Container>
      </footer>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-canvas">
          <Container width="wide">
            <p className="pt-40 text-body-sm text-fg-subtle">Loading search directory…</p>
          </Container>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}