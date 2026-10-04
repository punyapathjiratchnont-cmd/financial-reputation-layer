'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Info,
  Lock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Company, DimensionDetail } from '@/lib/types';
import { ReputationEngineView } from './ReputationEngineView';
import { Badge, Button, Container } from '@/components/ui';
import { CountUp, GrowBar } from '@/components/motion';
import { useLanguage } from '@/lib/i18n';
import { Tr } from '@/lib/i18n';

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
function orNotReported(value: string | null | undefined, fallback: string): string {
  return value && value.trim() ? value : fallback;
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
    bar: 'bg-white',
    value: 'text-white',
    tone: 'border-white/20 bg-white/[0.05] text-fg-secondary',
    insufficientNote: 'Not enough verified payment records.',
  },
  {
    key: 'businessReliability' as const,
    label: 'Business Reliability',
    accent: 'indigo',
    bar: 'bg-white',
    value: 'text-white',
    tone: 'border-white/20 bg-white/[0.05] text-fg-secondary',
    insufficientNote: 'Not enough verified business attestation data.',
  },
  {
    key: 'financialStability' as const,
    label: 'Financial Stability',
    accent: 'cyan',
    bar: 'bg-white',
    value: 'text-white',
    tone: 'border-white/20 bg-white/[0.05] text-fg-secondary',
    insufficientNote: 'Financial stability metrics unavailable.',
  },
  {
    key: 'transactionHistory' as const,
    label: 'Transaction History',
    accent: 'amber',
    bar: 'bg-white',
    value: 'text-white',
    tone: 'border-white/20 bg-white/[0.05] text-fg-secondary',
    insufficientNote: 'Transaction history data not submitted.',
  },
];

const SECTION_NAV = [
  { id: 'reputation', label: 'Score' },
  { id: 'information', label: 'About' },
  { id: 'score-details', label: 'How it’s made' },
  { id: 'evidence', label: 'Proof' },
  { id: 'issues', label: 'Problems' },
];

