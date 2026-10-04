'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  FileText,
  Globe,
  HelpCircle,
  Info,
  Lock,
  PieChart,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Company, DimensionDetail } from '@/lib/types';
import { ReputationEngineView } from './ReputationEngineView';
import { Badge, Button, Card, Container } from '@/components/ui';

/**
 * FRL company profile — UI Phase 4.
 *
 * PRESENTATION ONLY. Every state decision below is the decision the page made
 * before this phase:
 *
 *   - hasScore      : company.reputationScore is neither null nor undefined
 *   - isDemoCompany : company.sourceInfo?.sourceType === 'internal_demo'
 *   - verification  : derived from the record's own verificationStatus
 *   - each dimension: rendered only when isSufficient AND a score exists
 *
 * None of those rules are re-derived here. The UI never computes a score, a
 * bar width, a percentage, or a trend. Where a value is absent the page says
 * so, and where a record is demo data the page says that first.
 */

interface Props {
  company: Company;
}

/** Explicit absence. Never a fabricated fallback value. */
function orNotReported(value?: string | null): string {
  return value && value.trim() ? value : 'Not reported';
}

/**
 * The four reputation dimensions, in the order the page has always shown
 * them, with their existing accent and their existing insufficient message.
 * Values are read, never computed.
 */
const DIMENSIONS = [
  {
    key: 'paymentReliability' as const,
    label: 'Payment Reliability',
    accent: 'emerald',
    bar: 'bg-emerald-500',
    value: 'text-emerald-400',
    tone: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
    insufficientNote: 'Not enough verified payment records.',
  },
  {
    key: 'businessReliability' as const,
    label: 'Business Reliability',
    accent: 'indigo',
    bar: 'bg-indigo-500',
    value: 'text-indigo-300',
    tone: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-300',
    insufficientNote: 'Not enough verified business attestation data.',
  },
  {
    key: 'financialStability' as const,
    label: 'Financial Stability',
    accent: 'cyan',
    bar: 'bg-cyan-400',
    value: 'text-cyan-300',
    tone: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-300',
    insufficientNote: 'Financial stability metrics unavailable.',
  },
  {
    key: 'transactionHistory' as const,
    label: 'Transaction History',
    accent: 'amber',
    bar: 'bg-amber-400',
    value: 'text-amber-300',
    tone: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
    insufficientNote: 'Transaction history data not submitted.',
  },
];

