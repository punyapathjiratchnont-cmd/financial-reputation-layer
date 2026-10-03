import Link from 'next/link';
import { ShieldCheck, Scale, Lock, HelpCircle, FileCheck, RefreshCw } from 'lucide-react';
import { TierBadge } from '../company/[id]/ProfileMotion';

export default function PrinciplesPage() {
  const principles = [
    {
      code: 'P1',
      title: 'No Single Score',
      subtitle: 'ไม่มีคะแนนรวม แยกเป็นหลายแกน',
      icon: Scale,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
      description:
        'FRL refuses to calculate, combine, or display a single overall score, total rating, or final grade. Business reputation is multi-dimensional and split into 6 independent axes: Reliability, Stability, Resilience, Leverage, Track Record, and Data Confidence.',
    },
    {
      code: 'P2',
      title: 'Selective Disclosure',
      subtitle: 'เลือกเปิดเผยเฉพาะ Claim ไม่ส่งมอบข้อมูลดิบ',
      icon: Lock,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      description:
        'Verification Links expose only allowed Claim assertions (True / False) and Evidence Tiers. Raw transaction data, bank balances, and internal metrics are never exposed to counterparties or third parties.',
    },
    {
      code: 'P3',
      title: 'Insufficient Data ≠ Bad',
      subtitle: 'แยกสถานะข้อมูลไม่พอออกจากผลประเมินแย่',
      icon: HelpCircle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      description:
        'Absence of evidence is never treated as negative performance. Insufficient data is presented as a neutral static state—never as 0%, red risk bars, or "bad credit". Missing data implies nothing about quality.',
    },
    {
      code: 'P4',
      title: 'System as Evidence-Provider',
      subtitle: 'ระบบเป็นผู้ส่งมอบหลักฐาน ไม่ใช่ผู้พิพากษา',
      icon: FileCheck,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
      description:
        'FRL does not render credit verdicts, assign risk ratings, or make loan decisions. The system acts strictly as an objective evidence infrastructure; counterparties evaluate the evidence themselves.',
    },
    {
      code: 'P5',
      title: 'Decay & Right to Restart',
      subtitle: 'ข้อมูลมีอายุ Expire/Decay และสิทธิ์ในการเริ่มต้นใหม่',
      icon: RefreshCw,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20',
      description:
        'All claims and public feedback carry strict expiration dates. Expired records automatically decay and are removed from active verification views, allowing businesses the right to rebuild financial reputation over time.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30 pb-20">
      {/* Top Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <span className="font-semibold text-lg tracking-tight">FRL</span>
          </Link>
          <Link href="/search" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Back to Search
          </Link>
        </div>
      </nav>

      <main className="pt-32 max-w-5xl mx-auto px-6">
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-4">
            Financial Reputation Layer Core Architecture
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Principles & Evidence Tiers
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            FRL is built on strict systemic guarantees designed to preserve financial privacy, prevent subjective credit bias, and deliver verifiable evidence for counterparties.
          </p>
        </div>

        {/* Section 1: 5 Core Principles */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
            <h2 className="text-2xl font-semibold tracking-tight">5 System Principles (P1–P5)</h2>
            <span className="text-xs text-slate-400 font-mono">STRICT SPECIFICATION</span>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {principles.map((p, index) => {
              const IconComponent = p.icon;
              return (
                <div
                  key={p.code}
                  className={`p-6 rounded-2xl border bg-white/[0.04] backdrop-blur-md transition-all hover:bg-white/[0.07] ${
                    index === 0 ? 'md:col-span-2' : ''
                  }`}
                >
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
                  <p className="text-sm text-slate-300 leading-relaxed">{p.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 2: Evidence Tiers Table */}
        <section>
          <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Evidence Tiers Matrix</h2>
              <p className="text-xs text-slate-400 mt-1">Hierarchical evidence categorization & weight distribution</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">EVIDENCE HIERARCHY</span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-xs text-slate-400 font-mono uppercase tracking-wider">
                  <th className="py-4 px-6">Tier</th>
                  <th className="py-4 px-6">Source (ที่มา)</th>
                  <th className="py-4 px-6">Weight (น้ำหนัก)</th>
                  <th className="py-4 px-6">Verification Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 px-6 font-medium">
                    <div className="flex items-center gap-2">
                      <TierBadge tier="official" />
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <span className="text-slate-200 font-medium block">Official Documents</span>
                    <span className="text-xs text-slate-400">ข้อมูลงบการเงินทางการ, e-Tax invoices, รายการภาษี หรือคดีความจากภาครัฐ</span>
                  </td>
                  <td className="py-5 px-6">
                    <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Highest Weight (สูงสุด)
                    </span>
                  </td>
                  <td className="py-5 px-6 text-xs text-slate-400">
                    Cryptographic hash / Tax authority verification
                  </td>
                </tr>

                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 px-6 font-medium">
                    <div className="flex items-center gap-2">
                      <TierBadge tier="counterparty_attested" />
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <span className="text-slate-200 font-medium block">Counterparty Attestation</span>
                    <span className="text-xs text-slate-400">ยืนยันร่วมสองฝ่ายจากคู่ค้า, ผู้ผลิต, หรือผู้ให้เช่าจริง</span>
                  </td>
                  <td className="py-5 px-6">
                    <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      Strong Weight (ปานกลาง)
                    </span>
                  </td>
                  <td className="py-5 px-6 text-xs text-slate-400">
                    Dual digital sign-off / Direct counterparty verification link
                  </td>
                </tr>

                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 px-6 font-medium">
                    <div className="flex items-center gap-2">
                      <TierBadge tier="public_review" />
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <span className="text-slate-200 font-medium block">Public Review</span>
                    <span className="text-xs text-slate-400">ผู้ใช้ทั่วไปและสาธารณชนแจ้งข้อมูลหรือความคิดเห็น</span>
                  </td>
                  <td className="py-5 px-6">
                    <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                      Lowest Weight (ต่ำสุด)
                    </span>
                    <span className="block text-[11px] text-amber-400/80 mt-1">
                      ⚠️ ห้ามนำไปคำนวณสินเชื่อ หรือผสมกับ Axis
                    </span>
                  </td>
                  <td className="py-5 px-6 text-xs text-slate-400">
                    Qualitative feedback only; strictly isolated from reputation axes
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
