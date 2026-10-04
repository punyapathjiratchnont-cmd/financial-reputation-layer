import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  AlertTriangle,
  Eye,
  Clock,
  Building2,
  FileText,
} from 'lucide-react';
import { getDb, saveDb, getReputationProof, getReputationShare } from '@/lib/db';
import { getCompanyById } from '@/lib/realCompanyService';
import { EvidenceTier, Claim, VerificationLink, FactorSummary } from '@/lib/types';
import { Badge, Button, Container } from '@/components/ui';

/**
 * FRL verification portal — UI Phase 6.
 *
 * PRESENTATION ONLY. Every status decision below is the decision the page made
 * before this redesign: token resolution order, the expiry and revocation
 * checks, the `effectiveStatus !== 'active'` gate that withholds a score, the
 * controlled-disclosure levels, and the audit log write. None of them were
 * touched. What changed is how those states are shown.
 *
 * Two rules shape the presentation:
 *
 *   1. A proof that is not active is never shown a score, a level or a factor
 *      breakdown. The gate that enforced that still does; the visual states
 *      below simply make it obvious.
 *   2. The page states only what FRL can actually know. There is no blockchain
 *      claim, no "cryptographically verified" claim and no security badge,
 *      because FRL does none of those things. A verification page that
 *      overstates its own guarantees is worse than one that does not make any.
 */

/** The six factors a proof can summarise, in the engine's own order. */
const FACTOR_ROWS: Array<{ key: keyof FactorSummary; label: string }> = [
  { key: 'paymentReliability', label: 'Payment Reliability' },
  { key: 'incomeConsistency', label: 'Income Consistency' },
  { key: 'spendingStability', label: 'Spending Stability' },
  { key: 'savingBehavior', label: 'Saving Behavior' },
  { key: 'debtBehavior', label: 'Debt Behavior' },
  { key: 'transactionHistory', label: 'Transaction History' },
];

