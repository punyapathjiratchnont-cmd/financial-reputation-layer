export type EvidenceTier = 'official' | 'counterparty_attested' | 'public_review';
export type Axis = 'reliability' | 'stability' | 'resilience' | 'leverage' | 'track_record' | 'data_confidence';

export interface DimensionDetail {
  score: number | null; // 0-1000
  label: string; // 'Strong' | 'Good' | 'Stable' | 'Moderate' | 'Insufficient Data'
  explanation: string;
  source?: string;
  isSufficient: boolean;
}

export interface TrackRecordItem {
  title: string;
  description: string;
  source: 'Public Source' | 'Company Provided' | 'Verified Record';
}

export interface BusinessRelationshipItem {
  partner: string;
  relationshipType: string;
  source: 'Public Source' | 'Company Provided' | 'Verified Record';
}

export interface BusinessPerformanceItem {
  metric: string;
  value: string;
  source: 'Public Source' | 'Company Provided' | 'Verified Record';
}

export interface HistoryEventItem {
  year: string;
  event: string;
  source: string;
}

export interface VerifiedIssueItem {
  title: string;
  detail: string;
  source: string;
}

export interface InformationGapItem {
  title: string;
  detail: string;
}

export interface AIAnalysisIssueItem {
  title: string;
  detail: string;
}

export interface Company {
  id: string;
  name: string;
  registration_no: string;
  industry: string;
  founded_date: string;
  country?: string;
  isClaimed?: boolean;
  logo?: string;
  overview?: string;
  reputationScore?: number | null; // 0 - 1000 scale
  reputationLevel?: string | null;
  dimensions?: {
    paymentReliability: DimensionDetail;
    businessReliability: DimensionDetail;
    financialStability: DimensionDetail;
    transactionHistory: DimensionDetail;
  };
  quickSummary?: {
    strengths: string[];
    thingsToConsider: string[];
    dataStatus: string;
  };
  trackRecord?: {
    achievements: TrackRecordItem[];
    relationships: BusinessRelationshipItem[];
    performance: BusinessPerformanceItem[];
  };
  reputationHistory?: HistoryEventItem[];
  scoreHistory?: { date: string; score: number }[];
  currentIssues?: {
    verifiedIssues: VerifiedIssueItem[];
    informationGaps: InformationGapItem[];
    aiAnalysis: AIAnalysisIssueItem[];
  };
}

export interface AxisState {
  axis: Axis;
  state: 'has_data' | 'insufficient_data';
  claims: Claim[];
}

export interface Claim {
  id: string;
  company_id: string;
  statement_text: string;
  axis_ref: Axis;
  evidence_tier: EvidenceTier;
  status: 'draft' | 'active' | 'revoked' | 'expired';
  created_at: string;
  expires_at: string;
  revoked_at?: string;
}

export interface VerificationLink {
  id: string;
  claim_ids: string[];
  token: string;
  created_by: string;
  expires_at: string;
}

export interface ReviewResponse {
  id: string;
  author_name: string;
  response_text: string;
  created_at: string;
}

export interface PublicReview {
  id: string;
  company_id: string;
  author_name: string;
  review_text: string;
  created_at: string;
  expires_at: string;
  responses?: ReviewResponse[];
}

export interface UserFinancialRecord {
  userId: string;
  income: {
    monthly: number;
    stabilityMonths: number;
    sourcesCount: number;
  };
  expenses: {
    monthlyAvg: number;
    discretionaryRatio: number;
  };
  payments: {
    totalDue: number;
    onTimeCount: number;
    lateCount: number;
    missedCount: number;
  };
  savings: {
    currentBalance: number;
    monthlyContribution: number;
    emergencyFundMonths: number;
  };
  debts: {
    totalDebt: number;
    creditLimit: number;
    utilizationRatio: number;
    monthlyDebtService: number;
  };
  transactions: {
    count6Months: number;
    bouncedCount: number;
    oldestAccountYears: number;
  };
  updatedAt: string;
}

export interface ScoreHistoryItem {
  id: string;
  userId: string;
  score: number;
  previousScore: number | null;
  change: number;
  level: string;
  calculatedAt: string;
  reason: string;
}

export interface FactorSummary {
  paymentReliability: string;
  incomeConsistency: string;
  spendingStability: string;
  savingBehavior: string;
  debtBehavior: string;
  transactionHistory: string;
}

export interface ReputationProof {
  id: string;
  ownerUserId: string;
  score: number;
  level: string;
  factorSummary: FactorSummary;
  verifiedAt: string;
  expiresAt: string;
  status: 'active' | 'revoked' | 'expired';
  createdAt: string;
}

export type DisclosureLevel = 'score_only' | 'score_and_level' | 'score_and_factors';

export interface ReputationShare {
  id: string;
  ownerUserId: string;
  proofId: string;
  shareToken: string;
  disclosureLevel: DisclosureLevel;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'revoked' | 'expired';
}





