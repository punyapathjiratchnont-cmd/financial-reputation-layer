'use client';

import Link from 'next/link';
import { Search, ShieldCheck, PieChart, Users, Key } from 'lucide-react';
import { useLanguage, LanguageToggle } from '@/lib/i18n';

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <span className="font-semibold text-lg tracking-tight">FRL</span>
          </Link>
          <div className="flex items-center gap-6">
            <LanguageToggle />
            <Link href="/principles" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              {t('nav.principles', 'Principles & Tiers')}
            </Link>
            <Link href="/search" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              {t('nav.findCompany', 'Find a Company')}
            </Link>
            <Link href="/owner/manage-claims" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              {t('nav.forOwners', 'For Owners')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-16 sm:pt-40 sm:pb-24 lg:pb-32 overflow-hidden">
        {/* Decorative background blur */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            {t('home.badge', 'System Specification Demo')}
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-8 text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500">
            {t('home.title', 'Financial Reputation Layer')}
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-400 mb-10 leading-relaxed">
            {t('home.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/search" className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-medium transition-all shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)]">
              <Search className="w-5 h-5" />
              {t('home.searchBtn', 'Search Companies')}
            </Link>
            <Link href="/owner/manage-claims" className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full font-medium transition-all">
              <Key className="w-5 h-5" />
              {t('home.ownerBtn', 'Owner Portal')}
            </Link>
          </div>
        </div>
      </main>

      {/* Concept Section */}
      <section className="py-20 bg-slate-900/50 border-y border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">{t('home.corePrinciples', 'Core Principles')}</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">{t('home.coreSub')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
                <PieChart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{t('principles.p1_title', 'No Single Score')}</h3>
              <p className="text-slate-400 leading-relaxed">{t('principles.p1_desc')}</p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{t('principles.p2_title', 'Selective Disclosure')}</h3>
              <p className="text-slate-400 leading-relaxed">{t('principles.p2_desc')}</p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{t('principles.p3_title', 'Insufficient Data ≠ Bad')}</h3>
              <p className="text-slate-400 leading-relaxed">{t('principles.p3_desc')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
