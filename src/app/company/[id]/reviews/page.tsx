'use client';

import { useEffect, useState, use } from 'react';
import { MessageSquare, AlertTriangle, Send, User, CornerDownRight, Lock } from 'lucide-react';
import { MOCK_COMPANIES } from '@/lib/mockData';
import { PublicReview, Company } from '@/lib/types';
import { TierBadge } from '../ProfileMotion';
import { useLanguage } from '@/lib/i18n';

import { SiteNav } from '@/components/SiteNav';
import { Tr } from '@/lib/i18n';
export default function CompanyReviewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useLanguage();

  const [company, setCompany] = useState<Company | null>(null);
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [authorName, setAuthorName] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Owner mode state
  const [isOwner, setIsOwner] = useState(false);
  const [activeRespondId, setActiveRespondId] = useState<string | null>(null);
  const [ownerResponseText, setOwnerResponseText] = useState('');
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    // Find company info
    const foundCompany = MOCK_COMPANIES.find((c) => c.id === id);
    if (foundCompany) {
      setCompany(foundCompany);
    } else {
      setCompany({
        id,
        name: `Company (${id})`,
        registration_no: '0000000000000',
        industry: 'General Enterprise',
        founded_date: '2020-01-01',
      });
    }

    // Fetch reviews from API
    fetch(`/api/reviews?company_id=${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setReviews(data);
        }
      })
      .catch((err) => console.error('Failed to load reviews:', err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: id,
          author_name: authorName,
          review_text: reviewText,
        }),
      });

      if (res.ok) {
        const created: PublicReview = await res.json();
        setReviews([created, ...reviews]);
        setReviewText('');
        setAuthorName('');
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostResponse = async (reviewId: string) => {
    if (!ownerResponseText.trim()) return;

    setResponding(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author_name: `${company?.name || 'Company'} (Owner)`,
          response_text: ownerResponseText,
        }),
      });

      if (res.ok) {
        const updated: PublicReview = await res.json();
        setReviews(reviews.map((r) => (r.id === updated.id ? updated : r)));
        setActiveRespondId(null);
        setOwnerResponseText('');
      }
    } catch (err) {
      console.error('Failed to post response:', err);
    } finally {
      setResponding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30 pb-20">
      {/* Top Navbar */}
      <SiteNav />

      <main className="pt-28 max-w-4xl mx-auto px-6">
        {/* Header & Title */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">{t('reviews.channel_title')}</span>
            {/* Owner toggle simulator */}
            <button
              onClick={() => setIsOwner(!isOwner)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                isOwner
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              {isOwner ? t('reviews.owner_mode') : t('reviews.guest_mode')}
            </button>
          </div>
          <h1 data-fx="up" className="frl-display text-[clamp(1.6rem,3.4vw,2.4rem)] leading-tight text-slate-100">{company?.name || 'Company Reviews'}</h1>
          <p className="text-slate-400 text-sm mt-1">{t('reviews.subtitle')}</p>
        </div>

        {/* FRL SPEC COMPLIANCE WARNING BANNER */}
        <div data-fx="up" className="frl-panel frl-panel-warn mb-10 flex items-start gap-3 p-4 text-xs leading-relaxed text-amber-200/90">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="block text-amber-300 font-semibold mb-1">
              {t('reviews.warning_title')}
            </strong>
            {t('reviews.warning_desc')}
          </div>
        </div>

        {/* Section 1: Submit a Public Review Form */}
        <div data-fx="scale" className="frl-panel frl-spot mb-12 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            {t('reviews.form_title')}
          </h2>
          <form onSubmit={handleCreateReview} className="space-y-4">
            <div>
              <label
                htmlFor="frl-review-author"
                className="mb-1.5 block text-caption font-medium text-fg-secondary"
              >
                {t('reviews.author_label')}
              </label>
              <input
                id="frl-review-author"
                type="text"
                placeholder={t('reviews.author_placeholder')}
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="h-11 w-full rounded-md border border-white/15 bg-black/40 px-3 text-sm text-slate-100 transition-[border-color,background-color] duration-[var(--frl-dur-fast)] placeholder:text-fg-subtle hover:border-white/25 focus:border-primary/60 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-primary/25"
              />
            </div>
            <div>
              <label
                htmlFor="frl-review-content"
                className="mb-1.5 block text-caption font-medium text-fg-secondary"
              >
                {t('reviews.content_label')}
              </label>
              <textarea
                id="frl-review-content"
                rows={3}
                required
                placeholder={t('reviews.content_placeholder')}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-slate-100 transition-[border-color,background-color] duration-[var(--frl-dur-fast)] placeholder:text-fg-subtle hover:border-white/25 focus:border-primary/60 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-primary/25"
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                {t('reviews.decay_note')}
              </span>
              <button
                type="submit"
                disabled={submitting || !reviewText.trim()}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {submitting ? t('reviews.submitting') : t('reviews.submit')}
              </button>
            </div>
          </form>
        </div>

        {/* Section 2: Review List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-xl font-semibold">{t('reviews.list_title')} ({reviews.length})</h2>
            <span className="text-xs text-slate-400"><Tr s={"Lowest Weight Tier"} /></span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm"><Tr s={"Loading reviews..."} /></div>
          ) : reviews.length === 0 ? (
            /* Neutral Empty State (Must NOT be negative or judgmental per spec) */
            <div data-fx="up" className="frl-panel p-10 text-center">
              <MessageSquare className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-slate-300 font-medium mb-1">{t('reviews.empty_title')}</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {t('reviews.empty_desc')}
              </p>
            </div>
          ) : (
            reviews.map((rev) => (
              <div
                key={rev.id}
                data-fx="up" className="frl-panel frl-spot space-y-4 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-200 text-sm">{rev.author_name}</h3>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                        <TierBadge tier="public_review" />
                        <span>•</span>
                        <span>{rev.created_at}</span>
                        <span>•</span>
                        <span className="text-slate-500 font-mono">{t('profile.expires', 'Expires:')} {rev.expires_at}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-slate-300 text-sm leading-relaxed pl-12">{rev.review_text}</p>

                {/* Owner responses thread */}
                {rev.responses && rev.responses.length > 0 && (
                  <div className="pl-12 space-y-3 pt-2">
                    {rev.responses.map((resp) => (
                      <div
                        key={resp.id}
                        className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-purple-300 font-medium">
                          <div className="flex items-center gap-1.5">
                            <CornerDownRight className="w-3.5 h-3.5 text-purple-400" />
                            <span>{resp.author_name}</span>
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-[10px]">{t('reviews.verified_owner')}</span>
                          </div>
                          <span className="text-purple-400/60 font-mono">{resp.created_at}</span>
                        </div>
                        <p className="text-slate-200 leading-relaxed pl-5">{resp.response_text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Respond button & inline form for Company Owner */}
                <div className="pl-12 pt-1 flex items-center justify-between">
                  {isOwner ? (
                    activeRespondId === rev.id ? (
                      <div className="w-full p-4 rounded-xl bg-black/40 border border-purple-500/30 space-y-3 mt-2">
                        <label className="block text-xs font-medium text-purple-300">
                          {t('reviews.respond_title')}
                        </label>
                        <textarea
                          rows={2}
                          placeholder={t('reviews.respond_placeholder')}
                          value={ownerResponseText}
                          onChange={(e) => setOwnerResponseText(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-slate-100 text-xs focus:outline-none focus:border-purple-500"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveRespondId(null);
                              setOwnerResponseText('');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 text-xs"
                          >
                            {t('reviews.cancel')}
                          </button>
                          <button
                            type="button"
                            disabled={responding || !ownerResponseText.trim()}
                            onClick={() => handlePostResponse(rev.id)}
                            className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium"
                          >
                            {responding ? t('reviews.posting') : t('reviews.post_response')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveRespondId(rev.id)}
                        className="px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <CornerDownRight className="w-3.5 h-3.5" />
                        {t('reviews.respond_btn')}
                      </button>
                    )
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">
                      {t('reviews.owner_only')}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
