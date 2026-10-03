import Link from 'next/link';
import { ShieldCheck, CheckCircle2, Lock, AlertTriangle, XCircle } from 'lucide-react';
import { getDb, saveDb } from '@/lib/db';
import { EvidenceTier, Claim, VerificationLink } from '@/lib/types';

export default async function VerifyPage({ params }: { params: { token: string } }) {
  const db = getDb();
  
  // Find link
  const link = db.links.find((l: VerificationLink) => l.token === params.token);
  
  // Write Audit Log
  if (link) {
    db.auditLogs.push({
      id: `audit_${Date.now()}`,
      link_token: link.token,
      action: 'viewed',
      timestamp: new Date().toISOString()
    });
    saveDb(db);
  }

  // Get associated claims
  const claims = link ? db.claims.filter((c: Claim) => link.claim_ids.includes(c.id)) : [];
  const company = db.companies.find((c: any) => c.id === (claims[0]?.company_id || 'c1'));
  
  const getTierBadge = (tier: EvidenceTier) => {
    switch (tier) {
      case 'official': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">Official</span>;
      case 'counterparty_attested': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">Counterparty</span>;
      case 'public_review': return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">Public Review</span>;
    }
  };

  if (!link) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 font-sans flex items-center justify-center">
        <div className="text-center p-8">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Invalid or Expired Link</h1>
          <p className="text-slate-400">This verification link does not exist or has expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30 pb-20">
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <span className="font-semibold text-lg tracking-tight">FRL Verification Portal</span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Lock className="w-4 h-4" />
            Secure Session
          </div>
        </div>
      </nav>

      <main className="pt-32 max-w-3xl mx-auto px-6">
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-4">Verified Claims</h1>
          <p className="text-slate-400">The following claims have been cryptographically verified and authorized for your review by <strong>{company?.name || 'Company'}</strong>.</p>
        </div>

        <div className="p-4 mb-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-4 text-amber-200 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-500 mt-0.5" />
          <p>
            You are viewing a restricted disclosure. Raw data is never exposed. The claims below are true statements backed by evidence tiers. This access has been logged in the audit trail.
          </p>
        </div>

        <div className="space-y-4">
          {claims.map((claim: Claim) => {
            const isRevoked = claim.status === 'revoked';
            const isExpired = claim.status === 'expired' || new Date(claim.expires_at) < new Date();
            const isActive = !isRevoked && !isExpired;
            
            if (isRevoked || isExpired) {
              return (
                <div key={claim.id} className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-slate-500 capitalize">{claim.axis_ref}</h3>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                      <XCircle className="w-3.5 h-3.5" />
                      {isRevoked ? 'Claim Revoked' : 'Claim Expired'}
                    </span>
                  </div>
                  <p className="text-slate-500 mt-2 text-sm italic">This claim is no longer active and cannot be relied upon.</p>
                </div>
              );
            }

            return (
              <div key={claim.id} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-indigo-300 capitalize">{claim.axis_ref}</h3>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified True
                  </span>
                </div>
                <p className="text-lg text-slate-100 mb-4">{claim.statement_text}</p>
                
                <div className="pt-4 border-t border-white/5 flex items-center gap-4 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    Evidence Level: {getTierBadge(claim.evidence_tier)}
                  </div>
                  <div>&bull;</div>
                  <div>Valid until: {new Date(claim.expires_at).toLocaleDateString()}</div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
