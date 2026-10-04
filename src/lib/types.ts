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

/**
 * Where a data point came from.
 *
 * 'public_registry' means the value was retrieved from a public corporate
 * registry provider (OpenCorporates). It does NOT mean FRL verified it.
 */
export type SourceType =
  | 'public_registry'
  | 'filing'
  | 'company_provided'
  | 'counterparty'
  | 'internal_demo';

/**
 * Whether FRL itself has verified this record.
 *
 * Registry retrieval is NOT verification. Every record returned by a registry
 * provider starts as 'unverified' and may only become 'verified' once FRL has
 * actually performed a verification step against the authoritative source.
 */
export type VerificationStatus = 'unverified' | 'verified' | 'expired';

export interface CompanySourceInfo {
  provider: string; // e.g. 'OpenCorporates'
  sourceType: SourceType;
  verificationStatus: VerificationStatus;
  url?: string;
  /** Only set when the record was ACTUALLY retrieved. Never invented. */
  retrievedAt?: string;
}

export interface CompanyIdentity {
  id: string;
  name: string;
  legalName?: string;
  businessType?: string;
  industry?: string;
  /**
   * A real country name ONLY when the source explicitly supplies one.
   * A jurisdiction code (e.g. 'gb') must never be written into this field.
   */
  country?: string;
  /** Registry jurisdiction code exactly as the registry reports it (e.g. 'gb'). */
  jurisdictionCode?: string;
  registrationNumber?: string;
  companyStatus?: string;
  incorporationDate?: string;
  dissolutionDate?: string;
  registeredAddress?: string;
  foundedYear?: number;
  officialWebsite?: string;
  logoUrl?: string;
  source: CompanySourceInfo;
  profileStatus: 'claimed' | 'unclaimed';
}

export interface CompanySearchResult {
  id: string;
  name: string;
  businessType?: string;
  industry?: string;
  /**
   * A real country name ONLY when the source explicitly supplies one.
   * Never a jurisdiction code.
   */
  country?: string;
  /** Registry jurisdiction code exactly as the registry reports it. */
  jurisdictionCode?: string;
  registrationNumber?: string;
  officialWebsite?: string;
  logoUrl?: string;
  profileStatus: 'claimed' | 'unclaimed';
  /**
   * Only populated for records that genuinely carry a reputation score.
   * A registry identity record never has one, so it stays undefined.
   */
  reputationScore?: number | null;
  reputationLevel?: string | null;
  source: CompanySourceInfo;
}

export interface Company {
  id: string;
  name: string;
  // The fields below are optional because a real registry record does not
  // supply every value. They must be left undefined when the source does not
  // provide them. Never fabricate a value to fill a required slot.
  registration_no?: string;
  industry?: string;
  founded_date?: string;
  country?: string;
  /** Registry jurisdiction code exactly as the registry reports it. */
  jurisdictionCode?: string;
  companyStatus?: string;
  incorporationDate?: string;
  dissolutionDate?: string;
  registeredAddress?: string;
  /** Provider-native record id (e.g. OpenCorporates company id). */
  openCorporatesId?: string;
  isClaimed?: boolean;
  logo?: string;
  officialWebsite?: string;
  sourceInfo?: CompanySourceInfo;
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
  /**
   * Which reputation evidence policy produced this proof.
   * Proofs without one were minted before the strict six-factor evidence
   * policy existed and must never be presented as valid.
   */
  policyVersion?: string;
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





