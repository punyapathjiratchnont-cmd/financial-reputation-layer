import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ShieldCheck, Building2, HelpCircle, CheckCircle2 } from 'lucide-react';
import { MOCK_COMPANIES, MOCK_AXIS_STATE } from '@/lib/mockData';
import { Axis, EvidenceTier } from '@/lib/types';

export default function CompanyProfile({ params }: { params: { id: string } }) {
  const company = MOCK_COMPANIES.find(c => c.id === params.id);
  
  if (!company) {
    notFound();
  }

  const axisStates = MOCK_AXIS_STATE[company.id] || [];

  const ALL_AXES: Axis[] = ['reliability', 'stability', 'resilience', 'leverage', 'track_record', 'data_confidence'];

  const getTierBadge = (tier: EvidenceTier) => {
    switch (tier) {
      case 'official':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">Official</span>;
      case 'counterparty_attested':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">Counterparty</span>;
      case 'public_review':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">Public Review</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30 pb-20">
      {/* Navbar */}
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

      <main className="pt-32 max-w-4xl mx-auto px-6">
        {/* Company Header */}
        <div className="flex items-start gap-6 mb-12">
          <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400">
            <Building2 className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">{company.name}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-slate-400">
              <span>Reg: {company.registration_no}</span>
              <span>&bull;</span>
              <span>{company.industry}</span>
              <span>&bull;</span>
              <span>Founded {company.founded_date}</span>
            </div>
          </div>
        </div>

        {/* Note: NO OVERALL SCORE HERE. This is strictly prohibited by Rule P1. */}

        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Reputation Axes</h2>
            <Link href="/tiers" className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300">
              <HelpCircle className="w-4 h-4" />
              What are evidence tiers?
            </Link>
          </div>

          <div className="grid gap-6">
            {ALL_AXES.map((axisName) => {
              const stateInfo = axisStates.find(a => a.axis === axisName);
              const isInsufficient = !stateInfo || stateInfo.state === 'insufficient_data';
              
              return (
                <div key={axisName} className={`p-6 rounded-2xl border backdrop-blur-sm transition-all ${isInsufficient ? 'bg-slate-900/30 border-dashed border-slate-700' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-medium capitalize">{axisName.replace('_', ' ')}</h3>
                    {isInsufficient ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                        Insufficient Data
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Verified Active
                      </span>
                    )}
                  </div>

                  {isInsufficient ? (
                    <div className="text-sm text-slate-500">
                      <p className="mb-4">Not enough evidence has been provided to establish a record for this axis. This does not indicate poor performance.</p>
                      <div className="flex items-center gap-3">
                        <Link href={`/owner/attest/${company.id}`} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 transition-colors">
                          Request Counterparty Attestation
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {stateInfo.claims.map(claim => (
                        <div key={claim.id} className="p-4 rounded-xl bg-black/20 border border-white/5">
                          <p className="text-slate-200 mb-3">{claim.statement_text}</p>
                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            {getTierBadge(claim.evidence_tier)}
                            <span>Expires: {claim.expires_at}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
