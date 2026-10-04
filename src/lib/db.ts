import fs from 'fs';
import path from 'path';
import { Company, Claim, AxisState, VerificationLink, PublicReview, UserFinancialRecord, ScoreHistoryItem, ReputationProof, ReputationShare } from './types';



// Mock initial data
const initialCompanies: Company[] = [
  { id: 'c1', name: 'TechFlow Solutions Co., Ltd.', registration_no: '0105562000000', industry: 'Software Development', founded_date: '2019-05-12' },
  { id: 'c2', name: 'BuildRight Construction', registration_no: '0105555000000', industry: 'Construction', founded_date: '2012-08-20' }
];

const initialClaims: Claim[] = [
  { id: 'claim_1', company_id: 'c1', statement_text: 'Has maintained >$50k monthly recurring revenue', axis_ref: 'stability', evidence_tier: 'official', status: 'active', created_at: '2023-01-01', expires_at: '2030-12-31' },
  { id: 'claim_2', company_id: 'c1', statement_text: 'Paid all supplier invoices within 15 days', axis_ref: 'reliability', evidence_tier: 'counterparty_attested', status: 'active', created_at: '2023-01-01', expires_at: '2030-12-31' }
];

const initialReviews: PublicReview[] = [
  {
    id: 'rev_1',
    company_id: 'c1',
    author_name: 'Verified Vendor A',
    review_text: 'Smooth communication during project delivery. Payment was processed within agreed timeline.',
    created_at: '2024-01-15',
    expires_at: '2025-01-15',
    responses: [
      {
        id: 'resp_1',
        author_name: 'TechFlow Solutions (Company Owner)',
        response_text: 'Thank you for your feedback! We appreciate working with your team.',
        created_at: '2024-01-16'
      }
    ]
  }
];

/**
 * Seeded financial evidence is intentionally empty.
 *
 * A complete, realistic-looking financial profile used to be seeded here for
 * c1. The reputation engine cannot tell seeded demo data from submitted data,
 * so that seed let a demo company pass the six-factor evidence gate and mint a
 * real-looking reputation score and a real proof without anyone providing any
 * evidence. Real mode now starts with nothing.
 *
 * Real evidence only ever arrives through saveUserFinancialData(), i.e. an
 * explicit user submission.
 *
 * Demo financial profiles for demo mode are untouched: they live in
 * mockFinancialData.ts and are only ever read behind an explicit demo mode.
 */
const initialFinancialData: Record<string, UserFinancialRecord> = {};

/**
 * Seeded score history is intentionally empty.
 *
 * Four fabricated baseline points (720 -> 762) used to be seeded here for c1.
 * They were served through the real /api/reputation response and plotted as a
 * real reputation trend, which is demo data leaking into real mode. Real
 * history is now only ever written by recordScoreHistory() from a score the
 * engine actually produced.
 *
 * Demo score history for demo mode lives in mockFinancialData.ts and is only
 * shown behind an explicit demo mode.
 */
const initialScoreHistory: Record<string, ScoreHistoryItem[]> = {};

const initialLinks: VerificationLink[] = [];
const initialAuditLogs: any[] = [];

const DB_PATH = path.join(process.cwd(), 'local-db.json');

function initDb() {
  if (!fs.existsSync(DB_PATH)) {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify({
        companies: initialCompanies,
        claims: initialClaims,
        reviews: initialReviews,
        financialData: initialFinancialData,
        scoreHistory: initialScoreHistory,
        links: initialLinks,
        auditLogs: initialAuditLogs,
      }, null, 2));
    } catch {
      // Fallback
    }
  }
}

