'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Menu, Search as SearchIcon, ShieldCheck, X } from 'lucide-react';
import { LanguageToggle, useLanguage } from '@/lib/i18n';

/**
 * Shared top bar: wordmark on the left, the main links centred, round icon
 * actions on the right. On small screens the centre links fold into a menu.
 * Destinations are the ones the old bars already linked to; nothing new.
 */
const LINKS = [
  { href: '/search', key: 'nav.findCompany', fallback: 'Find a Company' },
  { href: '/principles', key: 'nav.principles', fallback: 'Principles & Tiers' },
  { href: '/assessment', key: 'nav.assess', fallback: 'How we assess' },
  { href: '/company/c1', key: 'nav.sample', fallback: 'Sample profile' },
];

const roundBtn =
  'grid h-10 w-10 shrink-0 place-items-center rounded-full text-white transition-colors duration-[var(--frl-dur-fast)] hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-hover';

export function SiteNav() {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/company/c1' ? pathname.startsWith('/company') : pathname === href;

  return (
    <header className="frl-glass-nav fixed top-0 z-50 w-full">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:h-[4.5rem] sm:px-6 md:grid-cols-[1fr_auto_1fr] lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="FRL home">
          <span className="grid h-8 w-8 place-items-center rounded-md border border-white/15 bg-white/[0.06]">
            <ShieldCheck className="h-4 w-4 text-primary-hover" aria-hidden="true" />
          </span>
          <span className="text-xl font-semibold tracking-tight text-white">FRL</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-9 md:flex lg:gap-12">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? 'page' : undefined}
              className="frl-navlink text-[0.9375rem] font-medium text-white/90 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-hover"
            >
              {t(l.key, l.fallback)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-1.5 sm:gap-2.5">
          <Link href="/search" aria-label={t('nav.findCompany', 'Find a Company')} className={roundBtn}>
            <SearchIcon className="h-[1.15rem] w-[1.15rem]" aria-hidden="true" />
          </Link>
          <LanguageToggle />
          <Link
            href="/company/c1"
            aria-label="Workspace"
            title="Workspace"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-white ring-2 ring-white/20 transition-transform duration-[var(--frl-dur-fast)] hover:scale-105 focus-visible:outline-none focus-visible:ring-primary-hover"
          >
            <LayoutDashboard className="h-[1.1rem] w-[1.1rem]" aria-hidden="true" />
          </Link>
          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="frl-mobile-menu"
            onClick={() => setOpen((v) => !v)}
            className={`${roundBtn} md:hidden`}
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="frl-mobile-menu"
          aria-label="Main"
          className="border-t border-white/10 bg-canvas/95 px-4 pb-4 pt-2 md:hidden"
        >
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              aria-current={isActive(l.href) ? 'page' : undefined}
              className="flex min-h-12 items-center border-b border-white/[0.06] text-base font-medium text-white last:border-b-0"
            >
              {t(l.key, l.fallback)}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
