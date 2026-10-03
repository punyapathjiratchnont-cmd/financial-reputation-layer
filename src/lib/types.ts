export type EvidenceTier = 'official' | 'counterparty_attested' | 'public_review';
export type Axis = 'reliability' | 'stability' | 'resilience' | 'leverage' | 'track_record' | 'data_confidence';

export interface Company {
  id: string;
  name: string;
  registration_no: string;
  industry: string;
  founded_date: string;
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
