import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ShieldCheck, Building2, HelpCircle, MessageSquare } from 'lucide-react';
import { MOCK_COMPANIES, MOCK_AXIS_STATE } from '@/lib/mockData';
import { Axis } from '@/lib/types';
import { VerifiedAxisCard, InsufficientAxisCard, VerifiedActiveBadge, TierBadge } from './ProfileMotion';

export default async function CompanyProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = MOCK_COMPANIES.find(c => c.id === id);
  
  if (!company) {
    notFound();
  }

  const axisStates = MOCK_AXIS_STATE[company.id] || [];

  const ALL_AXES: Axis[] = ['reliability', 'stability', 'resilience', 'leverage', 'track_record', 'data_confidence'];


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
            <Link href="/principles" className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300">
              <HelpCircle className="w-4 h-4" />
              What are evidence tiers?
            </Link>
          </div>

          <div className="grid gap-6">
            {ALL_AXES.map((axisName) => {
              const stateInfo = axisStates.find(a => a.axis === axisName);
              const isInsufficient = !stateInfo || stateInfo.state === 'insufficient_data';
              
              const Card = isInsufficient ? InsufficientAxisCard : VerifiedAxisCard;
              return (
                <Card key={axisName}>
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-medium capitalize">{axisName.replace('_', ' ')}</h3>
                    {isInsufficient ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                        Insufficient Data
                      </span>
                    ) : (
                      <VerifiedActiveBadge />
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
                            <TierBadge tier={claim.evidence_tier} />
                            <span>Expires: {claim.expires_at}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Separate Section for Public Reviews (Isolated from Axes per P1 & P4) */}
          <div className="mt-12 p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <h3 className="text-base font-semibold text-slate-200">Public Reviews Channel</h3>
              </div>
              <p className="text-xs text-slate-400">
                Qualitative user feedback channel. Strictly isolated from financial reputation axes (P1 & P4).
              </p>
            </div>
            <Link
              href={`/company/${company.id}/reviews`}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-sm font-medium transition-colors shrink-0 flex items-center gap-1.5"
            >
              View Public Reviews →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