function ProfileSection({
  id,
  title,
  subtitle,
  children,
}: {
  id: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="scroll-mt-36 border-t-2 border-white/[0.14] py-10 sm:py-14"
    >
      <h2 id={`${id}-heading`} className="text-h2 text-white">
        {title}
      </h2>
      <p className="mt-1.5 max-w-2xl text-body text-fg-muted">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function DimensionRow({ detail, spec }: { detail?: DimensionDetail; spec: (typeof DIMENSIONS)[number] }) {
  const { t } = useLanguage();
  const tr = (x: string) => t(x);
  // The original gate: a dimension shows a number only when it is BOTH
  // sufficient AND carries a score. Otherwise it is insufficient — never zero.
  const scoreValue = detail?.isSufficient && detail.score ? detail.score : null;

  return (
    <div className="py-5 first:pt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-body font-semibold text-slate-100">{tr(spec.label)}</h3>
        {scoreValue !== null ? (
          <p className="flex items-center gap-2">
            <span className={`text-body font-bold tabular ${spec.value}`}>{scoreValue} / 1000</span>
            <span
              className={`inline-block rounded-pill border px-2 py-0.5 text-[0.6875rem] font-semibold ${spec.tone}`}
            >
              {tr(detail?.label ?? '')}
            </span>
          </p>
        ) : (
          <Badge tone="insufficient" size="sm">
            {tr('Not enough data')}
          </Badge>
        )}
      </div>

      {scoreValue !== null && (
        <div className="mt-3 h-2 w-full overflow-hidden bg-white/[0.08]">
          <GrowBar percent={(scoreValue / 1000) * 100} className={spec.bar} />
        </div>
      )}

      <p className="mt-2.5 max-w-2xl text-body-sm leading-relaxed text-fg-subtle">
        {scoreValue !== null
          ? (detail?.explanation ?? tr('Not enough data'))
          : tr(spec.insufficientNote)}
      </p>
    </div>
  );
}

export function CompanyProfileView({ company }: Props) {
  const { t, language } = useLanguage();
  const tr = (x: string) => t(x);
  const [viewMode, setViewMode] = useState<'profile' | 'workspace'>('profile');
  const [activeSection, setActiveSection] = useState('reputation');

  // Highlights the section nav entry for the section currently in view.
  useEffect(() => {
    if (viewMode !== 'profile') return;
    const els = SECTION_NAV.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) setActiveSection(visible[0].target.id);
      },
      { rootMargin: '-35% 0px -55% 0px' },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [viewMode]);

  const hasScore = company.reputationScore !== null && company.reputationScore !== undefined;
  const dims = company.dimensions;

  // Development sample records must never read as a real, verified company.
  const isDemoCompany = company.sourceInfo?.sourceType === 'internal_demo';

  // The UI states the record's real verification status. It never asserts one.
  const verificationStatus = company.sourceInfo?.verificationStatus;
  const verificationLabel =
    verificationStatus === 'verified'
      ? tr('Verified by FRL')
      : verificationStatus === 'unverified'
        ? tr('Not verified by FRL')
        : tr('Verification status not reported');

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
              <span className="text-[0.9375rem] font-semibold tracking-tight text-white"><Tr s={"FRL"} /></span>
              <span className="mt-0.5 hidden text-[0.5625rem] uppercase tracking-[0.14em] text-fg-subtle sm:block">
                {tr('Directory')}
              </span>
            </span>
          </Link>

          <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
            <Link
              href="/search"
              className="inline-flex h-11 items-center rounded-md px-1 text-xs font-semibold text-fg-secondary sm:h-9 transition-colors duration-[var(--frl-dur-fast)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-hover"
            >
              {tr('Search Companies')}
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
                {tr('Public profile')}
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
                {tr('Owner tools')}
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
            <Link
              href="/"
              className="inline-flex min-h-11 items-center rounded-sm sm:min-h-6 transition-colors hover:text-fg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-hover"
            >
              {tr('Directory')}
            </Link>
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
            <Link
              href="/search"
              className="inline-flex min-h-11 items-center rounded-sm sm:min-h-6 transition-colors hover:text-fg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-hover"
            >
              {tr('Search')}
            </Link>
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
            <span aria-current="page" className="truncate text-fg-secondary">
              {company.name}
            </span>
          </nav>

          {/* =========================== DEMO BANNER =========================== */}
          {isDemoCompany && (
            <p className="mt-6 flex items-start gap-3 border-l-4 border-demo bg-demo-soft px-4 py-3 text-body-sm text-amber-200/90">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-demo" aria-hidden="true" />
              <span>
                <strong className="text-amber-300">{tr('Sample data.')}</strong>{' '}
                {tr('This is not a real company and the score is not a real reputation.')}
              </span>
            </p>
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
            <div className="mt-6">
              {/* ===== PAGE TITLE + SECTION NAV (orientation) ===== */}
              <p className="mb-3 text-label text-fg-subtle">{tr('Company Reputation Profile')}</p>


              {/* ================= 01 REPUTATION OVERVIEW (HERO) ================= */}
              <section
                id="reputation"
                aria-labelledby="reputation-heading"
                className="scroll-mt-36 pb-6 sm:pb-8"
              >
                <div className="frl-hero-tile p-6 sm:p-10">
                {/* The score is the focal point. A number renders only when one
                    genuinely exists. */}
                <div>
                  <p className="text-label text-fg-muted">
                    {isDemoCompany ? tr('Demo reputation score — not real') : tr('Reputation score')}
                  </p>
                  {hasScore ? (
                    <div className="mt-5 flex flex-wrap items-end gap-x-5 gap-y-2">
                      <p className="flex items-baseline gap-3">
                        <span className="frl-display text-[clamp(3.5rem,12vw,6.5rem)] leading-[1] text-white tabular">
                          <CountUp value={company.reputationScore as number} />
                        </span>
                        <span className="text-lg font-semibold text-fg-muted sm:text-xl">
                          / 1000
                        </span>
                      </p>
                      {!isDemoCompany && (
                        <Badge tone="success" size="md" className="mb-2 sm:mb-4">
                          {tr(company.reputationLevel ?? 'Not enough data')}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <div className="mt-5">
                      <p className="frl-display text-[clamp(3rem,10vw,5.5rem)] leading-[1] text-fg-subtle">
                        — / 1000
                      </p>
                      <Badge tone="insufficient" size="md" className="mt-3">
                        {tr('No score yet')}
                      </Badge>
                    </div>
                  )}
                </div>

                {hasScore && (
                  <div className="mt-6 max-w-xl" aria-hidden="true">
                    <div className="h-2 w-full overflow-hidden bg-white/[0.1]">
                      <GrowBar
                        percent={((company.reputationScore as number) / 1000) * 100}
                        className="bg-primary"
                      />
                    </div>
                    <div className="mt-1.5 flex justify-between text-caption text-fg-subtle">
                      <span>0</span>
                      <span>1000</span>
                    </div>
                  </div>
                )}

                <p className="mt-5 max-w-xl text-body leading-relaxed text-fg-secondary">
                  {hasScore
                    ? tr('Based on the records FRL holds about this company. A guide, not a guarantee.')
                    : tr('FRL does not have enough verified records to give this company a score yet.')}
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() =>
                      document
                        .getElementById('score-details')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  >
                    {tr('See how it’s made')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    icon={<Lock className="h-3.5 w-3.5" aria-hidden="true" />}
                    onClick={() => setViewMode('workspace')}
                  >
                    {tr('Edit my company data')}
                  </Button>
                </div>
                <div className="mt-8 border-t border-white/[0.14] pt-6">
                <div className="flex items-start gap-4">
                  <span
                    aria-hidden="true"
                    className="grid h-12 w-12 shrink-0 place-items-center border border-white/[0.14] bg-white/[0.03] text-2xl sm:h-14 sm:w-14 sm:text-3xl"
                  >
                    {company.logo || '🏢'}
                  </span>
                  <div className="min-w-0">
                    <h1
                      id="reputation-heading"
                      className="frl-display break-words text-[clamp(1.4rem,3.6vw,2.4rem)] leading-[1.15] text-white"
                    >
                      {company.name}
                    </h1>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {verificationStatus === 'verified' ? (
                        <Badge tone="success" size="sm" dot>
                          {tr('Verified by FRL')}
                        </Badge>
                      ) : (
                        <Badge tone="neutral" size="sm" className="backdrop-blur-sm">
                          {verificationLabel}
                        </Badge>
                      )}
                      {/* Demo is stated once by the banner above and once at the
                          score. It is not repeated as a third badge here. */}
                      {!isDemoCompany &&
                        (company.isClaimed ? (
                          <Badge tone="primary" size="sm" dot>
                            {tr('Claimed profile')}
                          </Badge>
                        ) : (
                          <Badge tone="neutral" size="sm">
                            {tr('Public profile (unclaimed)')}
                          </Badge>
                        ))}
                    </div>
                  </div>
                </div>

                </div>
                </div>
              </section>

              <nav
                aria-label="Profile sections"
                className="sticky top-[8rem] z-30 -mx-4 flex gap-1 overflow-x-auto border-b border-white/[0.07] bg-canvas/90 px-4 backdrop-blur-md sm:top-[4.5rem] sm:mx-0 sm:px-0"
              >
                {SECTION_NAV.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    aria-current={activeSection === s.id ? 'true' : undefined}
                    className={`inline-flex h-11 shrink-0 items-center border-b-2 px-3 text-xs font-semibold transition-colors duration-[var(--frl-dur-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-hover sm:h-10 ${
                      activeSection === s.id
                        ? 'border-primary-hover text-white'
                        : 'border-transparent text-fg-subtle hover:text-white'
                    }`}
                  >
                    {tr(s.label)}
                  </a>
                ))}
              </nav>

              {/* ================= 02 BUSINESS INFORMATION ================= */}
              <ProfileSection
                id="information"
                title={tr('About this company')}
                subtitle={tr('Who they are and where the data comes from.')}
              >
                <dl className="grid grid-cols-1 divide-y divide-white/[0.06] border-y border-white/[0.06] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
                  {[
                    { label: tr('Business type'), value: orNotReported(company.industry, tr('Not reported')) },
                    { label: tr('Country'), value: company.country ?? tr('Country not reported') },
                    { label: tr('Founded'), value: orNotReported(company.founded_date, tr('Not reported')) },
                    { label: tr('Registration no.'), value: orNotReported(company.registration_no, tr('Not reported')) },
                  ].map((f) => (
                    <div key={f.label} className="px-1 py-3 sm:px-4 sm:py-4 sm:first:pl-1">
                      <dt className="text-caption text-fg-subtle">{f.label}</dt>
                      <dd className="mt-1 break-words text-body-sm font-semibold text-slate-100">
                        {f.value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <p className="mt-5 max-w-3xl text-body-sm leading-relaxed text-fg-secondary">
                  {company.overview ?? tr('Company overview not available.')}
                </p>

                <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-fg-subtle">
                  <span>{tr('Source:')} {orNotReported(company.sourceInfo?.provider, tr('Not reported'))}</span>
                  <span>
                    {tr('Retrieved:')}{' '}
                    {company.sourceInfo?.retrievedAt
                      ? new Date(company.sourceInfo.retrievedAt).toLocaleDateString(language === 'th' ? 'th-TH-u-ca-gregory' : 'en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : tr('Not reported')}
                  </span>
                </p>
              </ProfileSection>

              {/* ================= 03 SCORE DETAILS ================= */}
              <ProfileSection
                id="score-details"
                title={tr('How the score is made')}
                subtitle={tr('Four areas feed the score. Each is marked out of 1000.')}
              >
                <div className="grid gap-4 lg:grid-cols-5">
                <div className="frl-tile divide-y divide-white/[0.06] lg:col-span-3">
                  {DIMENSIONS.map((spec) => (
                    <DimensionRow key={spec.key} spec={spec} detail={dims?.[spec.key]} />
                  ))}
                </div>

                <div className="space-y-4 lg:col-span-2">
                {/* In short: existing quick-summary data, not new analysis. */}
                <div className="frl-tile">
                  <h3 className="text-h3 text-white">{tr('In short')}</h3>
                  <p className="mt-2 max-w-2xl text-body-sm leading-relaxed text-fg-muted">
                    {company.quickSummary?.dataStatus
                      ? `${tr('Data status:')} ${company.quickSummary.dataStatus}`
                      : tr('Data status not reported.')}
                  </p>

                  <div className="mt-5 grid grid-cols-1 gap-6">
                    <div>
                      <h4 className="text-body-sm font-semibold text-emerald-400">{tr('Strengths')}</h4>
                      <ul className="mt-2 space-y-1.5 text-body-sm text-fg-secondary">
                        {company.quickSummary?.strengths.map((st, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span aria-hidden="true" className="text-emerald-400">
                              &bull;
                            </span>
                            <span>{st}</span>
                          </li>
                        )) || <li className="text-fg-subtle">{tr('No specific strengths recorded.')}</li>}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-body-sm font-semibold text-amber-400">{tr('Things to consider')}</h4>
                      <ul className="mt-2 space-y-1.5 text-body-sm text-fg-secondary">
                        {company.quickSummary?.thingsToConsider.map((tc, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span aria-hidden="true" className="text-amber-400">
                              &bull;
                            </span>
                            <span>{tc}</span>
                          </li>
                        )) || <li className="text-fg-subtle">{tr('No specific warnings recorded.')}</li>}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Trend: from the record's own scoreHistory. Nothing invented. */}
                <div className="frl-tile">
                  <h3 className="text-label text-fg-subtle">{tr('Score trend over time (0 – 1000)')}</h3>
                  {company.scoreHistory && company.scoreHistory.length > 0 ? (
                    <div className="mt-5 flex w-full items-end gap-2">
                      {company.scoreHistory.map((item, idx) => {
                        const heightPct = (item.score / 1000) * 100;
                        return (
                          <div key={idx} className="group flex flex-1 flex-col items-center gap-2">
                            <span className="text-[0.625rem] font-bold tabular text-white opacity-0 transition-opacity duration-[var(--frl-dur-fast)] group-hover:opacity-100">
                              {item.score}
                            </span>
                            <div className="flex h-32 w-full items-end overflow-hidden rounded-t-sm bg-white/[0.04]">
                              <div
                                className="w-full rounded-t-sm bg-gradient-to-t from-primary-active to-white transition-[filter] duration-[var(--frl-dur-fast)] group-hover:brightness-125"
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
                  ) : (
                    <p className="mt-3 flex items-center gap-2 text-body-sm text-fg-muted">
                      <Badge tone="insufficient" size="sm">
                        {tr('Insufficient Data')}
                      </Badge>
                      {tr('No historical reputation data is available.')}
                    </p>
                  )}
                </div>
              </div>
                </div>
              </ProfileSection>

              {/* ================= 04 EVIDENCE ================= */}
              {/* The public profile record carries no user comments or experiences,
                  so no "Business Experiences" section is rendered here. */}
              <ProfileSection
                id="evidence"
                title={tr('Proof')}
                subtitle={tr('Records and events behind the reputation. Each one shows its source.')}
              >
                <div className="space-y-12">
                  {/* Achievements: cut-corner cards with a ghost index */}
                  <div>
                    <h3 className="text-label text-fg-subtle">{tr('Achievements & projects')}</h3>
                    <div className="mt-4 grid gap-5 md:grid-cols-2">
                      {company.trackRecord?.achievements.map((ach, i) => (
                        <div
                          key={i}
                          data-fx="card"
                          style={{ ['--i' as string]: i }}
                          className="frl-bevel-wrap frl-hoverlift"
                        >
                          <div className="frl-bevel h-full">
                            <div className="frl-bevel-in frl-spot h-full p-6">
                              <span aria-hidden="true" className="frl-ghost">
                                {String(i + 1).padStart(2, '0')}
                              </span>
                              <h4 className="max-w-[80%] text-body font-semibold text-white">{ach.title}</h4>
                              <p className="mt-2 text-body-sm leading-relaxed text-fg-muted">{ach.description}</p>
                              <p className="mt-4 flex items-center gap-2 text-caption text-fg-subtle">
                                {tr('Source')} <Badge tone="primary" size="sm">{tr(ach.source)}</Badge>
                              </p>
                            </div>
                          </div>
                        </div>
                      )) || (
                        <p className="text-body-sm text-fg-subtle">{tr('No public achievements listed.')}</p>
                      )}
                    </div>
                  </div>

                  {/* Relationships: link-style rows with a cut corner on hover */}
                  <div>
                    <h3 className="text-label text-fg-subtle">{tr('Business relationships')}</h3>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      {company.trackRecord?.relationships.map((rel, i) => (
                        <div
                          key={i}
                          data-fx="up"
                          style={{ ['--i' as string]: i }}
                          className="frl-chip-tile frl-chip-tile-on flex items-center justify-between gap-3 p-4"
                        >
                          <div className="min-w-0">
                            <h4 className="truncate text-body-sm font-semibold text-white">{rel.partner}</h4>
                            <p className="mt-0.5 text-caption text-fg-subtle">{rel.relationshipType}</p>
                          </div>
                          <Badge tone="success" size="sm" className="shrink-0">
                            {tr(rel.source)}
                          </Badge>
                        </div>
                      )) || (
                        <p className="text-body-sm text-fg-subtle">{tr('No public relationship records listed.')}</p>
                      )}
                    </div>
                  </div>

                  {/* History: a line that draws itself down the page, one pulse per event */}
                  <div>
                    <h3 className="text-label text-fg-subtle">{tr('Reputation history')}</h3>
                    <ol className="frl-timeline mt-6" data-fx="line">
                      {company.reputationHistory?.map((ev, i) => (
                        <li
                          key={i}
                          data-fx="left"
                          style={{ ['--i' as string]: i + 1 }}
                          className="frl-timeline-item"
                        >
                          <span aria-hidden="true" className="frl-timeline-dot" style={{ ['--i' as string]: i }} />
                          <span className="frl-display text-lg text-primary-hover">{ev.year}</span>
                          <h4 className="mt-1 text-body font-semibold text-white">{ev.event}</h4>
                          <span className="text-caption text-fg-subtle">
                            {tr('Source:')} {ev.source}
                          </span>
                        </li>
                      )) || (
                        <li className="text-body-sm text-fg-subtle">{tr('No historical events recorded.')}</li>
                      )}
                    </ol>
                  </div>
                </div>
              </ProfileSection>

              {/* ================= 05 ISSUES ================= */}
              <ProfileSection
                id="issues"
                title={tr('Problems')}
                subtitle={tr('Known concerns and missing information.')}
              >
                {(!company.currentIssues ||
                  (company.currentIssues.verifiedIssues.length === 0 &&
                    company.currentIssues.informationGaps.length === 0 &&
                    company.currentIssues.aiAnalysis.length === 0)) ? (
                  <p className="flex items-start gap-2.5 text-body-sm text-emerald-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                    <span>
                      <strong className="font-semibold">{tr('No current issues.')}</strong>{' '}
                      <span className="text-emerald-400/85">
                        {tr('No verified issues have been identified from the available data.')}
                      </span>
                    </span>
                  </p>
                ) : (
                  <div className="space-y-8">
                    {company.currentIssues?.verifiedIssues &&
                      company.currentIssues.verifiedIssues.length > 0 && (
                        <div>
                          <h3 className="text-label text-rose-400">{tr('Confirmed problems')}</h3>
                          <div className="mt-3 space-y-2.5">
                            {company.currentIssues.verifiedIssues.map((iss, i) => (
                              <div
                                key={i}
                                className="rounded-md border border-rose-500/25 bg-rose-500/[0.07] p-4"
                              >
                                <h4 className="text-body-sm font-semibold text-rose-300">{iss.title}</h4>
                                <p className="mt-1.5 text-body-sm text-fg-secondary">{iss.detail}</p>
                                <span className="mt-2 block text-caption text-rose-400">
                                  {tr('Source:')} {iss.source}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    {company.currentIssues?.informationGaps &&
                      company.currentIssues.informationGaps.length > 0 && (
                        <div>
                          <h3 className="text-label text-amber-400">{tr('Missing information')}</h3>
                          <ul className="mt-3 divide-y divide-white/[0.06] border-y border-white/[0.06]">
                            {company.currentIssues.informationGaps.map((gap, i) => (
                              <li key={i} className="py-3.5">
                                <h4 className="text-body-sm font-semibold text-amber-300">{gap.title}</h4>
                                <p className="mt-1 text-body-sm text-fg-secondary">{gap.detail}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                    {/* AI interpretation is shown ONLY when the record actually
                        carries entries. This section never generates one. */}
                    {company.currentIssues?.aiAnalysis &&
                      company.currentIssues.aiAnalysis.length > 0 && (
                        <div>
                          <h3 className="flex items-center gap-1.5 text-label text-primary-hover">
                            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                            {tr('Automated analysis (interpretation, not fact)')}
                          </h3>
                          <ul className="mt-3 divide-y divide-white/[0.06] border-y border-white/[0.06]">
                            {company.currentIssues.aiAnalysis.map((ai, i) => (
                              <li key={i} className="py-3.5">
                                <h4 className="text-body-sm font-semibold text-indigo-200">{ai.title}</h4>
                                <p className="mt-1 text-body-sm text-fg-secondary">{ai.detail}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                )}
              </ProfileSection>

              <p className="flex items-start gap-2.5 border-t border-white/[0.07] pt-6 pb-4 text-caption leading-relaxed text-fg-subtle">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>
                  {tr(
                    'A registry record is not an FRL verification. Records marked as demo data are development samples and are never presented as verified companies.',
                  )}
                </span>
              </p>
            </div>
          )}
        </Container>
      </main>
    </div>
  );
}