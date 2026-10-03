'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { EvidenceTier } from '@/lib/types';
import { useLanguage } from '@/lib/i18n';

/**
 * Verified axis card. The evidence trace line draws once when scrolled into view.
 * The line carries NO value (P1/P3: there is no numeric score to draw to).
 * Content is always rendered and readable; only the line animates.
 */
export function VerifiedAxisCard({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setDrawn(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setDrawn(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-drawn={drawn}
      className="frl-axis frl-axis-verified p-6 rounded-2xl border border-white/15 bg-white/[0.07] backdrop-blur-xl shadow-lg shadow-black/20"
    >
      {children}
      <div className="frl-trace-track mt-5" aria-hidden="true">
        <div className="frl-trace-line" />
      </div>
    </div>
  );
}

/** Insufficient-data card: deliberately static, no animation of any kind. */
export function InsufficientAxisCard({ children }: { children: ReactNode }) {
  return (
    <div className="p-6 rounded-2xl border border-dashed border-slate-700 bg-slate-900/30">
      {children}
    </div>
  );
}

export function VerifiedActiveBadge() {
  const { t } = useLanguage();
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      <span className="frl-live-dot" aria-hidden="true" />
      <CheckCircle2 className="w-3 h-3 mr-1" />
      {t('profile.verified_active', 'Verified Active')}
    </span>
  );
}

const TIERS: Record<EvidenceTier, {
  label: { en: string; th: string };
  cls: string;
  title: { en: string; th: string };
  desc: { en: string; th: string };
}> = {
  official: {
    label: { en: 'Official', th: 'ทางการ (Official)' },
    cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    title: { en: 'Official Evidence', th: 'หลักฐานทางการ' },
    desc: {
      en: 'Backed by official government bodies, financial institutions, or signed tax filings. The hardest evidence to fabricate.',
      th: 'ตรวจสอบจากภาครัฐ งบการเงิน หรือเอกสารภาษี ปลอมแปลงได้ยากที่สุด',
    },
  },
  counterparty_attested: {
    label: { en: 'Counterparty', th: 'คู่ค้ายืนยัน (Counterparty)' },
    cls: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    title: { en: 'Counterparty Attested', th: 'หลักฐานยืนยันร่วมสองฝ่าย' },
    desc: {
      en: 'Explicitly signed off by a known business partner such as a supplier, buyer, or landlord.',
      th: 'รับรองร่วมกันโดยคู่ค้า ผู้ผลิต หรือผู้ให้เช่าจริง',
    },
  },
  public_review: {
    label: { en: 'Public Review', th: 'รีวิวสาธารณะ (Public Review)' },
    cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    title: { en: 'Public Review', th: 'รีวิวสาธารณะ' },
    desc: {
      en: 'Crowdsourced feedback that adds qualitative context. Never blended with official claims.',
      th: 'ความคิดเห็นจากสาธารณชน ห้ามนำไปคำนวณรวมกับ Claim ทางการ',
    },
  },
};

export function TierBadge({ tier }: { tier: EvidenceTier }) {
  const { language } = useLanguage();
  const t = TIERS[tier];
  const id = useId();
  const langKey = language === 'th' ? 'th' : 'en';

  return (
    <span className="frl-tier relative inline-flex">
      <span
        tabIndex={0}
        aria-describedby={id}
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border cursor-help ${t.cls}`}
      >
        {t.label[langKey]}
      </span>
      <span id={id} role="tooltip" className="frl-tip">
        <strong className="block text-slate-100 mb-0.5">{t.title[langKey]}</strong>
        {t.desc[langKey]}
      </span>
    </span>
  );
}
