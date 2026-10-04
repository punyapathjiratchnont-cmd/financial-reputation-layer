'use client';

import { Scale, Lock, HelpCircle, FileCheck, RefreshCw } from 'lucide-react';
import { TierBadge } from '../company/[id]/ProfileMotion';
import { useLanguage } from '@/lib/i18n';

import { SiteNav } from '@/components/SiteNav';
import { AxesArt } from '@/components/home/Art';
import { Tr } from '@/lib/i18n';
export default function PrinciplesPage() {
  const { t } = useLanguage();

  const principles = [
    {
      code: 'P1',
      title: t('principles.p1_title', 'No Single Score'),
      subtitle: t('principles.p1_sub', 'ไม่มีคะแนนรวม แยกเป็นหลายแกน'),
      icon: Scale,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
      description: t('principles.p1_desc'),
    },
    {
      code: 'P2',
      title: t('principles.p2_title', 'Selective Disclosure'),
      subtitle: t('principles.p2_sub', 'เลือกเปิดเผยเฉพาะ Claim ไม่ส่งมอบข้อมูลดิบ'),
      icon: Lock,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      description: t('principles.p2_desc'),
    },
    {
      code: 'P3',
      title: t('principles.p3_title', 'Insufficient Data ≠ Bad'),
      subtitle: t('principles.p3_sub', 'แยกสถานะข้อมูลไม่พอออกจากผลประเมินแย่'),
      icon: HelpCircle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      description: t('principles.p3_desc'),
    },
    {
      code: 'P4',
      title: t('principles.p4_title', 'System as Evidence-Provider'),
      subtitle: t('principles.p4_sub', 'ระบบเป็นผู้ส่งมอบหลักฐาน ไม่ใช่ผู้พิพากษา'),
      icon: FileCheck,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
      description: t('principles.p4_desc'),
    },
    {
      code: 'P5',
      title: t('principles.p5_title', 'Decay & Right to Restart'),
      subtitle: t('principles.p5_sub', 'ข้อมูลมีอายุ Expire/Decay และสิทธิ์ในการเริ่มต้นใหม่'),
      icon: RefreshCw,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20',
      description: t('principles.p5_desc'),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30 pb-20">
      {/* Top Navbar */}
      <SiteNav />

      <main className="pt-32 max-w-5xl mx-auto px-6">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-4">
            {t('principles.badge')}
          </div>
          <h1 data-fx="up" className="frl-display text-[clamp(1.8rem,4.6vw,3.2rem)] leading-[1.1] tracking-tight mb-4 text-white">
            {t('principles.title')}
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            {t('principles.subtitle')}
          </p>
        </div>

        {/* Section 1: 5 Core Principles */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
            <h2 className="text-2xl font-semibold tracking-tight"><Tr s={"5 System Principles (P1–P5)"} /></h2>
            <span className="text-xs text-slate-400 font-mono"><Tr s={"STRICT SPECIFICATION"} /></span>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {principles.map((p, index) => {
              const IconComponent = p.icon;
              return (
                <div
                  key={p.code}
                  data-fx="card"
                  style={{ ['--i' as string]: index }}
                  className={`frl-bevel-wrap frl-hoverlift ${index === 0 ? 'md:col-span-2' : ''}`}
                >
                <div className="frl-bevel h-full">
                <div className="frl-bevel-in frl-spot h-full p-6">
                  <span aria-hidden="true" className="frl-ghost">{p.code}</span>
                  {index === 0 && (
                    <div aria-hidden="true" className="pointer-events-none absolute right-8 top-1/2 hidden h-48 w-48 -translate-y-1/2 md:block">
                      <AxesArt />
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${p.bg}`}>
                        <IconComponent className={`w-5 h-5 ${p.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-slate-400 font-semibold">{p.code}</span>
                          <h3 className="text-lg font-bold text-slate-100">{p.title}</h3>
                        </div>
                        <p className="text-xs text-slate-400">{p.subtitle}</p>
                      </div>
                    </div>
                  </div>
                  <p className={`text-sm text-slate-300 leading-relaxed ${index === 0 ? 'md:pr-56' : ''}`}>{p.description}</p>
                </div>
                </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 2: Evidence Tiers Table */}
        <section>
          <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">{t('matrix.title')}</h2>
              <p className="text-xs text-slate-400 mt-1">{t('matrix.subtitle')}</p>
            </div>
            <span className="text-xs text-slate-400 font-mono"><Tr s={"EVIDENCE HIERARCHY"} /></span>
          </div>

          {/* The matrix has four columns and cannot fit a phone. It scrolls inside its
              own frame rather than being squeezed, and rather than being clipped
              by an overflow-hidden box that made the last column unreachable. */}
            <div className="frl-bevel-wrap" data-fx="up"><div className="frl-bevel"><div className="frl-bevel-in overflow-x-auto">
              <table className="w-full min-w-[34rem] text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-xs text-slate-400 font-mono uppercase tracking-wider">
                  <th className="py-4 pl-4 pr-4 sm:px-6">{t('matrix.col_tier')}</th>
                  <th className="py-4 pl-4 pr-4 sm:px-6">{t('matrix.col_source')}</th>
                  <th className="py-4 pl-4 pr-4 sm:px-6">{t('matrix.col_weight')}</th>
                  <th className="py-4 pl-4 pr-4 sm:px-6">{t('matrix.col_method')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 pl-4 pr-4 sm:px-6 font-medium">
                    <div className="flex items-center gap-2">
                      <TierBadge tier="official" />
                    </div>
                  </td>
                  <td className="py-5 pl-4 pr-4 sm:px-6">
                    <span className="text-slate-200 font-medium block"><Tr s={"Official Documents"} /></span>
                    <span className="text-xs text-slate-400">{t('matrix.official_source')}</span>
                  </td>
                  <td className="py-5 pl-4 pr-4 sm:px-6">
                    <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {t('matrix.official_weight')}
                    </span>
                  </td>
                  <td className="py-5 pl-4 pr-4 sm:px-6 text-xs text-slate-400">
                    <Tr s={"Self-declared documents. FRL records the tier and does not verify the document against an authority."} /></td>
                </tr>

                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 pl-4 pr-4 sm:px-6 font-medium">
                    <div className="flex items-center gap-2">
                      <TierBadge tier="counterparty_attested" />
                    </div>
                  </td>
                  <td className="py-5 pl-4 pr-4 sm:px-6">
                    <span className="text-slate-200 font-medium block"><Tr s={"Counterparty Attestation"} /></span>
                    <span className="text-xs text-slate-400">{t('matrix.counterparty_source')}</span>
                  </td>
                  <td className="py-5 pl-4 pr-4 sm:px-6">
                    <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {t('matrix.counterparty_weight')}
                    </span>
                  </td>
                  <td className="py-5 pl-4 pr-4 sm:px-6 text-xs text-slate-400">
                    <Tr s={"Dual digital sign-off / Direct counterparty verification link"} /></td>
                </tr>

                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 pl-4 pr-4 sm:px-6 font-medium">
                    <div className="flex items-center gap-2">
                      <TierBadge tier="public_review" />
                    </div>
                  </td>
                  <td className="py-5 pl-4 pr-4 sm:px-6">
                    <span className="text-slate-200 font-medium block"><Tr s={"Public Review"} /></span>
                    <span className="text-xs text-slate-400">{t('matrix.public_source')}</span>
                  </td>
                  <td className="py-5 pl-4 pr-4 sm:px-6">
                    <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                      {t('matrix.public_weight')}
                    </span>
                  </td>
                  <td className="py-5 pl-4 pr-4 sm:px-6 text-xs text-slate-400">
                    <Tr s={"Qualitative feedback only; strictly isolated from reputation axes"} /></td>
                </tr>
              </tbody>
            </table>
          </div></div></div>
        </section>
      </main>
    </div>
  );
}
