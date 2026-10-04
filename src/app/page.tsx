'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  ArrowRight,
  Award,
  Building2,
  CheckCircle2,
  Database,
  Eye,
  Info,
  Layers,
  Scale,
  Search as SearchIcon,
  ShieldCheck,
} from 'lucide-react';
import { MOCK_COMPANIES } from '@/lib/mockData';
import { useLanguage, LanguageToggle } from '@/lib/i18n';
import { Badge, Button, Card, Container, Section } from '@/components/ui';

/**
 * FRL landing page — UI Phase 2.
 *
 * VISUAL ONLY. Everything that behaved before still behaves the same way:
 * the search form still routes to /search, the company chips still link to
 * /company/:id, the language toggle still switches locale, and the navigation
 * still reaches the same destinations.
 *
 * Integrity rule for this file: nothing here may imply FRL holds verified
 * financial evidence for a real company. The hero visual is a conceptual
 * diagram with no numbers on it, and the product preview is explicitly
 * labelled as a development demo record.
 */

/** The four steps FRL actually performs, in order. Used by hero + process. */
const CHAIN = [
  { key: 'evidence', label: 'Evidence', note: 'Records actually held' },
  { key: 'signals', label: 'Signals', note: 'Derived from that evidence' },
  { key: 'analysis', label: 'Analysis', note: 'Interpreted, not assumed' },
  { key: 'reputation', label: 'Reputation', note: 'Reported with provenance' },
] as const;

const CAPABILITIES = [
  {
    icon: Layers,
    title: 'Reputation Intelligence',
    body: 'A structured read of how a business has behaved financially, expressed as named dimensions rather than an opaque number.',
  },
  {
    icon: Database,
    title: 'Evidence-Based Signals',
    body: 'Every signal traces back to the record it came from. Where evidence is absent, FRL reports Insufficient Data instead of estimating.',
  },
  {
    icon: Building2,
    title: 'Company Intelligence',
    body: 'Corporate identity resolved from public registry records, so a profile is anchored to a real entity before anything else is said.',
  },
  {
    icon: Eye,
    title: 'Transparent Analysis',
    body: 'Explanations travel with the result. You can see the source, the retrieval status, and what remains unknown.',
  },
];

