'use client';
import { useState, use } from 'react';
import Link from 'next/link';
import { ShieldCheck, Mail, Send, Check } from 'lucide-react';
import { MOCK_COMPANIES } from '@/lib/mockData';

import { SkylineArt } from '@/components/home/Art';
import { Tr } from '@/lib/i18n';
export default function AttestRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const company = MOCK_COMPANIES.find(c => c.id === id) || MOCK_COMPANIES[0];
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30 pb-20">
      <nav className="frl-glass-nav fixed top-0 z-50 w-full">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <span className="font-semibold text-lg tracking-tight"><Tr s={"FRL Owner Portal"} /></span>
          </Link>
          <Link href={`/company/${company.id}`} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            <Tr s={"Back to Profile"} /></Link>
        </div>
      </nav>

      <main className="relative pt-32 max-w-2xl mx-auto px-6">
        <div aria-hidden="true" className="pointer-events-none absolute right-4 top-24 hidden h-24 w-48 md:block"><SkylineArt /></div>
        <h1 data-fx="up" className="frl-display text-[clamp(1.5rem,3vw,2.2rem)] leading-tight mb-4 md:max-w-[70%]"><Tr s={"Request Counterparty Attestation"} /></h1>
        <p className="text-slate-400 mb-8">
          <Tr s={"Turn your track record into verified reputation. Ask a trusted counterparty to attest to a specific business interaction. Once verified, this becomes a claim backed by the \"Counterparty Attested\" evidence tier."} /></p>

        {!sent ? (
          <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} data-fx="scale" className="frl-panel frl-spot space-y-6 p-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2"><Tr s={"Counterparty Name or Email"} /></label>
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
              <label className="block text-sm font-medium text-slate-300 mb-2"><Tr s={"Reputation Axis"} /></label>
              <select className="block w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none">
                <option value="reliability"><Tr s={"Reliability (e.g. Paid on time)"} /></option>
                <option value="resilience"><Tr s={"Resilience (e.g. Handled supply chain shock)"} /></option>
                <option value="leverage"><Tr s={"Leverage (e.g. Maintained healthy debt ratio)"} /></option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2"><Tr s={"Statement to Attest"} /></label>
              <textarea 
                required
                rows={3}
                placeholder="Paid all 12 monthly invoices for FY2023 on or before the due date."
                className="block w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <button type="submit" className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors">
              <Send className="w-5 h-5" />
              <Tr s={"Send Attestation Request"} /></button>
          </form>
        ) : (
          <div className="frl-panel frl-panel-ok p-8 text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-emerald-400 mb-2"><Tr s={"Request Sent Successfully"} /></h2>
            <p className="text-slate-300 mb-6">
              <Tr s={"Your counterparty has received a secure link to review and sign your attestation statement."} /></p>
            <Link href={`/company/${company.id}`} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors inline-block">
              <Tr s={"Return to Profile"} /></Link>
          </div>
        )}
      </main>
    </div>
  );
}
