'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Settings2, Trash2, Clock, CheckCircle2, History } from 'lucide-react';
import { MOCK_CLAIMS, MOCK_COMPANIES } from '@/lib/mockData';
import { Claim } from '@/lib/types';

export default function ManageClaimsPage() {
  const company = MOCK_COMPANIES[0];
  const [claims, setClaims] = useState<Claim[]>([]);

  useEffect(() => {
    fetch('/api/claims').then(res => res.json()).then(data => {
      setClaims(data.claims.filter((c: Claim) => c.company_id === company.id));
    });
  }, [company.id]);

  const handleRevoke = async (id: string) => {
    await fetch('/api/claims/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claimId: id })
    });
    setClaims(claims.map(c => c.id === id ? { ...c, status: 'revoked', revoked_at: new Date().toISOString() } : c));
  };

  const getStatusBadge = (status: Claim['status']) => {
    switch (status) {
      case 'active': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle2 className="w-3 h-3"/> Active</span>;
      case 'expired': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20"><Clock className="w-3 h-3"/> Expired</span>;
      case 'revoked': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20"><Trash2 className="w-3 h-3"/> Revoked</span>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30 pb-20">
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <span className="font-semibold text-lg tracking-tight">FRL Owner Portal</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/owner/create-claim" className="text-sm font-medium text-slate-300 hover:text-white">
              Create New Link
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 max-w-4xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Manage Claims</h1>
            <p className="text-slate-400">View and revoke active claims. Revoked claims immediately stop resolving via verification links.</p>
          </div>
          <Settings2 className="w-8 h-8 text-slate-600" />
        </div>

        <div className="space-y-4">
          {claims.map(claim => (
            <div key={claim.id} className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-medium text-indigo-300 capitalize">{claim.axis_ref}</h3>
                  {getStatusBadge(claim.status)}
                </div>
                <p className="text-slate-200 mb-4">{claim.statement_text}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400">
                  <span>Created: {claim.created_at}</span>
                  <span>Expires: {claim.expires_at}</span>
                  {claim.revoked_at && <span className="text-red-400">Revoked on: {claim.revoked_at}</span>}
                </div>
              </div>

              <div className="flex flex-col gap-2 min-w-[140px]">
                {claim.status === 'active' && (
                  <button 
                    onClick={() => handleRevoke(claim.id)}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors border border-red-500/20"
                  >
                    Revoke Access
                  </button>
                )}
                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <History className="w-4 h-4" />
                  Audit Log
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