export default function Home() {
  const { t } = useLanguage();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/search');
    }
  };

  // The preview renders the real development demo record, so the landing page
  // cannot drift from what the product actually shows.
  const preview = MOCK_COMPANIES[0];
  const previewDims = preview?.dimensions;

  return (
    <div className="min-h-screen bg-canvas text-fg font-sans antialiased selection:bg-primary-soft">
      {/* ============================= NAV ============================= */}
      <nav className="fixed top-0 w-full z-50 frl-glass-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 py-2 sm:h-16 sm:py-0 flex flex-wrap items-center justify-between gap-y-2">
          <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="FRL home">
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
              className="inline-flex h-9 items-center rounded-md px-1 text-sm font-medium text-fg-secondary transition-colors duration-[var(--frl-dur-fast)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-hover"
            >
              {t('nav.findCompany', 'Search Companies')}
            </Link>
            <Link
              href="/principles"
              className="hidden h-9 items-center rounded-md px-1 text-sm font-medium text-fg-secondary transition-colors duration-[var(--frl-dur-fast)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-hover sm:inline-flex"
            >
              {t('nav.principles', 'Principles')}
            </Link>
            <Link
              href="/company/c1"
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-indigo-600 px-3 text-xs font-semibold text-white shadow-sm transition-[background-color,transform] duration-[var(--frl-dur-fast)] ease-[var(--frl-ease-standard)] hover:bg-indigo-500 active:translate-y-px"
            >
              Workspace
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* ============================ HERO ============================ */}
        <section className="relative overflow-hidden pt-28 pb-16 sm:pt-36 sm:pb-24 lg:pt-40 lg:pb-28">
          {/* Ambient depth. Decorative only — carries no data. */}
          <div
            aria-hidden="true"
            className="frl-ambient pointer-events-none absolute left-1/2 top-0 -z-10 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-primary/10 blur-[150px]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,transparent_35%,var(--color-canvas)_78%)]"
          />

          <Container width="full">
            <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-12">
              {/* ---- Copy ---- */}
              <div className="lg:col-span-7">
                <div className="frl-enter-1 inline-flex items-center gap-2 rounded-pill border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                  </span>
                  <span className="text-label text-fg-secondary">Financial Reputation Intelligence</span>
                </div>

                <h1 className="frl-enter-2 mt-6 text-display text-white">
                  Understand a business
                  <br className="hidden sm:block" /> before you trust it.
                </h1>

                <p className="frl-enter-3 mt-6 max-w-xl text-body text-fg-muted sm:text-lg sm:leading-relaxed">
                  FRL turns scattered financial records into a structured reputation
                  signal — one you can inspect, question, and trace back to its source.
                  Where evidence is missing, FRL says so rather than guessing.
                </p>

                <div className="frl-enter-4 mt-9 flex flex-wrap items-center gap-3">
                  <Button
                    size="lg"
                    trailingIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
                    onClick={() => router.push('/search')}
                  >
                    Search a company
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => router.push('/principles')}>
                    How FRL works
                  </Button>
                </div>
              </div>

              {/* ---- Conceptual intelligence visual ---- */}
              <div className="frl-enter-5 lg:col-span-5">
                <div className="frl-glass relative overflow-hidden rounded-lg p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-label text-fg-subtle">Signal composition</p>
                      <p className="mt-1.5 text-h4 text-white">Evidence to reputation</p>
                    </div>
                    <Badge tone="demo" size="sm">
                      Conceptual
                    </Badge>
                  </div>

                  {/* Node chain — no values, because there are none to show. */}
                  <ol className="mt-7 space-y-0">
                    {CHAIN.map((step, i) => {
                      const last = i === CHAIN.length - 1;
                      return (
                        <li key={step.key} className="relative flex gap-4 pb-5 last:pb-0">
                          {!last && (
                            <span
                              aria-hidden="true"
                              className="absolute left-[7px] top-5 h-full w-px bg-gradient-to-b from-white/20 to-white/[0.04]"
                            />
                          )}
                          <span
                            aria-hidden="true"
                            className="relative mt-1 h-3.5 w-3.5 shrink-0 rounded-full border border-primary/40 bg-canvas"
                          >
                            <span className="absolute inset-[3px] rounded-full bg-primary-hover" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-body-sm font-semibold text-slate-100">{step.label}</p>
                            <p className="mt-0.5 text-caption text-fg-subtle">{step.note}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>

                  <p className="mt-6 border-t border-white/[0.07] pt-4 text-caption leading-relaxed text-fg-subtle">
                    Structure illustration. FRL reports{' '}
                    <span className="text-fg-muted">Insufficient Data</span> rather than a
                    score when no supporting evidence exists.
                  </p>
                </div>
              </div>
            </div>

            {/* ---- Search ---- */}
            <div className="frl-enter-6 mt-14 lg:mt-16">
              <form onSubmit={handleSearchSubmit} className="mx-auto max-w-3xl">
                <label htmlFor="frl-company-search" className="sr-only">
                  Search company by name or registration ID
                </label>
                <div className="relative">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5"
                  >
                    <SearchIcon className="h-5 w-5 text-fg-subtle" />
                  </div>
                  <input
                    id="frl-company-search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search company by name or registration ID (e.g. Toyota, TechFlow, 01055...)"
                    className="block w-full rounded-md border border-white/10 bg-white/[0.03] py-4 pl-14 pr-4 text-base text-slate-100 shadow-[var(--shadow-elevated)] transition-[border-color,background-color,box-shadow] duration-[var(--frl-dur-normal)] placeholder:text-fg-subtle hover:border-white/[0.16] focus:border-primary/60 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-primary/25 sm:py-[1.125rem] sm:pr-32"
                  />
                  <Button
                    type="submit"
                    size="md"
                    trailingIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    Search
                    <span className="sr-only"> company</span>
                  </Button>
                </div>
              </form>

              <div className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-2">
                <span className="text-caption text-fg-subtle">Popular:</span>
                {MOCK_COMPANIES.map((c) => (
                  <Link
                    key={c.id}
                    href={`/company/${c.id}`}
                    className="inline-flex items-center gap-1.5 rounded-pill border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-caption text-fg-secondary transition-[background-color,border-color,color] duration-[var(--frl-dur-fast)] hover:border-primary/35 hover:bg-white/[0.07] hover:text-slate-100"
                  >
                    <span aria-hidden="true">{c.logo || '🏢'}</span>
                    <span>{c.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* ========================= TRUST STRIP ========================= */}
        <section className="border-y border-white/[0.06] bg-white/[0.015]">
          <Container width="full">
            <div className="grid grid-cols-1 divide-y divide-white/[0.06] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
              {[
                { icon: Scale, title: 'Evidence before opinion', body: 'No conclusion without a record behind it.' },
                { icon: Database, title: 'Provenance on every record', body: 'Source and retrieval state always shown.' },
                { icon: Eye, title: 'Honest absence', body: 'Missing evidence reported, never imputed.' },
                { icon: Activity, title: 'Explainable signals', body: 'Each dimension describes what it measured.' },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex items-start gap-3.5 px-1 py-6 lg:px-6">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary-hover" aria-hidden="true" />
                  <div>
                    <p className="text-body-sm font-semibold text-slate-100">{title}</p>
                    <p className="mt-1 text-caption leading-relaxed text-fg-subtle">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* ====================== PRODUCT PREVIEW ====================== */}
        <Section>
          <Container width="full">
            <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-14">
              <div className="lg:col-span-5">
                <p className="text-label text-primary-hover">Product preview</p>
                <h2 className="mt-4 text-h2 text-white">One company, fully accounted for.</h2>
                <p className="mt-5 text-body leading-relaxed text-fg-muted">
                  A FRL profile separates what a company looks like from what can
                  actually be demonstrated about it. Identity, source, verification
                  state and reputation dimensions sit side by side — including the
                  dimensions that have nothing behind them yet.
                </p>
                <ul className="mt-7 space-y-3">
                  {[
                    'Identity resolved from a public registry record',
                    'Source and retrieval status shown per record',
                    'Dimensions that lack evidence read Insufficient Data',
                  ].map((line) => (
                    <li key={line} className="flex items-start gap-3">
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0 text-success"
                        aria-hidden="true"
                      />
                      <span className="text-body-sm text-fg-secondary">{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Interface-style preview. Illustrative demo record. */}
              <div className="lg:col-span-7">
                <div className="frl-glass overflow-hidden rounded-lg">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.07] p-5 sm:p-6">
                    <div className="flex items-start gap-3.5">
                      <span
                        aria-hidden="true"
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-lg"
                      >
                        {preview?.logo || '🏢'}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-h4 text-white">{preview?.name}</p>
                        <p className="mt-1 text-caption text-fg-subtle">
                          Reg: {preview?.registration_no ?? '—'}
                        </p>
                      </div>
                    </div>
                    <Badge tone="demo" size="sm" dot>
                      Demo record
                    </Badge>
                  </div>

                  <div className="grid gap-5 p-5 sm:grid-cols-5 sm:p-6">
                    <div className="sm:col-span-2">
                      <p className="text-label text-fg-subtle">Business reputation</p>
                      <p className="mt-2 text-2xl font-bold tabular text-white">
                        {preview?.reputationScore ?? '—'}
                        <span className="ml-1 text-sm font-medium text-fg-subtle">/ 1000</span>
                      </p>
                      <Badge tone="demo" size="sm" className="mt-2.5">
                        Demo score — not real
                      </Badge>
                      <p className="mt-3 text-caption leading-relaxed text-fg-subtle">
                        Illustrative preview of a development demo record.
                      </p>
                    </div>

                    <div className="grid gap-2.5 sm:col-span-3">
                      {[
                        { label: 'Payment Reliability', dim: previewDims?.paymentReliability },
                        { label: 'Business Reliability', dim: previewDims?.businessReliability },
                        { label: 'Financial Stability', dim: previewDims?.financialStability },
                        { label: 'Transaction History', dim: previewDims?.transactionHistory },
                      ].map(({ label, dim }) => (
                        <div
                          key={label}
                          className="flex items-center justify-between gap-3 rounded-sm border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5"
                        >
                          <span className="truncate text-caption text-fg-secondary">{label}</span>
                          {dim?.isSufficient ? (
                            <span className="shrink-0 text-caption font-semibold tabular text-success">
                              {dim.score} / 1000
                            </span>
                          ) : (
                            <Badge tone="insufficient" size="sm">
                              Insufficient Data
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </Section>

        {/* ======================== CAPABILITIES ======================== */}
        <Section className="border-t border-white/[0.06]">
          <Container width="full">
            <div className="max-w-2xl">
              <p className="text-label text-primary-hover">Capabilities</p>
              <h2 className="mt-4 text-h2 text-white">Built for reading a business carefully.</h2>
              <p className="mt-5 text-body leading-relaxed text-fg-muted">
                Four capabilities, each answering a different question about a
                counterparty — and each declining to answer when the record is not there.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {CAPABILITIES.map(({ icon: Icon, title, body }) => (
                <Card key={title} padding="lg" className="group h-full transition-colors duration-[var(--frl-dur-normal)] hover:border-white/[0.18]">
                  <span className="grid h-9 w-9 place-items-center rounded-md border border-white/[0.08] bg-white/[0.04]">
                    <Icon className="h-4 w-4 text-primary-hover" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-h4 text-white">{title}</h3>
                  <p className="mt-2.5 text-body-sm leading-relaxed text-fg-subtle">{body}</p>
                </Card>
              ))}
            </div>
          </Container>
        </Section>

        {/* ======================= EVIDENCE CHAIN ======================= */}
        <Section className="border-t border-white/[0.06] bg-white/[0.015]">
          <Container width="full">
            <div className="max-w-2xl">
              <p className="text-label text-primary-hover">Method</p>
              <h2 className="mt-4 text-h2 text-white">Evidence, in the order it is used.</h2>
              <p className="mt-5 text-body leading-relaxed text-fg-muted">
                A reputation signal is never the first step. It is the last — and it can
                only be reached if every step before it actually had something to work with.
              </p>
            </div>

            <ol className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {CHAIN.map((step, i) => (
                <li key={step.key}>
                  <Card padding="md" className="h-full">
                    <div className="flex items-center justify-between">
                      <span className="text-label tabular text-primary-hover">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <Award className="h-4 w-4 text-white/15" aria-hidden="true" />
                    </div>
                    <h3 className="mt-4 text-h4 text-white">{step.label}</h3>
                    <p className="mt-2 text-body-sm leading-relaxed text-fg-subtle">{step.note}</p>
                  </Card>
                </li>
              ))}
            </ol>

            <p className="mt-8 flex items-start gap-2.5 text-caption leading-relaxed text-fg-subtle">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>
                If step one returns nothing, FRL stops there and reports Insufficient
                Data. It does not estimate a score to fill the gap.
              </span>
            </p>
          </Container>
        </Section>

        {/* ========================== FINAL CTA ========================== */}
        <Section className="border-t border-white/[0.06]">
          <Container width="read">
            <div className="frl-glass overflow-hidden rounded-lg px-6 py-12 text-center sm:px-10 sm:py-16">
              <h2 className="text-h1 text-white">Start with a company.</h2>
              <p className="mx-auto mt-5 max-w-lg text-body leading-relaxed text-fg-muted">
                Look up a business by name or registration number and see exactly
                what FRL holds — and exactly what it does not.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <Button
                  size="lg"
                  trailingIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
                  onClick={() => router.push('/search')}
                >
                  Search companies
                </Button>
                <Button variant="outline" size="lg" onClick={() => router.push('/principles')}>
                  Read the principles
                </Button>
              </div>
            </div>
          </Container>
        </Section>
      </main>

      {/* =========================== FOOTER =========================== */}
      <footer className="border-t border-white/[0.06]">
        <Container width="full">
          <div className="flex flex-col gap-8 py-12 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-sm">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-md border border-white/10 bg-white/[0.04]">
                  <ShieldCheck className="h-4 w-4 text-primary-hover" aria-hidden="true" />
                </span>
                <span className="text-[0.9375rem] font-semibold tracking-tight text-white">FRL</span>
              </div>
              <p className="mt-4 text-caption leading-relaxed text-fg-subtle">
                Financial Reputation Layer. A registry record is not an FRL
                verification, and an absence of evidence is reported as such.
              </p>
            </div>

            <nav aria-label="Footer" className="flex flex-wrap gap-x-10 gap-y-4">
              <div>
                <p className="text-label text-fg-subtle">Product</p>
                <ul className="mt-3 space-y-2.5">
                  <li>
                    <Link href="/search" className="inline-flex min-h-6 items-center rounded-sm text-body-sm text-fg-secondary transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-hover">
                      Search companies
                    </Link>
                  </li>
                  <li>
                    <Link href="/company/c1" className="inline-flex min-h-6 items-center rounded-sm text-body-sm text-fg-secondary transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-hover">
                      My company profile
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <p className="text-label text-fg-subtle">About</p>
                <ul className="mt-3 space-y-2.5">
                  <li>
                    <Link href="/principles" className="inline-flex min-h-6 items-center rounded-sm text-body-sm text-fg-secondary transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-hover">
                      Principles
                    </Link>
                  </li>
                </ul>
              </div>
            </nav>
          </div>

          <p className="border-t border-white/[0.06] py-6 text-caption text-fg-subtle">
            Demo records shown in this preview are development sample data and are never
            presented as verified companies.
          </p>
        </Container>
      </footer>
    </div>
  );
}