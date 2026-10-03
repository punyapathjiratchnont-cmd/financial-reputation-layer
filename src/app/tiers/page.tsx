import Link from 'next/link';
import { ShieldCheck, CheckCircle2, Users, Building2, HelpCircle } from 'lucide-react';

export default function TiersPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30 pb-20">
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <span className="font-semibold text-lg tracking-tight">FRL Documentation</span>
          </Link>
        </div>
      </nav>

      <main className="pt-32 max-w-3xl mx-auto px-6">
        <div className="flex items-center gap-3 mb-4">
          <HelpCircle className="w-8 h-8 text-indigo-400" />
          <h1 className="text-3xl font-bold">Understanding Evidence Tiers</h1>
        </div>
        <p className="text-slate-400 mb-12 text-lg">
          Not all reputation claims are created equal. FRL uses Evidence Tiers to transparently communicate the weight and source of a claim, allowing counterparties to make their own risk assessments.
        </p>

        <div className="space-y-6">
          {/* Official Tier */}
          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-full -mr-8 -mt-8" />
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold">Official Evidence</h2>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">Highest Weight</span>
                </div>
                <p className="text-slate-300 leading-relaxed mb-4">
                  Data backed by official government bodies, standardized financial institutions, or cryptographically signed tax filings. This is the hardest evidence to fabricate.
                </p>
                <div className="bg-black/30 rounded-lg p-4 border border-white/5 text-sm text-slate-400">
                  <strong className="text-slate-200 block mb-1">Example:</strong>
                  Revenue figures extracted automatically from signed e-Tax invoices.
                </div>
              </div>
            </div>
          </div>

          {/* Counterparty Attested Tier */}
          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-full -mr-8 -mt-8" />
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold">Counterparty Attested</h2>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">Strong Weight</span>
                </div>
                <p className="text-slate-300 leading-relaxed mb-4">
                  Specific, verifiable claims that have been explicitly signed off by a known business partner (supplier, buyer, or landlord). 
                </p>
                <div className="bg-black/30 rounded-lg p-4 border border-white/5 text-sm text-slate-400">
                  <strong className="text-slate-200 block mb-1">Example:</strong>
                  A landlord confirming 12 consecutive months of on-time rent payments.
                </div>
              </div>
            </div>
          </div>

          {/* Public Review Tier */}
          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/10 rounded-bl-full -mr-8 -mt-8" />
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-500/20 text-slate-400 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold">Public Review</h2>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">Contextual Weight</span>
                </div>
                <p className="text-slate-300 leading-relaxed mb-4">
                  Crowdsourced reviews and general feedback. While less rigorous than official records, these provide qualitative context about business practices. They are never blended with official claims.
                </p>
                <div className="bg-black/30 rounded-lg p-4 border border-white/5 text-sm text-slate-400">
                  <strong className="text-slate-200 block mb-1">Example:</strong>
                  A contractor leaving a 5-star rating for ease of communication.
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
