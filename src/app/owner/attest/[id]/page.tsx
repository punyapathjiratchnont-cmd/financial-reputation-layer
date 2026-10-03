'use client';
import { useState, use } from 'react';
import Link from 'next/link';
import { ShieldCheck, Mail, Send, Check } from 'lucide-react';
import { MOCK_COMPANIES } from '@/lib/mockData';

export default function AttestRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const company = MOCK_COMPANIES.find(c => c.id === id) || MOCK_COMPANIES[0];
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30 pb-20">
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <span className="font-semibold text-lg tracking-tight">FRL Owner Portal</span>
          </Link>
          <Link href={`/company/${company.id}`} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Back to Profile
          </Link>
        </div>
      </nav>

      <main className="pt-32 max-w-2xl mx-auto px-6">
        <h1 className="text-3xl font-bold mb-4">Request Counterparty Attestation</h1>
        <p className="text-slate-400 mb-8">
          Turn your track record into verified reputation. Ask a trusted counterparty to attest to a specific business interaction. 
          Once verified, this becomes a claim backed by the "Counterparty Attested" evidence tier.
        </p>

        {!sent ? (
          <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-6 bg-white/5 border border-white/10 rounded-2xl p-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Counterparty Name or Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input 
                  type="text" 
                  required
                  placeholder="supplier@example.com"
                  className="block w-full pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Reputation Axis</label>
              <select className="block w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none">
                <option value="reliability">Reliability (e.g. Paid on time)</option>
                <option value="resilience">Resilience (e.g. Handled supply chain shock)</option>
                <option value="leverage">Leverage (e.g. Maintained healthy debt ratio)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Statement to Attest</label>
              <textarea 
                required
                rows={3}
                placeholder="Paid all 12 monthly invoices for FY2023 on or before the due date."
                className="block w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <button type="submit" className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors">
              <Send className="w-5 h-5" />
              Send Attestation Request
            </button>
          </form>
        ) : (
          <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-emerald-400 mb-2">Request Sent Successfully</h2>
            <p className="text-slate-300 mb-6">
              Your counterparty has received a secure link to review and sign your attestation statement.
            </p>
            <Link href={`/company/${company.id}`} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors inline-block">
              Return to Profile
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
