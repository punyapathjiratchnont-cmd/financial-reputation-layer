import fs from 'fs';
import path from 'path';
import { Company, Claim, AxisState, VerificationLink, PublicReview } from './types';

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
        links: initialLinks,
        auditLogs: initialAuditLogs,
      }, null, 2));
    } catch {
      // In serverless read-only environment, fallback safely
    }
  }
}

export function getDb() {
  initDb();
  let db: any = {
    companies: initialCompanies,
    claims: initialClaims,
    reviews: initialReviews,
    links: initialLinks,
    auditLogs: initialAuditLogs,
  };
  try {
    if (fs.existsSync(DB_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
      db = { ...db, ...parsed };
      if (!db.reviews) db.reviews = initialReviews;
    }
  } catch {
    // Fallback to in-memory db
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

