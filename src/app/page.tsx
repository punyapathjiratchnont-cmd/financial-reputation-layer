'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search as SearchIcon, ShieldCheck, Building2, ArrowRight, Award, CheckCircle2 } from 'lucide-react';
import { MOCK_COMPANIES } from '@/lib/mockData';
import { useLanguage, LanguageToggle } from '@/lib/i18n';

export default function Home() {
  const { t } = useLanguage();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/search');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <span className="font-semibold text-lg tracking-tight">FRL</span>
          </Link>
          <div className="flex items-center gap-6">
            <LanguageToggle />
            <Link href="/search" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              {t('nav.findCompany', 'Search Companies')}
            </Link>
            <Link href="/principles" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              {t('nav.principles', 'Principles')}
            </Link>
            <Link href="/company/c1" className="text-sm font-semibold px-4 py-2 rounded-xl bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition-all">
              My Company Profile
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <Building2 className="w-4 h-4 text-indigo-400" />
            B2B Business Reputation Platform
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-4 text-white">
            Business Reputation Directory
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Search for a company to inspect verified business reputation signals, payment track records, and financial stability.
          </p>

          {/* SECTION 2: HERO SEARCH BOX */}
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto mb-12">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <SearchIcon className="h-6 w-6 text-indigo-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search company by name or registration ID (e.g. Toyota, TechFlow, 01055...)"
                className="block w-full pl-14 pr-36 py-5 bg-slate-900/90 border border-white/15 rounded-2xl text-slate-100 placeholder-slate-500 text-base shadow-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/80 focus:border-indigo-500 transition-all"
              />
              <button
                type="submit"
                className="absolute right-2.5 top-2.5 bottom-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg flex items-center gap-2"
              >
                Search
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Quick Search Tags */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
            <span className="font-semibold text-slate-500">Popular Searches:</span>
            {MOCK_COMPANIES.map((c) => (
              <Link
                key={c.id}
                href={`/company/${c.id}`}
                className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-indigo-500/40 hover:bg-white/10 text-slate-300 transition-all flex items-center gap-1.5"
              >
                <span>{c.logo || '🏢'}</span>
                <span>{c.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Concept Features */}
      <section className="py-16 bg-slate-900/60 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                <SearchIcon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100 mb-2">1. Search & Discover</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Find any company by corporate registration number or business name in seconds.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100 mb-2">2. Business Reputation Score</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Evaluate payment reliability, business track record, and financial stability on a transparent 0–1000 scale.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100 mb-2">3. Verified Evidence</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Inspect underlying verified records, data sources, current issues, and information gaps.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