export function getDb() {
  initDb();
  let db: any = {
    companies: initialCompanies,
    claims: initialClaims,
    reviews: initialReviews,
    financialData: initialFinancialData,
    scoreHistory: initialScoreHistory,
    links: initialLinks,
    auditLogs: initialAuditLogs,
  };
  try {
    if (fs.existsSync(DB_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
      db = { ...db, ...parsed };
      if (!db.financialData) db.financialData = initialFinancialData;
      if (!db.scoreHistory) db.scoreHistory = initialScoreHistory;
    }
  } catch {
    // Fallback to memory
  }
  return db;
}

export function saveDb(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch {
    // Read-only environment ignore
  }
}

export function getUserFinancialData(userId: string): UserFinancialRecord | null {
  const db = getDb();
  return db.financialData?.[userId] || null;
}

export function saveUserFinancialData(userId: string, record: UserFinancialRecord): void {
  const db = getDb();
  if (!db.financialData) db.financialData = {};
  db.financialData[userId] = record;
  saveDb(db);
}

export function getUserScoreHistory(userId: string): ScoreHistoryItem[] {
  const db = getDb();
  return db.scoreHistory?.[userId] || [];
}

export function recordScoreHistory(
  userId: string,
  newScore: number,
  level: string,
  reason: string = 'Financial data updated'
): ScoreHistoryItem[] {
  const db = getDb();
  if (!db.scoreHistory) db.scoreHistory = {};
  const userHistory: ScoreHistoryItem[] = db.scoreHistory[userId] || [];

  const lastItem = userHistory.length > 0 ? userHistory[userHistory.length - 1] : null;

  // Requirement 6: Prevent recording duplicate history points when score has not changed!
  if (lastItem && lastItem.score === newScore) {
    return userHistory;
  }

  const previousScore = lastItem ? lastItem.score : null;
  const change = previousScore !== null ? newScore - previousScore : 0;

  const newItem: ScoreHistoryItem = {
    id: `hist_${Date.now()}`,
    userId,
    score: newScore,
    previousScore,
    change,
    level,
    calculatedAt: new Date().toISOString(),
    reason,
  };

  userHistory.push(newItem);
  db.scoreHistory[userId] = userHistory;
  saveDb(db);

  return userHistory;
}

// Phase 5: Reputation Proof DB Operations
export function createReputationProof(proof: ReputationProof): ReputationProof {
  const db = getDb();
  if (!db.reputationProofs) db.reputationProofs = [];
  db.reputationProofs.push(proof);
  saveDb(db);
  return proof;
}

export function getReputationProof(id: string): ReputationProof | null {
  const db = getDb();
  const proofs: ReputationProof[] = db.reputationProofs || [];
  const proof = proofs.find((p) => p.id === id);
  if (!proof) return null;

  // Auto-expire check
  if (proof.status === 'active' && new Date(proof.expiresAt) < new Date()) {
    proof.status = 'expired';
    saveDb(db);
  }

  return proof;
}

export function getUserReputationProofs(ownerUserId: string): ReputationProof[] {
  const db = getDb();
  const proofs: ReputationProof[] = db.reputationProofs || [];
  let updated = false;

  const userProofs = proofs.filter((p) => p.ownerUserId === ownerUserId);
  userProofs.forEach((p) => {
    if (p.status === 'active' && new Date(p.expiresAt) < new Date()) {
      p.status = 'expired';
      updated = true;
    }
  });

  if (updated) {
    saveDb(db);
  }

  return userProofs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function revokeReputationProof(id: string, ownerUserId: string): boolean {
  const db = getDb();
  const proofs: ReputationProof[] = db.reputationProofs || [];
  const proof = proofs.find((p) => p.id === id && p.ownerUserId === ownerUserId);

  if (!proof) return false;

  proof.status = 'revoked';
  saveDb(db);
  return true;
}

// Phase 6: Controlled Reputation Share DB Operations
export function createReputationShare(share: ReputationShare): ReputationShare {
  const db = getDb();
  if (!db.reputationShares) db.reputationShares = [];
  db.reputationShares.push(share);
  saveDb(db);
  return share;
}

export function getReputationShare(shareToken: string): ReputationShare | null {
  const db = getDb();
  const shares: ReputationShare[] = db.reputationShares || [];
  const share = shares.find((s) => s.shareToken === shareToken);
  if (!share) return null;

  // Auto-expire check
  if (share.status === 'active' && new Date(share.expiresAt) < new Date()) {
    share.status = 'expired';
    saveDb(db);
  }

  return share;
}

export function getUserReputationShares(ownerUserId: string): ReputationShare[] {
  const db = getDb();
  const shares: ReputationShare[] = db.reputationShares || [];
  let updated = false;

  const userShares = shares.filter((s) => s.ownerUserId === ownerUserId);
  userShares.forEach((s) => {
    if (s.status === 'active' && new Date(s.expiresAt) < new Date()) {
      s.status = 'expired';
      updated = true;
    }
  });

  if (updated) {
    saveDb(db);
  }

  return userShares.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function revokeReputationShare(shareToken: string, ownerUserId: string): boolean {
  const db = getDb();
  const shares: ReputationShare[] = db.reputationShares || [];
  const share = shares.find((s) => s.shareToken === shareToken && s.ownerUserId === ownerUserId);

  if (!share) return false;

  share.status = 'revoked';
  saveDb(db);
  return true;
}




