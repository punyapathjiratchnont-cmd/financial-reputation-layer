import { Company, Claim, AxisState } from './types';

export const MOCK_COMPANIES: Company[] = [
  {
    id: 'c1',
    name: 'TechFlow Solutions Co., Ltd.',
    registration_no: '0105562000000',
    industry: 'Software Development',
    founded_date: '2019-05-12',
  },
  {
    id: 'c2',
    name: 'BuildRight Construction',
    registration_no: '0105555000000',
    industry: 'Construction',
    founded_date: '2012-08-20',
  }
];

export const MOCK_CLAIMS: Claim[] = [
  {
    id: 'claim_1',
    company_id: 'c1',
    statement_text: 'Has maintained >$50k monthly recurring revenue',
    axis_ref: 'stability',
    evidence_tier: 'official',
    status: 'active',
    created_at: '2023-01-01',
    expires_at: '2023-12-31',
  },
  {
    id: 'claim_2',
    company_id: 'c1',
    statement_text: 'Paid all supplier invoices within 15 days',
    axis_ref: 'reliability',
    evidence_tier: 'counterparty_attested',
    status: 'active',
    created_at: '2023-01-01',
    expires_at: '2023-12-31',
  }
];

export const MOCK_AXIS_STATE: Record<string, AxisState[]> = {
  'c1': [
    {
      axis: 'reliability',
      state: 'has_data',
      claims: [MOCK_CLAIMS[1]]
    },
    {
      axis: 'stability',
      state: 'has_data',
      claims: [MOCK_CLAIMS[0]]
    },
    {
      axis: 'resilience',
      state: 'insufficient_data',
      claims: []
    }
  ]
};
