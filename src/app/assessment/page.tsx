'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowRight, Check, HelpCircle, Scale, FileCheck, X } from 'lucide-react';
import { SiteNav } from '@/components/SiteNav';
import { AxesArt, SealArt } from '@/components/home/Art';
import { useLanguage } from '@/lib/i18n';
import { EN, TH } from './content';

/**
 * "How FRL assesses" — the long-form explanation of the score, its four
 * dimensions, and how FRL treats sources and evidence. Content lives in
 * ./content.ts in both languages. Pure explanation: nothing here is data or a
 * calculation.
 */

function Section({
  id,
  index,
  title,
  lead,
  children,
}: {
  id: string;
  index: string;
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-40 border-t-2 border-white/[0.14] py-12 sm:py-16">
      <div className="relative" data-fx="up">
        <span aria-hidden="true" className="frl-ghost" style={{ right: 0, top: '-0.5rem' }}>
          {index}
        </span>
        <h2 id={`${id}-h`} className="text-h2 max-w-[85%] text-white">
          {title}
        </h2>
        {lead && <p className="mt-3 max-w-2xl text-body leading-relaxed text-fg-muted">{lead}</p>}
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}

function Card({ children, className = '', hot = false, i = 0 }: { children: ReactNode; className?: string; hot?: boolean; i?: number }) {
  return (
    <div data-fx="card" style={{ ['--i' as string]: i }} className={`frl-bevel-wrap frl-hoverlift ${className}`}>
      <div className={`frl-bevel h-full ${hot ? 'frl-bevel-hot' : ''}`}>
        <div className={`frl-bevel-in frl-spot h-full p-5 sm:p-6 ${hot ? 'frl-bevel-in-hot' : ''}`}>{children}</div>
      </div>
    </div>
  );
}

function Meter({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span aria-hidden="true" className="flex gap-1.5">
      {[1, 2, 3].map((k) => (
        <span key={k} className={`h-2 w-9 ${k <= level ? 'bg-primary' : 'bg-white/[0.12]'}`} />
      ))}
    </span>
  );
}

function Bullets({ items, cols = false }: { items: string[]; cols?: boolean }) {
  return (
    <ul className={`mt-3 grid gap-2.5 ${cols ? 'sm:grid-cols-2' : ''}`}>
      {items.map((t, i) => (
        <li key={i} data-fx="up" style={{ ['--i' as string]: i }} className="flex items-start gap-3 text-body-sm leading-relaxed text-fg-secondary">
          <span aria-hidden="true" className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 bg-primary" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

/** Ten websites, one origin: the lines converge, so ten is not ten. */
function OriginDiagram({ sites, origin }: { sites: string; origin: string }) {
  const xs = Array.from({ length: 10 }, (_, i) => 28 + i * 36);
  return (
    <svg viewBox="0 0 400 190" aria-hidden="true" className="h-full w-full">
      {xs.map((x, i) => (
        <g key={i}>
          <line className="frl-flow" style={{ animationDelay: `${i * 0.15}s` }} x1={x} y1="46" x2="200" y2="136" stroke="rgb(255 90 70 / 0.55)" strokeDasharray="4 5" />
          <rect x={x - 11} y="24" width="22" height="22" fill="#151515" stroke="rgb(255 255 255 / 0.3)" />
        </g>
      ))}
      <text x="200" y="14" textAnchor="middle" fontSize="10" letterSpacing="1.6" fill="#8f8f8a">
        {sites}
      </text>
      <rect x="150" y="136" width="100" height="30" fill="#2a0d0d" stroke="#ff3333" strokeWidth="1.5" />
      <text x="200" y="156" textAnchor="middle" fontSize="11" fill="#ff9a8f" letterSpacing="1.2">
        {origin}
      </text>
    </svg>
  );
}

export default function AssessmentPage() {
  const { language } = useLanguage();
  const c = language === 'th' ? TH : EN;
  const [active, setActive] = useState('what');

  useEffect(() => {
    const els = c.toc.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => e !== null);
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting);
        if (hit.length) setActive(hit[0].target.id);
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [c]);

  return (
    <div className="min-h-screen bg-canvas pb-24 font-sans text-fg antialiased selection:bg-primary-soft">
      <SiteNav />

      <main className="pt-28 sm:pt-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* ================= INTRO ================= */}
          <section id="what" aria-labelledby="what-h" className="scroll-mt-40 pb-8">
            <div className="frl-hero-tile relative overflow-hidden p-6 sm:p-12" data-fx="scale">
              <span aria-hidden="true" className="pointer-events-none absolute -right-6 -top-10 hidden h-64 w-64 opacity-70 md:block">
                <AxesArt />
              </span>
              <p className="frl-eyebrow text-label text-primary-hover" data-fx="line">
                {c.intro.eyebrow}
              </p>
              <h1 id="what-h" className="frl-display mt-5 max-w-3xl text-[clamp(1.9rem,5vw,3.4rem)] leading-[1.1] text-white">
                {c.intro.title}
              </h1>
              <div className="mt-8 max-w-2xl space-y-4">
                {c.intro.paragraphs.map((p, i) => (
                  <p
                    key={i}
                    data-fx="left"
                    style={{ ['--i' as string]: i + 1 }}
                    className={i === 2 ? 'border-l-2 border-primary pl-4 text-body leading-relaxed text-white' : 'text-body leading-relaxed text-fg-secondary'}
                  >
                    {p}
                  </p>
                ))}
              </div>
              <a
                href="#dimensions"
                className="mt-8 inline-flex h-11 items-center gap-2 bg-primary-active px-5 text-sm font-semibold text-white transition-colors hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {c.intro.cta}
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </section>

          <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
            {/* ============== TABLE OF CONTENTS ============== */}
            <nav
              aria-label={c.navTitle}
              className="sticky top-[4.5rem] z-30 -mx-4 mb-2 flex gap-1 overflow-x-auto border-b border-white/[0.08] bg-canvas/90 px-4 backdrop-blur-md lg:top-28 lg:z-0 lg:mx-0 lg:mb-0 lg:block lg:self-start lg:overflow-visible lg:border-b-0 lg:bg-transparent lg:px-0 lg:backdrop-blur-none"
            >
              <p className="mb-3 hidden text-label text-fg-subtle lg:block">{c.navTitle}</p>
              {c.toc.map((s, i) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  aria-current={active === s.id ? 'true' : undefined}
                  className={`flex min-h-11 shrink-0 items-center gap-3 whitespace-nowrap border-b-2 px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-hover lg:min-h-9 lg:border-b-0 lg:border-l-2 lg:px-4 ${
                    active === s.id ? 'border-primary text-white' : 'border-transparent text-fg-subtle hover:text-white'
                  }`}
                >
                  <span className="tabular text-[0.6875rem] text-primary-hover">{String(i).padStart(2, '0')}</span>
                  {s.label}
                </a>
              ))}
            </nav>

            <div className="min-w-0">
              {/* ================= 4 DIMENSIONS ================= */}
              <Section id="dimensions" index="01" title={c.dimensions.title} lead={c.dimensions.lead}>
                <div className="grid gap-5 md:grid-cols-2">
                  {c.dimensions.items.map((d, i) => (
                    <Card key={d.code} i={i}>
                      <span aria-hidden="true" className="frl-ghost">
                        {d.code}
                      </span>
                      <p className="text-label text-primary-hover">{d.code}</p>
                      <h3 className="frl-display mt-2 text-[clamp(1.4rem,2.6vw,1.9rem)] text-white">{d.name}</h3>
                      <p className="mt-1 text-body font-semibold text-slate-100">{d.tagline}</p>
                      <p className="mt-3 text-body-sm leading-relaxed text-fg-muted">{d.intro}</p>
                      <p className="mt-5 text-label text-fg-subtle">{d.relatedTitle}</p>
                      <ul className="mt-2.5 space-y-2">
                        {d.related.map((r) => (
                          <li key={r} className="flex items-start gap-2.5 text-body-sm text-fg-secondary">
                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-hover" aria-hidden="true" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-5 border-l-2 border-primary/70 pl-3 text-caption leading-relaxed text-fg-muted">{d.note}</p>
                    </Card>
                  ))}
                </div>
              </Section>

              {/* ================= HOW DATA IS TRUSTED ================= */}
              <Section id="trust" index="02" title={c.trust.title} lead={c.trust.lead}>
                <ol className="flex flex-wrap items-center gap-2">
                  {c.trust.chain.map((step, i) => (
                    <li key={step} data-fx="up" style={{ ['--i' as string]: i }} className="flex items-center gap-2">
                      <span className="frl-chip-tile frl-chip-tile-on px-4 py-3 text-body-sm font-semibold text-white">
                        <span className="mr-2 text-primary-hover">{i + 1}</span>
                        {step}
                      </span>
                      {i < c.trust.chain.length - 1 && <ArrowRight className="frl-chev-static h-4 w-4 text-primary-hover" aria-hidden="true" />}
                    </li>
                  ))}
                </ol>

                <h3 className="mt-12 text-h3 text-white" data-fx="up">
                  {c.trust.sourcesTitle}
                </h3>
                <p className="mt-2 max-w-2xl text-body-sm leading-relaxed text-fg-muted" data-fx="up">
                  {c.trust.sourcesLead}
                </p>
                <div className="mt-6 space-y-5">
                  {c.trust.tiers.map((t, i) => (
                    <Card key={t.name} i={i} hot={t.level === 3}>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 sm:max-w-[34rem]">
                          <h4 className="frl-display text-[clamp(1.2rem,2.2vw,1.6rem)] text-white">{t.name}</h4>
                          <p className="mt-1 text-body-sm font-semibold text-primary-hover">{t.thai}</p>
                          <p className="mt-3 text-body-sm leading-relaxed text-fg-muted">{t.body}</p>
                        </div>
                        <div className="shrink-0 sm:text-right">
                          <p className="text-label text-fg-subtle">{c.trust.weightLabel}</p>
                          <p className="frl-display mt-1 text-xl text-white">{t.weight}</p>
                          <div className="mt-2 sm:flex sm:justify-end">
                            <Meter level={t.level} />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                <p className="frl-panel frl-panel-warn mt-6 p-4 text-body-sm text-amber-100" data-fx="up">
                  {c.trust.reviewNote}
                </p>
              </Section>

              {/* ================= TRANSPARENCY ================= */}
              <Section id="transparency" index="03" title={c.transparency.title} lead={c.transparency.lead}>
                <div className="grid gap-5 md:grid-cols-2">
                  <Card hot>
                    <HelpCircle className="h-6 w-6 text-primary-hover" aria-hidden="true" />
                    <p className="frl-display mt-4 text-[clamp(1.2rem,2.2vw,1.6rem)] leading-snug text-white">{c.transparency.notWant}</p>
                    <p className="mt-4 text-body-sm leading-relaxed text-fg-secondary">{c.transparency.closing}</p>
                  </Card>
                  <div>
                    <p className="text-label text-fg-subtle" data-fx="up">
                      {c.transparency.want}
                    </p>
                    <ul className="mt-3 space-y-2.5">
                      {c.transparency.questions.map((q, i) => (
                        <li key={q} data-fx="left" style={{ ['--i' as string]: i }} className="frl-chip-tile frl-chip-tile-on flex items-center gap-3 px-4 py-3 text-body-sm font-semibold text-white">
                          <span className="frl-display text-primary-hover">?</span>
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Section>

              {/* ================= SOURCE vs CLAIM ================= */}
              <Section id="credibility" index="04" title={c.credibility.title} lead={c.credibility.lead}>
                <div className="grid items-stretch gap-5 md:grid-cols-[1fr_auto_1fr]">
                  <Card>
                    <p className="frl-display text-[clamp(1.2rem,2.2vw,1.6rem)] text-white">{c.credibility.sourceName}</p>
                    <p className="mt-3 text-body-sm leading-relaxed text-fg-muted">{c.credibility.sourceBody}</p>
                  </Card>
                  <span aria-hidden="true" className="frl-display hidden place-items-center text-3xl text-primary-hover md:grid">
                    ≠
                  </span>
                  <Card>
                    <p className="frl-display text-[clamp(1.2rem,2.2vw,1.6rem)] text-white">{c.credibility.claimName}</p>
                    <p className="mt-3 text-body-sm leading-relaxed text-fg-muted">{c.credibility.claimBody}</p>
                  </Card>
                </div>

                <p className="mt-10 text-label text-fg-subtle" data-fx="up">
                  {c.credibility.examplesTitle}
                </p>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  {c.credibility.examples.map((e, i) => (
                    <div key={i} data-fx="up" style={{ ['--i' as string]: i }} className="frl-panel p-5">
                      <p className="text-body font-semibold text-white">{e.a}</p>
                      <p className="mt-2 flex items-start gap-2 text-body-sm text-fg-muted">
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-primary-hover" aria-hidden="true" />
                        {e.b}
                      </p>
                    </div>
                  ))}
                </div>

                <h3 className="mt-12 text-h3 text-white" data-fx="up">
                  {c.credibility.checkTitle}
                </h3>
                <Bullets items={c.credibility.checks} cols />
                <p className="mt-6 border-l-2 border-primary pl-4 text-body-sm text-fg-secondary" data-fx="up">
                  {c.credibility.checkNote}
                </p>
              </Section>

              {/* ================= CLAIM CHAIN ================= */}
              <Section id="claim-chain" index="05" title={c.claimChain.title} lead={c.claimChain.lead}>
                <ol className="grid gap-4 md:grid-cols-4">
                  {c.claimChain.steps.map((s, i) => {
                    const last = i === c.claimChain.steps.length - 1;
                    return (
                      <li key={s.label} data-fx="card" style={{ ['--i' as string]: i }} className="relative">
                        <div className={`frl-panel h-full p-5 ${last ? 'frl-panel-warn' : ''}`}>
                          <p className="text-label text-primary-hover">{String(i + 1).padStart(2, '0')}</p>
                          <p className="frl-display mt-2 text-xl text-white">{s.label}</p>
                          <p className="mt-3 text-body-sm leading-relaxed text-fg-muted">{s.example}</p>
                        </div>
                        {i < c.claimChain.steps.length - 1 && (
                          <ArrowRight aria-hidden="true" className="frl-chev-static absolute -right-3.5 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 text-primary-hover md:block" />
                        )}
                      </li>
                    );
                  })}
                </ol>
                <p className="mt-6 text-body-sm text-fg-muted" data-fx="up">
                  {c.claimChain.unverified}
                </p>
                <p className="mt-4 border-l-2 border-primary pl-4 text-body text-white" data-fx="up">
                  {c.claimChain.closing}
                </p>
              </Section>

              {/* ================= CORROBORATION ================= */}
              <Section id="corroboration" index="06" title={c.corroboration.title} lead={c.corroboration.lead}>
                <div className="grid items-center gap-8 md:grid-cols-2">
                  <div className="frl-panel p-5" data-fx="scale">
                    <div className="h-52 w-full">
                      <OriginDiagram sites={c.corroboration.tenSites} origin={c.corroboration.oneOrigin} />
                    </div>
                  </div>
                  <div data-fx="left">
                    <p className="frl-display text-[clamp(1.2rem,2.2vw,1.6rem)] leading-snug text-white">{c.corroboration.notConfirm}</p>
                    <p className="mt-3 text-body-sm leading-relaxed text-fg-muted">{c.corroboration.mayBeOne}</p>
                    <p className="mt-8 text-label text-fg-subtle">{c.corroboration.heavier}</p>
                    <Card hot className="mt-3">
                      <p className="frl-display text-[clamp(1.1rem,2vw,1.4rem)] text-white">{c.corroboration.heavierName}</p>
                      <p className="mt-2 text-body-sm leading-relaxed text-fg-secondary">{c.corroboration.heavierBody}</p>
                    </Card>
                  </div>
                </div>
              </Section>

              {/* ================= TRACK RECORD ================= */}
              <Section id="track" index="07" title={c.track.title} lead={c.track.lead}>
                <ol className="frl-timeline" data-fx="line">
                  {c.track.items.map((t, i) => (
                    <li key={t} data-fx="left" style={{ ['--i' as string]: i }} className="frl-timeline-item">
                      <span aria-hidden="true" className="frl-timeline-dot" style={{ ['--i' as string]: i }} />
                      <span className="text-body font-semibold text-white">{t}</span>
                    </li>
                  ))}
                </ol>
                <p className="mt-6 border-l-2 border-primary pl-4 text-body-sm text-fg-secondary" data-fx="up">
                  {c.track.note}
                </p>
              </Section>

              {/* ================= DATA CONFIDENCE ================= */}
              <Section id="confidence" index="08" title={c.confidence.title} lead={c.confidence.lead}>
                <div className="grid gap-5 md:grid-cols-2">
                  <Card>
                    <p className="frl-display text-[clamp(1.1rem,2vw,1.4rem)] text-white">{c.confidence.lowScore}</p>
                    <div className="mt-5 h-3 w-full bg-white/[0.1]" aria-hidden="true">
                      <div className="h-full w-[22%] bg-primary" />
                    </div>
                  </Card>
                  <Card>
                    <p className="frl-display text-[clamp(1.1rem,2vw,1.4rem)] text-white">{c.confidence.notEnough}</p>
                    <div className="mt-5 h-3 w-full border border-dashed border-white/40" aria-hidden="true" />
                  </Card>
                </div>
                <p className="mt-6 max-w-3xl text-body leading-relaxed text-fg-secondary" data-fx="up">
                  {c.confidence.meaning}
                </p>
                <p className="mt-4 flex flex-wrap items-center gap-2 text-body-sm text-fg-muted" data-fx="up">
                  <span className="text-label text-fg-subtle">{c.confidence.notThis}</span>
                  <span className="frl-chip-tile px-4 py-2 text-white">{c.confidence.badResult}</span>
                </p>
                <p className="mt-6 border-l-2 border-primary pl-4 text-body-sm text-white" data-fx="up">
                  {c.confidence.principle}
                </p>
              </Section>

              {/* ================= NOT A JUDGE ================= */}
              <Section id="judge" index="09" title={c.judge.title} lead={c.judge.lead}>
                <div className="grid gap-5 md:grid-cols-2">
                  <Card hot>
                    <FileCheck className="h-6 w-6 text-primary-hover" aria-hidden="true" />
                    <p className="frl-display mt-4 text-xl text-white">Evidence Provider</p>
                    <p className="mt-3 text-body-sm leading-relaxed text-fg-secondary">{c.judge.body}</p>
                  </Card>
                  <Card>
                    <Scale className="h-6 w-6 text-fg-subtle" aria-hidden="true" />
                    <p className="frl-display mt-4 text-xl text-fg-subtle line-through decoration-primary decoration-2">Judge</p>
                    <ul className="mt-4 grid gap-2">
                      {c.judge.decisions.map((d, i) => (
                        <li key={d} data-fx="up" style={{ ['--i' as string]: i }} className="frl-chip-tile px-4 py-2.5 text-body-sm font-semibold text-white">
                          {d}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>
                <p className="mt-6 max-w-3xl border-l-2 border-primary pl-4 text-body text-white" data-fx="up">
                  {c.judge.closing}
                </p>
              </Section>

              {/* ================= WARNING ================= */}
              <section aria-labelledby="warning-h" className="border-t-2 border-white/[0.14] pt-12">
                <div className="frl-panel frl-panel-warn p-6 sm:p-10" data-fx="scale">
                  <div className="flex items-start gap-5">
                    <span aria-hidden="true" className="hidden h-20 w-20 shrink-0 sm:block">
                      <SealArt tone="warning" />
                    </span>
                    <div>
                      <h2 id="warning-h" className="text-h2 text-amber-100">
                        ⚠️ {c.warning.title}
                      </h2>
                      <ul className="mt-5 space-y-3">
                        {c.warning.lines.map((l, i) => (
                          <li key={i} className={`text-body leading-relaxed ${i === c.warning.lines.length - 1 ? 'font-semibold text-white' : 'text-amber-50/90'}`}>
                            {l}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/search" className="inline-flex h-11 items-center bg-primary-active px-5 text-sm font-semibold text-white transition-colors hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                    {language === 'th' ? 'ค้นหาบริษัท' : 'Search companies'}
                  </Link>
                  <Link href="/principles" className="inline-flex h-11 items-center border border-white/20 px-5 text-sm font-semibold text-white transition-colors hover:border-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-hover">
                    {language === 'th' ? 'อ่านหลักการ' : 'Read the principles'}
                  </Link>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
