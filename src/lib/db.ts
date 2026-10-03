import fs from 'fs';
import path from 'path';
import { Company, Claim, AxisState, VerificationLink, PublicReview, UserFinancialRecord, ScoreHistoryItem } from './types';

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

const initialFinancialData: Record<string, UserFinancialRecord> = {
  c1: {
    userId: 'c1',
    income: { monthly: 75000, stabilityMonths: 36, sourcesCount: 2 },
    expenses: { monthlyAvg: 42000, discretionaryRatio: 0.2 },
    payments: { totalDue: 24, onTimeCount: 24, lateCount: 0, missedCount: 0 },
    savings: { currentBalance: 350000, monthlyContribution: 15000, emergencyFundMonths: 8 },
    debts: { totalDebt: 120000, creditLimit: 500000, utilizationRatio: 0.24, monthlyDebtService: 12000 },
    transactions: { count6Months: 240, bouncedCount: 0, oldestAccountYears: 6 },
    updatedAt: '2024-10-01T00:00:00.000Z',
  }
};

const initialScoreHistory: Record<string, ScoreHistoryItem[]> = {
  c1: [
    { id: 'hist_1', userId: 'c1', score: 720, previousScore: null, change: 0, level: 'Good', calculatedAt: '2024-01-01T00:00:00.000Z', reason: 'Initial baseline' },
    { id: 'hist_2', userId: 'c1', score: 728, previousScore: 720, change: 8, level: 'Good', calculatedAt: '2024-04-01T00:00:00.000Z', reason: 'Quarterly update' },
    { id: 'hist_3', userId: 'c1', score: 735, previousScore: 728, change: 7, level: 'Good', calculatedAt: '2024-07-01T00:00:00.000Z', reason: 'Quarterly update' },
    { id: 'hist_4', userId: 'c1', score: 762, previousScore: 735, change: 27, level: 'Excellent', calculatedAt: '2024-10-01T00:00:00.000Z', reason: 'Savings milestone reached' },
  ]
};

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


