'use client';

import { useEffect, useRef } from 'react';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Tr } from '@/lib/i18n';

/**
 * Notice shown once per visit, after the city walk. It blocks the page until it
 * is accepted: the page behind cannot be scrolled, Escape does not dismiss it,
 * and keyboard focus stays on the button. Acceptance is remembered for the
 * current browser session only (see CityJourney), so opening the site anew shows
 * it again.
 */
export function TermsDialog({ onAccept }: { onAccept: () => void }) {
  const button = useRef<HTMLButtonElement>(null);
  const link = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    button.current?.focus();
    // focus cannot leave the dialog: the button is its only control
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        button.current?.focus();
      }
      if (e.key === 'Tab') {
        // cycle between the two controls only
        const items = [button.current, link.current].filter(Boolean) as HTMLElement[];
        const at = items.indexOf(document.activeElement as HTMLElement);
        e.preventDefault();
        items[(at + (e.shiftKey ? items.length - 1 : 1)) % items.length]?.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.documentElement.style.overflow = prev;
      document.removeEventListener('keydown', onKey, true);
    };
  }, []);

  return (
    <div className="frl-terms-overlay" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="frl-terms-title"
        aria-describedby="frl-terms-body"
        className="frl-terms-wrap"
      >
        <div className="frl-bevel">
          <div className="frl-bevel-in frl-spot p-6 sm:p-9">
            <span aria-hidden="true" className="frl-ghost">
              FRL
            </span>
            <div className="flex items-center gap-3 text-primary-hover">
              <ShieldAlert className="h-5 w-5" aria-hidden="true" />
              <p className="text-label">
                <Tr s="FRL Reputation Assessment" />
              </p>
            </div>
            <h2 id="frl-terms-title" className="frl-display mt-4 text-[clamp(1.5rem,3.4vw,2.2rem)] leading-tight text-white">
              <Tr s="What is the FRL Score?" />
            </h2>

            <div id="frl-terms-body" className="mt-6 space-y-4 text-body leading-relaxed text-fg-secondary">
              <p>
                <Tr s="FRL does not say who is “good” or “bad”, and does not guarantee that any company is 100% trustworthy." />
              </p>
              <p>
                <Tr s="FRL is an assessment based on the data and evidence available at the time of assessment, to help users read the overall picture of a reputation more easily." />
              </p>
              <p className="border-l-2 border-primary pl-4 text-white">
                <Tr s="An FRL assessment should not be the only criterion for any business decision, extending credit, or any transaction." />
              </p>
            </div>

            <button
              ref={button}
              type="button"
              onClick={onAccept}
              className="mt-8 inline-flex h-12 w-full items-center justify-center bg-primary-active px-6 text-sm font-semibold text-white transition-[background-color,transform] duration-[var(--frl-dur-fast)] hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-canvas active:translate-y-px sm:w-auto"
            >
              <Tr s="I understand and agree" />
            </button>
            <Link
              ref={link}
              href="/assessment"
              className="mt-4 block text-body-sm text-primary-hover underline-offset-4 hover:text-white hover:underline sm:ml-5 sm:mt-0 sm:inline-block"
            >
              <Tr s="Read how FRL assesses" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
