import Link from 'next/link';
import { ShieldCheck, CheckCircle2, Lock, AlertTriangle, XCircle, QrCode } from 'lucide-react';
import { getDb, saveDb, getReputationProof } from '@/lib/db';
import { EvidenceTier, Claim, VerificationLink } from '@/lib/types';

export default async function VerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = getDb();

  // 1. Check if token matches a ReputationProof
  const proof = getReputationProof(token);

  if (proof) {
    const isExpiredByTime = new Date(proof.expiresAt) < new Date();
    const effectiveStatus = isExpiredByTime ? 'expired' : proof.status;

    return (
      <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30 pb-20">
        <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
              <span className="font-semibold text-lg tracking-tight">FRL Verification Portal</span>
            </Link>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Lock className="w-4 h-4 text-emerald-400" />
              Privacy-Preserving Proof
            </div>
          </div>
        </nav>

        <main className="pt-28 max-w-xl mx-auto px-6">
          <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-2xl space-y-6 text-center">
            <div className="flex items-center justify-center gap-2 text-indigo-400 text-xs font-semibold tracking-wider uppercase">
              <ShieldCheck className="w-4 h-4" />
              FRL Verification Portal
            </div>

            <h1 className="text-2xl font-extrabold text-slate-100">
              Financial Reputation Verification
            </h1>

            {/* Status Alert Banners */}
            {effectiveStatus === 'revoked' && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm space-y-1">
                <div className="font-bold flex items-center justify-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-400" />
                  REVOKED PROOF
                </div>
                <p>This reputation proof has been revoked by its owner.</p>
              </div>
            )}

            {effectiveStatus === 'expired' && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm space-y-1">
                <div className="font-bold flex items-center justify-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  EXPIRED PROOF
                </div>
                <p>This reputation proof has expired.</p>
              </div>
            )}

            {effectiveStatus === 'active' && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-widest uppercase">
                <CheckCircle2 className="w-4 h-4" />
                VERIFIED ACTIVE
              </div>
            )}

            {/* Score & Level Header */}
            <div className="py-4 border-y border-white/10 space-y-2">
              <div className="text-6xl font-black text-white tracking-tight">
                {proof.score}
              </div>
              <div className="text-lg font-bold text-indigo-400 tracking-wider uppercase">
                {proof.level}
              </div>
            </div>

            {/* Factor Breakdown Grid */}
            <div className="space-y-3 text-left pt-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center mb-4">
                Selected Reputation Factors
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
                  <span className="text-slate-400 text-xs font-medium">Payment Reliability</span>
                  <span className="text-slate-100 font-bold mt-1 text-base">{proof.factorSummary.paymentReliability}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
                  <span className="text-slate-400 text-xs font-medium">Income Consistency</span>
                  <span className="text-slate-100 font-bold mt-1 text-base">{proof.factorSummary.incomeConsistency}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
                  <span className="text-slate-400 text-xs font-medium">Spending Stability</span>
                  <span className="text-slate-100 font-bold mt-1 text-base">{proof.factorSummary.spendingStability}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
                  <span className="text-slate-400 text-xs font-medium">Saving Behavior</span>
                  <span className="text-slate-100 font-bold mt-1 text-base">{proof.factorSummary.savingBehavior}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
                  <span className="text-slate-400 text-xs font-medium">Debt Behavior</span>
                  <span className="text-slate-100 font-bold mt-1 text-base">{proof.factorSummary.debtBehavior}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
                  <span className="text-slate-400 text-xs font-medium">Transaction History</span>
                  <span className="text-slate-100 font-bold mt-1 text-base">{proof.factorSummary.transactionHistory}</span>
                </div>
              </div>
            </div>

            {/* Verification Metadata & QR Code */}
            <div className="pt-6 border-t border-white/10 space-y-4 text-xs text-slate-400">
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>✓ Verified by FRL</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center py-2.5 px-4 rounded-xl bg-black/30 border border-white/5">
                <div>
                  <span className="block text-slate-500 text-[10px] uppercase">Verified Date</span>
                  <span className="text-slate-200 font-semibold">{new Date(proof.verifiedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div>
                  <span className="block text-slate-500 text-[10px] uppercase">Expiration Date</span>
                  <span className="text-slate-200 font-semibold">{new Date(proof.expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              {/* QR Code */}
              <div className="pt-2 flex flex-col items-center justify-center gap-2">
                <div className="p-2 rounded-xl bg-white inline-block shadow-md">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(`https://financial-reputation-layer.vercel.app/verify/${proof.id}`)}`}
                    alt="Scan to verify reputation"
                    className="w-28 h-28"
                  />
                </div>
                <span className="text-[11px] text-slate-500">Scan to verify reputation</span>
              </div>

              {/* Privacy-First Notes */}
              <div className="space-y-1.5 text-slate-400 text-[11px] leading-relaxed pt-3 border-t border-white/5">
                <p>Verified reputation as of {new Date(proof.verifiedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}.</p>
                <p className="italic text-slate-400">Reputation is a snapshot and may change after the verification date.</p>
                <p className="text-indigo-300 font-medium">Your financial details are never exposed through this verification link.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 2. Check for Claims Verification Link
  const link = db.links.find((l: VerificationLink) => l.token === token);
  
  if (link) {
    db.auditLogs.push({
      id: `audit_${Date.now()}`,
      link_token: link.token,
      action: 'viewed',
      timestamp: new Date().toISOString()
    });
    saveDb(db);
  }

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
