'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Link as LinkIcon, Check, Copy } from 'lucide-react';
import { MOCK_CLAIMS, MOCK_COMPANIES } from '@/lib/mockData';

export default function CreateClaimPage() {
  const company = MOCK_COMPANIES[0]; // Mock owner is c1
  const ownerClaims = MOCK_CLAIMS.filter(c => c.company_id === company.id && c.status === 'active');
  
  const [selectedClaims, setSelectedClaims] = useState<Set<string>>(new Set(ownerClaims.map(c => c.id)));
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  const toggleClaim = (id: string) => {
    const next = new Set(selectedClaims);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedClaims(next);
  };

  const handleGenerateLink = async () => {
    try {
      const res = await fetch('/api/links/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimIds: Array.from(selectedClaims) })
      });
      const data = await res.json();
      setGeneratedToken(data.token);
    } catch (err) {
      console.error(err);
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
          <div className="text-sm text-slate-400">Logged in as {company.name}</div>
        </div>
      </nav>

      <main className="pt-32 max-w-3xl mx-auto px-6">
        <h1 className="text-3xl font-bold mb-4">Create Verification Link</h1>
        <p className="text-slate-400 mb-8">Select the claims you want to disclose to your counterparty. They will only see the true/false status and evidence tier, not your raw data.</p>

        <div className="space-y-4 mb-8">
          {ownerClaims.map(claim => {
            const isSelected = selectedClaims.has(claim.id);
            return (
              <div 
                key={claim.id} 
                onClick={() => toggleClaim(claim.id)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${isSelected ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded flex items-center justify-center border ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-500'}`}>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div>
                    <h3 className="font-medium mb-1 capitalize text-indigo-300">{claim.axis_ref}</h3>
                    <p className="text-slate-200 text-sm mb-2">{claim.statement_text}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-black/30 border border-white/5">{claim.evidence_tier.replace('_', ' ')}</span>
                      <span>Expires: {claim.expires_at}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {!generatedToken ? (
          <button 
            onClick={handleGenerateLink}
            disabled={selectedClaims.size === 0}
            className="flex items-center justify-center gap-2 w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-medium transition-all"
          >
            <LinkIcon className="w-5 h-5" />
            Generate Unique Link
          </button>
        ) : (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <h3 className="text-emerald-400 font-medium mb-4 flex items-center gap-2">
              <Check className="w-5 h-5" />
              Link Generated Successfully
            </h3>
            <div className="flex items-center gap-3">
              <input 
                type="text" 
                readOnly 
                value={`http://localhost:3000/verify/${generatedToken}`}
                className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-slate-300 focus:outline-none"
              />
              <button 
                onClick={() => navigator.clipboard.writeText(`http://localhost:3000/verify/${generatedToken}`)}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                title="Copy to clipboard"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-400 mt-4">
              Share this link securely. Every access is logged and you can revoke it at any time.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