function Section({
  eyebrow,
  icon,
  title,
  children,
}: {
  eyebrow: string;
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-white/[0.07] bg-white/[0.015]">
      <div className="border-b border-white/[0.06] px-5 py-4 sm:px-6 sm:py-5">
        <p className="flex items-center gap-2 text-label text-primary-hover">
          <span aria-hidden="true">{icon}</span>
          {eyebrow}
        </p>
        <h2 className="mt-2 text-h3 text-white">{title}</h2>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function DimensionCard({ detail, spec }: { detail?: DimensionDetail; spec: (typeof DIMENSIONS)[number] }) {
  // The original gate: a dimension shows a number only when it is BOTH
  // sufficient AND carries a score. Otherwise it is insufficient — never zero.
  // Narrowed into a number|null so the score arithmetic below is type-safe
  // without changing the condition itself.
  const scoreValue = detail?.isSufficient && detail.score ? detail.score : null;

  return (
    <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-body-sm font-semibold text-slate-100">{spec.label}</span>
        {scoreValue !== null ? (
          <div className="flex items-center gap-2">
            <span className={`text-caption font-bold tabular ${spec.value}`}>
              {scoreValue} / 1000
            </span>
            <span
              className={`inline-block rounded-pill border px-2 py-0.5 text-[0.6875rem] font-semibold ${spec.tone}`}
            >
              {detail?.label}
            </span>
          </div>
        ) : (
          <Badge tone="insufficient" size="sm">
            Insufficient data
          </Badge>
        )}
      </div>

      {scoreValue !== null ? (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-pill bg-white/[0.06]">
          <div
            className={`h-full rounded-pill transition-[width] duration-[var(--frl-dur-slow)] ease-[var(--frl-ease-standard)] ${spec.bar}`}
            style={{ width: `${(scoreValue / 1000) * 100}%` }}
          />
        </div>
      ) : (
        <p className="mt-2 text-caption leading-relaxed text-fg-subtle">{spec.insufficientNote}</p>
      )}
    </div>
  );
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
    <div className="min-h-screen bg-canvas pb-24 font-sans text-fg antialiased selection:bg-primary-soft">
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
                Directory
              </span>
            </span>
          </Link>

          <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
            <Link
              href="/search"
              className="text-xs font-semibold text-fg-secondary transition-colors duration-[var(--frl-dur-fast)] hover:text-white"
            >
              Search Companies
            </Link>

            {/* Mode Switcher Toggle */}
            <div
              role="group"
              aria-label="Profile view"
              className="flex shrink-0 items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.03] p-1"
            >
              <button
                type="button"
                aria-pressed={viewMode === 'profile'}
                onClick={() => setViewMode('profile')}
                className={`h-11 rounded-sm px-3 text-xs font-semibold transition-[background-color,color] duration-[var(--frl-dur-fast)] sm:h-9 ${
                  viewMode === 'profile'
                    ? 'bg-white/[0.08] text-white'
                    : 'text-fg-subtle hover:bg-white/[0.04] hover:text-fg-secondary'
                }`}
              >
                Company Profile
              </button>
              <button
                type="button"
                aria-pressed={viewMode === 'workspace'}
                onClick={() => setViewMode('workspace')}
                className={`h-11 rounded-sm px-3 text-xs font-semibold transition-[background-color,color] duration-[var(--frl-dur-fast)] sm:h-9 ${
                  viewMode === 'workspace'
                    ? 'bg-white/[0.08] text-white'
                    : 'text-fg-subtle hover:bg-white/[0.04] hover:text-fg-secondary'
                }`}
              >
                Owner Workspace
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Top padding clears the fixed nav. At <640px the nav wraps to two rows
          and is ~135px tall, so the mobile offset is larger than the desktop one. */}
      <main className="pt-36 sm:pt-32">
        <Container width="wide">
          {/* ========================== BREADCRUMB ========================== */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-caption text-fg-subtle">
            <Link href="/" className="transition-colors hover:text-fg-secondary">
              Directory
            </Link>
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
            <Link href="/search" className="transition-colors hover:text-fg-secondary">
              Search
            </Link>
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
            <span aria-current="page" className="truncate text-fg-secondary">
              {company.name}
            </span>
          </nav>

          {/* =========================== DEMO BANNER =========================== */}
          {isDemoCompany && (
            <div className="mt-6 flex items-start gap-3 rounded-md border border-demo-line bg-demo-soft p-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-demo" aria-hidden="true" />
              <div className="text-body-sm leading-relaxed text-amber-200/90">
                <strong className="mb-1 block text-label text-amber-300">
                  Demo data — not a real company
                </strong>
                This record is development sample data. It is not a verified company, the score
                shown below is not a real reputation, and FRL has verified nothing about it.
              </div>
            </div>
          )}

          {viewMode === 'workspace' ? (
            /* UI Phase 5: the workspace owns its own identity header, so the
               wrapper no longer repeats the company name and summary. `company`
               and the profile switch are passed in as context only — every
               number the workspace shows still comes from the engine. */
            <div className="mt-6">
              <ReputationEngineView
                company={company}
                onViewPublicProfile={() => setViewMode('profile')}
              />
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {/* ========================= IDENTITY HERO ========================= */}
              <Card tone="glass" padding="none">
                <div className="flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 items-start gap-4 sm:gap-5">
                    <span
                      aria-hidden="true"
                      className="grid h-16 w-16 shrink-0 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-3xl sm:h-20 sm:w-20 sm:text-4xl"
                    >
                      {company.logo || '🏢'}
                    </span>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h1 className="text-h1 break-words text-white">{company.name}</h1>
                        {isDemoCompany ? (
                          <Badge tone="demo" size="sm" dot>
                            Demo record
                          </Badge>
                        ) : company.isClaimed ? (
                          <Badge tone="primary" size="sm" dot>
                            Claimed profile
                          </Badge>
                        ) : (
                          <Badge tone="neutral" size="sm">
                            Public profile (unclaimed)
                          </Badge>
                        )}
                      </div>

                      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption text-fg-subtle">
                        <span className="tabular">
                          Reg: {orNotReported(company.registration_no)}
                        </span>
                        <span aria-hidden="true" className="text-white/15">
                          /
                        </span>
                        <span>{orNotReported(company.industry)}</span>
                        <span aria-hidden="true" className="text-white/15">
                          /
                        </span>
                        <span>{company.country ?? 'Country not reported'}</span>
                        <span aria-hidden="true" className="text-white/15">
                          /
                        </span>
                        <span>Founded {orNotReported(company.founded_date)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <Button
                      variant="secondary"
                      size="md"
                      icon={<Lock className="h-3.5 w-3.5" aria-hidden="true" />}
                      onClick={() => setViewMode('workspace')}
                    >
                      Manage Profile Data
                    </Button>
                  </div>
                </div>

                {/* Provenance strip. Real fields only; absence is stated. */}
                <dl className="grid grid-cols-1 gap-px border-t border-white/[0.07] bg-white/[0.03] sm:grid-cols-3">
                  {[
                    {
                      icon: <Globe className="h-3.5 w-3.5" aria-hidden="true" />,
                      label: 'Source',
                      value: orNotReported(company.sourceInfo?.provider),
                    },
                    {
                      icon: <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />,
                      label: 'Verification',
                      value: verificationLabel,
                    },
                    {
                      icon: <Calendar className="h-3.5 w-3.5" aria-hidden="true" />,
                      label: 'Retrieved',
                      value: company.sourceInfo?.retrievedAt
                        ? new Date(company.sourceInfo.retrievedAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Not reported',
                    },
                  ].map((f) => (
                    <div key={f.label} className="flex items-center gap-2.5 bg-canvas px-5 py-3.5">
                      <span className="text-primary-hover">{f.icon}</span>
                      <dt className="text-caption text-fg-subtle">{f.label}</dt>
                      <dd className="ml-auto truncate text-caption font-semibold text-fg-secondary">
                        {f.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Card>

              {/* ============ SECTION 1: BUSINESS REPUTATION (HERO) ============ */}
              <Section eyebrow="1. Business reputation" icon={<Award className="h-3.5 w-3.5" />} title="Reputation Signal">
                <div className="flex flex-col gap-7 border-b border-white/[0.06] pb-7 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-xl">
                    <p className="text-body leading-relaxed text-fg-muted">
                      Composite business reputation generated from verified payment reliability,
                      historical transactions, and financial stability indicators available to
                      FRL.
                    </p>

                    {/* State B: Insufficient Data is a legitimate data state, not an
                        error. Applies to any company record that carries no score. */}
                    {!hasScore && (
                      <p className="mt-4 text-body-sm leading-relaxed text-amber-200/85">
                        <strong className="font-semibold text-amber-200">Insufficient Data.</strong>{' '}
                        FRL does not have enough verified financial evidence to calculate a
                        reputation score for this company. This is a normal data state, not an
                        error.
                      </p>
                    )}
                  </div>

                  {/* Score panel. A number renders only when one genuinely exists. */}
                  <div className="shrink-0 rounded-lg border border-white/[0.08] bg-black/25 p-5 sm:min-w-[15rem] sm:p-6">
                    <span className="block text-label text-fg-subtle">
                      {isDemoCompany ? 'Demo Reputation Score (not real)' : 'Reputation Score'}
                    </span>

                    {hasScore ? (
                      <div className="frl-enter-1 mt-2">
                        <p className="flex items-baseline gap-2">
                          <span className="text-metric tabular text-amber-400">
                            {company.reputationScore}
                          </span>
                          <span className="text-body-sm font-semibold text-fg-subtle">/ 1000</span>
                        </p>
                        {isDemoCompany ? (
                          <Badge tone="demo" size="sm" className="mt-3">
                            Demo data — not a real score
                          </Badge>
                        ) : (
                          <Badge tone="success" size="sm" className="mt-3">
                            {company.reputationLevel ?? 'Insufficient Data'}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2">
                        {/* No meter, no ring, no invented trend. Just the state. */}
                        <p className="text-2xl font-bold tabular text-fg-subtle">— / 1000</p>
                        <Badge tone="insufficient" size="sm" className="mt-3">
                          Insufficient Data
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4 Core Dimensions */}
                <div className="mt-7">
                  <h3 className="text-label text-fg-subtle">Reputation dimensions</h3>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {DIMENSIONS.map((spec) => (
                      <DimensionCard key={spec.key} spec={spec} detail={dims?.[spec.key]} />
                    ))}
                  </div>
                </div>
              </Section>

              {/* ============ SECTION 2: SCORE EXPLANATION ============ */}
              <Section
                eyebrow="2. Score explanation"
                icon={<HelpCircle className="h-3.5 w-3.5" />}
                title="Why does this company have this score?"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {DIMENSIONS.map((spec) => (
                    <div
                      key={spec.key}
                      className="rounded-md border border-white/[0.06] bg-white/[0.02] p-4"
                    >
                      <h4 className="text-label text-fg-muted">{spec.label}</h4>
                      <p className="mt-2 text-body-sm leading-relaxed text-fg-subtle">
                        {dims?.[spec.key]?.explanation ?? 'Insufficient Data'}
                      </p>
                    </div>
                  ))}
                </div>
              </Section>

              {/* ============ SECTION 3: COMPANY INFORMATION ============ */}
              <Section
                eyebrow="3. Company information"
                icon={<Building2 className="h-3.5 w-3.5" />}
                title="Corporate Details"
              >
                <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {[
                    { label: 'Company Name', value: company.name },
                    { label: 'Business Type', value: orNotReported(company.industry) },
                    { label: 'Country', value: company.country ?? 'Country not reported' },
                    { label: 'Founded Year', value: orNotReported(company.founded_date) },
                  ].map((f) => (
                    <div
                      key={f.label}
                      className="rounded-md border border-white/[0.06] bg-white/[0.02] p-4"
                    >
                      <dt className="text-label text-fg-subtle">{f.label}</dt>
                      <dd className="mt-1.5 break-words text-body-sm font-semibold text-slate-100">
                        {f.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Section>

              {/* ============ SECTION 4: COMPANY OVERVIEW ============ */}
              <Section
                eyebrow="4. Company overview"
                icon={<FileText className="h-3.5 w-3.5" />}
                title={`About ${company.name}`}
              >
                <p className="max-w-3xl text-body leading-relaxed text-fg-secondary">
                  {company.overview ?? 'Company overview not available.'}
                </p>
              </Section>

              {/* ============ SECTION 5: QUICK SUMMARY ============ */}
              <Section
                eyebrow="5. Quick summary"
                icon={<PieChart className="h-3.5 w-3.5" />}
                title="Key Signals & Data Status"
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-md border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
                    <h3 className="text-body-sm font-semibold text-emerald-400">Strengths</h3>
                    <ul className="mt-3 space-y-2 text-body-sm text-fg-secondary">
                      {company.quickSummary?.strengths.map((st, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span aria-hidden="true" className="text-emerald-400">
                            &bull;
                          </span>
                          <span>{st}</span>
                        </li>
                      )) || <li className="text-fg-subtle">No specific strengths recorded.</li>}
                    </ul>
                  </div>

                  <div className="rounded-md border border-amber-500/20 bg-amber-500/[0.06] p-4">
                    <h3 className="text-body-sm font-semibold text-amber-400">Things to Consider</h3>
                    <ul className="mt-3 space-y-2 text-body-sm text-fg-secondary">
                      {company.quickSummary?.thingsToConsider.map((tc, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span aria-hidden="true" className="text-amber-400">
                            &bull;
                          </span>
                          <span>{tc}</span>
                        </li>
                      )) || <li className="text-fg-subtle">No specific warnings recorded.</li>}
                    </ul>
                  </div>

                  <div className="rounded-md border border-indigo-500/20 bg-indigo-500/[0.06] p-4">
                    <h3 className="text-body-sm font-semibold text-indigo-300">Data Status</h3>
                    <p className="mt-3 text-body-sm font-semibold text-slate-100">
                      {company.quickSummary?.dataStatus ?? 'Data status not reported'}
                    </p>
                    <p className="mt-2 text-caption leading-relaxed text-fg-subtle">
                      {verificationLabel}
                      {company.sourceInfo?.provider
                        ? ` Source: ${company.sourceInfo.provider}.`
                        : ' No source recorded for this record.'}
                    </p>
                  </div>
                </div>
              </Section>

              {/* ============ SECTION 6: BUSINESS TRACK RECORD ============ */}
              <Section
                eyebrow="6. Business track record"
                icon={<Award className="h-3.5 w-3.5" />}
                title="Achievements, Partnerships & Performance"
              >
                <div className="space-y-7">
                  <div>
                    <h3 className="text-label text-fg-subtle">Achievements & Projects</h3>
                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                      {company.trackRecord?.achievements.map((ach, i) => (
                        <div
                          key={i}
                          className="rounded-md border border-white/[0.06] bg-white/[0.02] p-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="text-body-sm font-semibold text-slate-100">{ach.title}</h4>
                            <Badge tone="primary" size="sm">
                              {ach.source}
                            </Badge>
                          </div>
                          <p className="mt-2 text-body-sm leading-relaxed text-fg-subtle">
                            {ach.description}
                          </p>
                        </div>
                      )) || (
                        <p className="text-body-sm text-fg-subtle">No public achievements listed.</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-label text-fg-subtle">Business Relationships</h3>
                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                      {company.trackRecord?.relationships.map((rel, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-3 rounded-md border border-white/[0.06] bg-white/[0.02] p-4"
                        >
                          <div className="min-w-0">
                            <h4 className="truncate text-body-sm font-semibold text-slate-100">
                              {rel.partner}
                            </h4>
                            <p className="mt-0.5 text-caption text-fg-subtle">
                              {rel.relationshipType}
                            </p>
                          </div>
                          <Badge tone="success" size="sm" className="shrink-0">
                            {rel.source}
                          </Badge>
                        </div>
                      )) || (
                        <p className="text-body-sm text-fg-subtle">
                          No public relationship records listed.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Section>

              {/* ============ SECTION 7: REPUTATION HISTORY ============ */}
              <Section
                eyebrow="7. Reputation history"
                icon={<Calendar className="h-3.5 w-3.5" />}
                title="Historical Events & Milestones"
              >
                <div className="relative space-y-6 border-l border-white/[0.1] pl-6">
                  {company.reputationHistory?.map((ev, i) => (
                    <div key={i} className="group relative">
                      <span
                        aria-hidden="true"
                        className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-primary/60 bg-canvas transition-colors duration-[var(--frl-dur-fast)] group-hover:border-primary-hover"
                      />
                      <span className="text-caption font-bold tabular text-primary-hover">
                        {ev.year}
                      </span>
                      <h4 className="mt-0.5 text-body-sm font-semibold text-slate-100">{ev.event}</h4>
                      <span className="text-caption text-fg-subtle">{ev.source}</span>
                    </div>
                  )) || <p className="text-body-sm text-fg-subtle">No historical events recorded.</p>}
                </div>
              </Section>

              {/* ============ SECTION 8: DATA & TRENDS ============ */}
              <Section
                eyebrow="8. Data & trends"
                icon={<TrendingUp className="h-3.5 w-3.5" />}
                title="Reputation Trend Analytics"
              >
                {company.scoreHistory && company.scoreHistory.length > 0 ? (
                  <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
                    <h3 className="text-label text-fg-subtle">Score trend over time (0 – 1000)</h3>
                    {/* Bar heights come from the record's own scoreHistory. Nothing
                        here invents, interpolates, or animates a value.

                        The bar sits inside a fixed-height track on purpose: a
                        percentage inside a flex column that also holds labels
                        gets shrunk by flexbox, which flattens every bar to the
                        same height and hides the actual difference in scores. */}
                    <div className="mt-5 flex w-full items-end gap-2">
                      {company.scoreHistory.map((item, idx) => {
                        const heightPct = (item.score / 1000) * 100;
                        return (
                          <div key={idx} className="group flex flex-1 flex-col items-center gap-2">
                            <span className="text-[0.625rem] font-bold tabular text-amber-400 opacity-0 transition-opacity duration-[var(--frl-dur-fast)] group-hover:opacity-100">
                              {item.score}
                            </span>
                            <div className="flex h-32 w-full items-end overflow-hidden rounded-t-sm bg-white/[0.04]">
                              <div
                                className="w-full rounded-t-sm bg-gradient-to-t from-indigo-600 to-amber-400 transition-[filter] duration-[var(--frl-dur-fast)] group-hover:brightness-125"
                                style={{ height: `${heightPct}%` }}
                              />
                            </div>
                            <span className="text-[0.5625rem] font-mono text-fg-subtle">
                              {item.date}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
                    <Badge tone="insufficient" size="sm">
                      Insufficient Data
                    </Badge>
                    <p className="mt-3 text-body-sm text-fg-muted">
                      No historical reputation data is available.
                    </p>
                  </div>
                )}
              </Section>

              {/* ============ SECTION 9: CURRENT ISSUES ============ */}
              <Section
                eyebrow="9. Current issues"
                icon={<AlertTriangle className="h-3.5 w-3.5" />}
                title="Verified Issues, Gaps & AI Analysis"
              >
                {(!company.currentIssues ||
                  (company.currentIssues.verifiedIssues.length === 0 &&
                    company.currentIssues.informationGaps.length === 0 &&
                    company.currentIssues.aiAnalysis.length === 0)) ? (
                  <div className="flex items-start gap-3 rounded-md border border-emerald-500/25 bg-emerald-500/[0.07] p-5">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
                    <div>
                      <h3 className="text-body-sm font-semibold text-emerald-300">
                        No Current Issues
                      </h3>
                      <p className="mt-1 text-body-sm text-emerald-400/85">
                        No verified issues have been identified from the available data.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-7">
                    {company.currentIssues?.verifiedIssues &&
                      company.currentIssues.verifiedIssues.length > 0 && (
                        <div>
                          <h3 className="text-label text-rose-400">Verified issues (evidence-backed)</h3>
                          <div className="mt-3 space-y-2.5">
                            {company.currentIssues.verifiedIssues.map((iss, i) => (
                              <div
                                key={i}
                                className="rounded-md border border-rose-500/25 bg-rose-500/[0.07] p-4"
                              >
                                <h4 className="text-body-sm font-semibold text-rose-300">{iss.title}</h4>
                                <p className="mt-1.5 text-body-sm text-fg-secondary">{iss.detail}</p>
                                <span className="mt-2 block text-caption text-rose-400">
                                  Source: {iss.source}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {company.currentIssues?.informationGaps &&
                      company.currentIssues.informationGaps.length > 0 && (
                        <div>
                          <h3 className="text-label text-amber-400">Information gaps</h3>
                          <div className="mt-3 space-y-2.5">
                            {company.currentIssues.informationGaps.map((gap, i) => (
                              <div
                                key={i}
                                className="rounded-md border border-amber-500/25 bg-amber-500/[0.07] p-4"
                              >
                                <h4 className="text-body-sm font-semibold text-amber-300">{gap.title}</h4>
                                <p className="mt-1.5 text-body-sm text-fg-secondary">{gap.detail}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* AI interpretation is shown ONLY when the record actually
                        carries entries. This section never generates one. */}
                    {company.currentIssues?.aiAnalysis &&
                      company.currentIssues.aiAnalysis.length > 0 && (
                        <div>
                          <h3 className="flex items-center gap-1.5 text-label text-primary-hover">
                            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                            AI Reputation Analysis (Interpretation Layer)
                          </h3>
                          <div className="mt-3 space-y-2.5">
                            {company.currentIssues.aiAnalysis.map((ai, i) => (
                              <div
                                key={i}
                                className="rounded-md border border-indigo-500/25 bg-indigo-500/[0.07] p-4"
                              >
                                <h4 className="text-body-sm font-semibold text-indigo-200">{ai.title}</h4>
                                <p className="mt-1.5 text-body-sm text-fg-secondary">{ai.detail}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </Section>

              <p className="flex items-start gap-2.5 pb-4 text-caption leading-relaxed text-fg-subtle">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>
                  A registry record is not an FRL verification. Records marked as demo data are
                  development samples and are never presented as verified companies.
                </span>
              </p>
            </div>
          )}
        </Container>
      </main>
    </div>
  );
}