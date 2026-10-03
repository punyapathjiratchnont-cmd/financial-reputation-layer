'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ShieldCheck, MessageSquare, AlertTriangle, Send, User, CornerDownRight, CheckCircle, Lock } from 'lucide-react';
import { MOCK_COMPANIES } from '@/lib/mockData';
import { PublicReview, Company } from '@/lib/types';
import { TierBadge } from '../ProfileMotion';

export default function CompanyReviewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

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
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-slate-950/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <span className="font-semibold text-lg tracking-tight">FRL</span>
          </Link>
          <Link href={`/company/${id}`} className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            ← Back to Company Profile
          </Link>
        </div>
      </nav>

      <main className="pt-28 max-w-4xl mx-auto px-6">
        {/* Header & Title */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">Public Review Channel</span>
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
              {isOwner ? 'Viewing as Company Owner (Active)' : 'Owner Login / Respond Mode'}
            </button>
          </div>
          <h1 className="text-3xl font-bold text-slate-100">{company?.name || 'Company Reviews'}</h1>
          <p className="text-slate-400 text-sm mt-1">Public feedback channel and qualitative user submissions.</p>
        </div>

        {/* FRL SPEC COMPLIANCE WARNING BANNER */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-10 text-xs text-amber-200/90 leading-relaxed flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="block text-amber-300 font-semibold mb-1">
              FRL Isolation Protocol (Rule P1 & P4 Specification)
            </strong>
            Public reviews are qualitative feedback carrying the lowest evidence tier weight (<code className="bg-black/30 px-1 py-0.5 rounded text-amber-200">public_review</code>). Reviews are <strong className="text-amber-100">strictly isolated</strong> from all financial reputation axes (Reliability, Stability, Resilience, Leverage, Track Record, Data Confidence). Reviews are <strong className="text-amber-100">never aggregated into scores</strong> or financial claim verifications.
          </div>
        </div>

        {/* Section 1: Submit a Public Review Form */}
        <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md mb-12">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            Submit a Public Review
          </h2>
          <form onSubmit={handleCreateReview} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Your Name / Organization (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Vendor B or Anonymous User"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/10 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Review Content *</label>
              <textarea
                rows={3}
                required
                placeholder="Write your feedback regarding business interaction..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-black/30 border border-white/10 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Reviews automatically expire in 1 year per P5 Decay rules.
              </span>
              <button
                type="submit"
                disabled={submitting || !reviewText.trim()}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Submitting...' : 'Submit Public Review'}
              </button>
            </div>
          </form>
        </div>

        {/* Section 2: Review List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-xl font-semibold">Public Reviews ({reviews.length})</h2>
            <span className="text-xs text-slate-400">Lowest Weight Tier</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Loading reviews...</div>
          ) : reviews.length === 0 ? (
            /* Neutral Empty State (Must NOT be negative or judgmental per spec) */
            <div className="p-10 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 text-center">
              <MessageSquare className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-slate-300 font-medium mb-1">No public reviews yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Public reviews provide qualitative context and do not impact company reputation axes or financial claim evaluations.
              </p>
            </div>
          ) : (
            reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-6 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md space-y-4"
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
                        <span>Submitted {rev.created_at}</span>
                        <span>•</span>
                        <span className="text-slate-500 font-mono">Expires: {rev.expires_at}</span>
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
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-[10px]">Verified Owner</span>
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
                          Respond as {company?.name || 'Company Owner'}
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Write official response or clarification..."
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
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={responding || !ownerResponseText.trim()}
                            onClick={() => handlePostResponse(rev.id)}
                            className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium"
                          >
                            {responding ? 'Posting...' : 'Post Owner Response'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveRespondId(rev.id)}
                        className="px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <CornerDownRight className="w-3.5 h-3.5" />
                        Respond to Review (Owner)
                      </button>
                    )
                  ) : (
                    <span className="text-[11px] text-slate-500 italic">
                      Only company owner can respond to reviews.
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
