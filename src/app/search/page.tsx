'use client';

import Link from 'next/link';
import { Search as SearchIcon, ShieldCheck, Building2 } from 'lucide-react';
import { MOCK_COMPANIES, MOCK_AXIS_STATE } from '@/lib/mockData';
import { useLanguage, LanguageToggle } from '@/lib/i18n';

export default function SearchPage() {
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
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <Link href="/principles" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              {t('nav.principles', 'Principles & Tiers')}
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-16 max-w-4xl mx-auto px-6">
        <h1 className="text-3xl font-bold mb-8">{t('common.search', 'Find a Company')}</h1>
        
        <div className="relative mb-12">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-slate-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            placeholder={t('common.searchPlaceholder', 'Search by company name or 13-digit registration number...')}
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Results</h2>
          
          {MOCK_COMPANIES.map((company) => {
            const axes = MOCK_AXIS_STATE[company.id] || [];
            const hasDataCount = axes.filter(a => a.state === 'has_data').length;
            const isDataSufficient = hasDataCount >= 2;

            return (
              <Link key={company.id} href={`/company/${company.id}`} className="block group">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-all hover:bg-white/[0.07]">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-colors">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{company.name}</h3>
                        <p className="text-sm text-slate-400">{t('common.reg', 'Reg:')} {company.registration_no} &bull; {company.industry}</p>
                      </div>
                    </div>
                    <div>
                      {isDataSufficient ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Sufficient Data
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {t('profile.insufficient_badge', 'Insufficient Data')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  );
}