const DISCLOSURE_LABEL: Record<string, string> = {
  score_only: 'Score only',
  score_and_level: 'Score and level',
  score_and_factors: 'Score, level and factors',
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

/**
 * Resolves the company a proof belongs to.
 *
 * Returns null rather than a placeholder name when the owner cannot be
 * resolved, so the page can say "Not reported" instead of implying an identity
 * it does not have.
 */
async function resolveCompanyName(ownerUserId: string | undefined): Promise<string | null> {
  if (!ownerUserId) return null;
  const result = await getCompanyById(ownerUserId);
  return result.status === 'found' ? result.company.name : null;
}

function FactorGrid({ factors }: { factors: FactorSummary }) {
  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {FACTOR_ROWS.map(({ key, label }) => (
        <div
          key={key}
          className="flex flex-col justify-between gap-1 rounded-md border border-white/[0.08] bg-white/[0.02] p-3.5"
        >
          <dt className="text-caption text-fg-muted">{label}</dt>
          <dd className="text-body-sm font-semibold text-slate-100">{factors[key]}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Portal chrome. Identical across every state so the frame never changes. */
function PortalShell({
  context,
  children,
}: {
  context: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas pb-20 font-sans text-fg antialiased selection:bg-primary-soft">
      <nav className="frl-glass-nav fixed top-0 z-50 w-full">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="FRL home">
            <span className="grid h-8 w-8 place-items-center rounded-md border border-white/10 bg-white/[0.04]">
              <ShieldCheck className="h-4 w-4 text-primary-hover" aria-hidden="true" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-[0.9375rem] font-semibold tracking-tight text-white">FRL</span>
              <span className="mt-0.5 text-[0.5625rem] uppercase tracking-[0.14em] text-fg-subtle">
                Verification
              </span>
            </span>
          </Link>
          <span className="flex min-w-0 items-center gap-2 text-caption text-fg-muted">
            <Lock className="h-3.5 w-3.5 shrink-0 text-fg-subtle" aria-hidden="true" />
            <span className="truncate">{context}</span>
          </span>
        </div>
      </nav>

      <main className="pt-28">
        <Container width="read">{children}</Container>
      </main>
    </div>
  );
}

/** The headline verdict. Exactly one of these renders per request. */
function Verdict({
  tone,
  title,
  children,
}: {
  tone: 'success' | 'danger' | 'warning' | 'insufficient';
  title: string;
  children?: React.ReactNode;
}) {
  const badgeTone =
    tone === 'success' ? 'success' : tone === 'danger' ? 'danger' : tone === 'warning' ? 'warning' : 'insufficient';
  const badgeText =
    tone === 'success'
      ? 'Valid proof'
      : tone === 'danger'
        ? 'Invalid proof'
        : tone === 'warning'
          ? 'No longer valid'
          : 'Insufficient data';

  return (
    <div className="text-center">
      <Badge tone={badgeTone} size="md" dot className="mx-auto">
        {badgeText}
      </Badge>
      <h1 className="mt-4 text-h2 text-white">{title}</h1>
      {children ? <p className="mx-auto mt-3 max-w-lg text-body-sm text-fg-muted">{children}</p> : null}
    </div>
  );
}

export default async function VerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = getDb();

  // ==========================================================================
  // 1. Controlled selective disclosure (a share link)
  // ==========================================================================
  const share = getReputationShare(token);
  if (share) {
    const proof = getReputationProof(share.proofId);

    // Evaluated server-side, unchanged from before this redesign.
    const isShareExpired = new Date(share.expiresAt) < new Date();
    const isProofExpired = proof ? new Date(proof.expiresAt) < new Date() : true;
    const isRevoked = share.status === 'revoked' || (proof && proof.status === 'revoked');
    const isExpired =
      isShareExpired ||
      isProofExpired ||
      share.status === 'expired' ||
      (proof && proof.status === 'expired');
    const isActive = !isRevoked && !isExpired && proof && proof.status === 'active';

    const companyName = await resolveCompanyName(proof?.ownerUserId);

    return (
      <PortalShell context="Controlled disclosure">
        <div className="space-y-6">
          {isRevoked ? (
            <Verdict tone="danger" title="Disclosure revoked">
              The owner of this reputation revoked the link. It is no longer a valid disclosure, so
              FRL shows no reputation data for it.
            </Verdict>
          ) : isExpired ? (
            <Verdict tone="warning" title="Disclosure expired">
              This disclosure link has passed its expiry date. It is no longer valid, so FRL shows no
              reputation data for it.
            </Verdict>
          ) : isActive ? (
            <Verdict tone="success" title="Controlled disclosure">
              The reputation owner chose what to disclose from this link. FRL displays only what the
              link is configured to release.
            </Verdict>
          ) : (
            <Verdict tone="insufficient" title="Disclosure unavailable">
              The proof behind this link is not active. FRL shows no reputation data for it.
            </Verdict>
          )}

          <div className="rounded-lg border border-white/10 bg-slate-900 p-5 shadow-[var(--shadow-surface)] sm:p-7">
            {/* Identity. Reported as unknown when it cannot be resolved. */}
            <dl className="space-y-3 border-b border-white/[0.06] pb-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <dt className="flex items-center gap-2 text-caption text-fg-muted">
                  <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Company
                </dt>
                <dd className="text-body-sm font-medium text-slate-100">
                  {isActive ? companyName ?? 'Not reported' : 'Not disclosed'}
                </dd>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <dt className="flex items-center gap-2 text-caption text-fg-muted">
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  Disclosure level
                </dt>
                <dd className="text-body-sm font-medium text-slate-100">
                  {DISCLOSURE_LABEL[share.disclosureLevel] ?? share.disclosureLevel}
                </dd>
              </div>
            </dl>

            {isActive && proof ? (
              <>
                <div className="border-b border-white/[0.06] py-7 text-center">
                  <span className="text-label text-fg-subtle">Disclosed reputation score</span>
                  <div className="mt-2 flex items-baseline justify-center gap-3">
                    <span className="text-metric text-white">{proof.score}</span>
                    <span className="text-body-sm text-fg-muted">/ 850</span>
                  </div>
                  {(share.disclosureLevel === 'score_and_level' ||
                    share.disclosureLevel === 'score_and_factors') && (
                    <p className="mt-2 text-h4 uppercase tracking-[0.08em] text-primary-hover">
                      {proof.level}
                    </p>
                  )}
                </div>

                {share.disclosureLevel === 'score_and_factors' && (
                  <div className="py-6">
                    <h2 className="mb-4 text-center text-label text-fg-subtle">
                      Disclosed reputation factors
                    </h2>
                    <FactorGrid factors={proof.factorSummary} />
                  </div>
                )}
              </>
            ) : (
              <p className="py-8 text-center text-body-sm text-fg-subtle">
                No reputation score, level or factor result is shown for this link.
              </p>
            )}

            {proof && (
              <dl className="grid grid-cols-1 gap-3 border-t border-white/[0.06] pt-5 sm:grid-cols-3">
                <div>
                  <dt className="text-caption text-fg-subtle">Verified</dt>
                  <dd className="mt-0.5 text-body-sm font-medium text-slate-100">
                    {formatDate(proof.verifiedAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-caption text-fg-subtle">Link expires</dt>
                  <dd className="mt-0.5 text-body-sm font-medium text-slate-100">
                    {formatDate(share.expiresAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-caption text-fg-subtle">Evidence policy</dt>
                  <dd className="mt-0.5 text-body-sm font-medium text-slate-100">
                    {proof.policyVersion ?? 'Not reported'}
                  </dd>
                </div>
              </dl>
            )}
          </div>

          <p className="text-center text-caption leading-relaxed text-fg-subtle">
            This information was selectively shared by the reputation owner. No raw financial
            information is exposed through this link.
          </p>
        </div>
      </PortalShell>
    );
  }

  // ==========================================================================
  // 2. Full reputation proof
  // ==========================================================================
  const proof = getReputationProof(token);

  if (proof) {
    const isExpiredByTime = new Date(proof.expiresAt) < new Date();
    const effectiveStatus = isExpiredByTime ? 'expired' : proof.status;

    // A proof that is not active is never rendered with a score, a level, a
    // factor breakdown, a QR code or a "Verified by FRL" claim. This gate is
    // the reason those things cannot appear below, and it is unchanged.
    if (effectiveStatus !== 'active') {
      const revoked = effectiveStatus === 'revoked';
      const companyName = await resolveCompanyName(proof.ownerUserId);

      return (
        <PortalShell context={revoked ? 'Revoked proof' : 'Expired proof'}>
          <div className="space-y-6">
            <Verdict tone={revoked ? 'danger' : 'warning'} title={revoked ? 'Proof revoked' : 'Proof expired'}>
              {revoked
                ? 'This reputation proof was revoked, so it is no longer a valid verification. FRL displays no score, level or factor result for it.'
                : 'This reputation proof has passed its expiry date, so it is no longer a valid verification. FRL displays no score, level or factor result for it.'}
            </Verdict>

            <dl className="space-y-3 rounded-lg border border-white/10 bg-slate-900 p-5 shadow-[var(--shadow-surface)]">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <dt className="text-caption text-fg-muted">Company</dt>
                <dd className="text-body-sm font-medium text-slate-100">{companyName ?? 'Not reported'}</dd>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <dt className="text-caption text-fg-muted">Verified</dt>
                <dd className="text-body-sm font-medium text-slate-100">{formatDate(proof.verifiedAt)}</dd>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <dt className="text-caption text-fg-muted">Expired</dt>
                <dd className="text-body-sm font-medium text-slate-100">{formatDate(proof.expiresAt)}</dd>
              </div>
            </dl>

            <p className="text-center text-caption leading-relaxed text-fg-subtle">
              FRL only displays a score, a level and factor results for a proof that is active and was
              produced under the current reputation evidence policy.
            </p>

            <div className="flex justify-center">
              <Link href="/search">
                <Button variant="secondary">Back to company search</Button>
              </Link>
            </div>
          </div>
        </PortalShell>
      );
    }

    const companyName = await resolveCompanyName(proof.ownerUserId);

    return (
      <PortalShell context="Reputation proof">
        <div className="space-y-6">
          <Verdict tone="success" title="Reputation proof">
            This proof is active. FRL displays the reputation it recorded at the verification date
            below, and nothing else.
          </Verdict>

          <div className="rounded-lg border border-white/10 bg-slate-900 p-5 shadow-[var(--shadow-surface)] sm:p-7">
            <dl className="space-y-3 border-b border-white/[0.06] pb-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <dt className="flex items-center gap-2 text-caption text-fg-muted">
                  <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Company
                </dt>
                <dd className="text-body-sm font-medium text-slate-100">{companyName ?? 'Not reported'}</dd>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <dt className="flex items-center gap-2 text-caption text-fg-muted">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Proof reference
                </dt>
                <dd className="font-mono text-body-sm text-slate-200">
                  {proof.id.replace(/^proof_/, '').slice(0, 12)}
                </dd>
              </div>
            </dl>

            <div className="border-b border-white/[0.06] py-7 text-center">
              <span className="text-label text-fg-subtle">Reputation score</span>
              <div className="mt-2 flex items-baseline justify-center gap-3">
                <span className="text-metric text-white">{proof.score}</span>
                <span className="text-body-sm text-fg-muted">/ 850</span>
              </div>
              <p className="mt-2 text-h4 uppercase tracking-[0.08em] text-primary-hover">
                {proof.level}
              </p>
            </div>

            <div className="py-6">
              <h2 className="mb-4 text-center text-label text-fg-subtle">
                Reputation factors
              </h2>
              <FactorGrid factors={proof.factorSummary} />
            </div>

            <dl className="grid grid-cols-1 gap-3 border-t border-white/[0.06] pt-5 sm:grid-cols-3">
              <div>
                <dt className="flex items-center gap-1.5 text-caption text-fg-subtle">
                  <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                  Verified
                </dt>
                <dd className="mt-0.5 text-body-sm font-medium text-slate-100">
                  {formatDate(proof.verifiedAt)}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-caption text-fg-subtle">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  Expires
                </dt>
                <dd className="mt-0.5 text-body-sm font-medium text-slate-100">
                  {formatDate(proof.expiresAt)}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1.5 text-caption text-fg-subtle">
                  <FileText className="h-3 w-3" aria-hidden="true" />
                  Evidence policy
                </dt>
                <dd className="mt-0.5 text-body-sm font-medium text-slate-100">
                  {proof.policyVersion ?? 'Not reported'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="inline-block rounded-lg bg-white p-2 shadow-[var(--shadow-elevated)]">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                  `https://financial-reputation-layer.vercel.app/verify/${proof.id}`
                )}`}
                alt={`QR code linking to the verification page for proof ${proof.id}`}
                width={140}
                height={140}
                className="h-28 w-28"
                loading="lazy"
              />
            </div>
            <p className="text-caption text-fg-subtle">Scan to open this verification</p>
          </div>

          <p className="text-center text-caption leading-relaxed text-fg-subtle">
            Reputation is a snapshot taken on {formatDate(proof.verifiedAt)} and may change afterwards.
            No raw financial information is exposed through this verification.
          </p>
        </div>
      </PortalShell>
    );
  }

  // ==========================================================================
  // 3. Claims disclosure link
  // ==========================================================================
  const link = db.links.find((l: VerificationLink) => l.token === token);

  if (link) {
    db.auditLogs.push({
      id: `audit_${Date.now()}`,
      link_token: link.token,
      action: 'viewed',
      timestamp: new Date().toISOString(),
    });
    saveDb(db);
  }

  const claims = link ? db.claims.filter((c: Claim) => link.claim_ids.includes(c.id)) : [];
  const company = db.companies.find((c: any) => c.id === (claims[0]?.company_id || 'c1'));

  const TIER_TONE: Record<EvidenceTier, 'info' | 'primary' | 'neutral'> = {
    official: 'info',
    counterparty_attested: 'primary',
    public_review: 'neutral',
  };
  const TIER_LABEL: Record<EvidenceTier, string> = {
    official: 'Official',
    counterparty_attested: 'Counterparty',
    public_review: 'Public review',
  };

  if (!link) {
    return (
      <PortalShell context="Verification">
        <div className="space-y-6 py-6 text-center">
          <Verdict tone="danger" title="Invalid proof">
            No FRL record matches this reference. FRL displays no reputation, score or claim for a
            reference it cannot resolve.
          </Verdict>
          <div className="flex justify-center">
            <Link href="/search">
              <Button variant="secondary">Back to company search</Button>
            </Link>
          </div>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell context="Claims disclosure">
      <div className="space-y-6">
        <Verdict tone="success" title="Claims disclosure">
          The following statements were submitted to FRL and authorised by{' '}
          <span className="text-slate-100">{company?.name || 'the company'}</span> for your review.
        </Verdict>

        <div className="flex items-start gap-3 rounded-md border border-white/10 bg-white/[0.02] p-4">
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0 text-demo"
            aria-hidden="true"
          />
          <p className="text-body-sm leading-relaxed text-fg-muted">
            This is a restricted disclosure and the access has been recorded in the FRL audit trail.
            Raw financial data is never exposed. Each statement below carries the evidence tier it
            was submitted with, so you can judge how it was established.
          </p>
        </div>

        <div className="space-y-4">
          {claims.map((claim: Claim) => {
            const isRevoked = claim.status === 'revoked';
            const isExpired = claim.status === 'expired' || new Date(claim.expires_at) < new Date();

            if (isRevoked || isExpired) {
              return (
                <div
                  key={claim.id}
                  className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h2 className="text-body-sm font-medium capitalize text-fg-subtle">
                      {claim.axis_ref}
                    </h2>
                    <Badge tone={isRevoked ? 'danger' : 'warning'} size="sm" dot>
                      {isRevoked ? 'Claim revoked' : 'Claim expired'}
                    </Badge>
                  </div>
                  <p className="mt-2 text-body-sm italic text-fg-subtle">
                    This claim is no longer active and cannot be relied upon.
                  </p>
                </div>
              );
            }

            return (
              <div
                key={claim.id}
                className="rounded-lg border border-white/10 bg-slate-900 p-5 shadow-[var(--shadow-surface)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="text-body-sm font-medium capitalize text-primary-hover">
                    {claim.axis_ref}
                  </h2>
                  <Badge tone="success" size="sm" dot>
                    Active claim
                  </Badge>
                </div>
                <p className="mt-2 text-h4 leading-snug text-slate-100">{claim.statement_text}</p>
                <dl className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/[0.06] pt-4">
                  <div className="flex items-center gap-2">
                    <dt className="text-caption text-fg-subtle">Evidence tier</dt>
                    <dd>
                      <Badge tone={TIER_TONE[claim.evidence_tier]} size="sm">
                        {TIER_LABEL[claim.evidence_tier]}
                      </Badge>
                    </dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <dt className="text-caption text-fg-subtle">Valid until</dt>
                    <dd className="text-caption text-slate-200">{formatDate(claim.expires_at)}</dd>
                  </div>
                </dl>
              </div>
            );
          })}
        </div>

        <p className="text-center text-caption leading-relaxed text-fg-subtle">
          FRL records what a party submits and the tier it was submitted at. It does not audit the
          underlying evidence and does not guarantee the outcome described in a claim.
        </p>
      </div>
    </PortalShell>
  );
}