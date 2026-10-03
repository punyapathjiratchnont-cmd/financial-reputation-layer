import { Company, Claim, AxisState } from './types';

export const MOCK_COMPANIES: Company[] = [
  {
    id: 'c1',
    name: 'TechFlow Solutions Co., Ltd.',
    registration_no: '0105562000000',
    industry: 'Software Development & IT Consulting',
    founded_date: '2019-05-12',
    country: 'Thailand',
    isClaimed: true,
    logo: '🏢',
    overview: 'TechFlow Solutions is an enterprise software provider specializing in cloud migration, custom SaaS solutions, and financial API integrations for modern businesses.',
    reputationScore: 815,
    reputationLevel: 'Excellent',
    dimensions: {
      paymentReliability: {
        score: 840,
        label: 'Strong',
        explanation: 'Based on verified payment records showing 98.5% on-time settlement over 12 months.',
        source: 'Verified Transaction History',
        isSufficient: true,
      },
      businessReliability: {
        score: 810,
        label: 'Strong',
        explanation: 'Based on 2 verified active counterparty attestations and client contract fulfillments.',
        source: 'Verified Counterparty Attestation',
        isSufficient: true,
      },
      financialStability: {
        score: 790,
        label: 'Stable',
        explanation: 'Based on consistent quarterly operating cashflow and audited balance sheets.',
        source: 'Company Financial Filing',
        isSufficient: true,
      },
      transactionHistory: {
        score: 820,
        label: 'Strong',
        explanation: 'Based on over 2,400 verified commercial banking transactions recorded with FRL.',
        source: 'Banking Data Stream',
        isSufficient: true,
      },
    },
    quickSummary: {
      strengths: [
        'Consistently high payment reliability score (840/1000)',
        'Zero default or bounced transaction events recorded in 24 months',
        'Strong recurring monthly revenue stream from enterprise contracts',
      ],
      thingsToConsider: [
        'Short company operating history (founded in 2019)',
        'Some financial filings have 90-day reporting lag',
      ],
      dataStatus: 'Official Claimed Profile (Demo Data)',
    },
    trackRecord: {
      achievements: [
        {
          title: 'ISO 27001 Security Certification Achieved',
          description: 'Verified cloud security compliance audit passed in Q3 2025.',
          source: 'Public Source',
        },
        {
          title: 'Enterprise Fintech Integration Milestone',
          description: 'Delivered core payment gateways for 15 regional banking partners.',
          source: 'Company Provided',
        },
      ],
      relationships: [
        {
          partner: 'Siam Commercial Tech Group',
          relationshipType: 'Strategic Technology Partner',
          source: 'Verified Record',
        },
        {
          partner: 'APAC Cloud Solutions',
          relationshipType: 'Vendor Contract',
          source: 'Public Source',
        },
      ],
      performance: [
        {
          metric: 'On-Time Invoice Payment Rate',
          value: '98.5%',
          source: 'Verified Record',
        },
        {
          metric: 'Average Monthly Transaction Volume',
          value: '฿14.5M',
          source: 'Company Provided',
        },
      ],
    },
    reputationHistory: [
      {
        year: '2026',
        event: 'Payment reliability score upgraded after 12 clean billing cycles.',
        source: 'Verified Transaction Data',
      },
      {
        year: '2025',
        event: 'Claimed FRL Official Profile and submitted audited financial records.',
        source: 'FRL Official Claim',
      },
      {
        year: '2024',
        event: 'Recorded strategic partnership with Siam Commercial Tech Group.',
        source: 'Public Source',
      },
      {
        year: '2019',
        event: 'Company established in Bangkok, Thailand.',
        source: 'Public Registration Record',
      },
    ],
    scoreHistory: [
      { date: '2025-01', score: 760 },
      { date: '2025-04', score: 780 },
      { date: '2025-07', score: 795 },
      { date: '2025-10', score: 805 },
      { date: '2026-01', score: 810 },
      { date: '2026-04', score: 815 },
    ],
    currentIssues: {
      verifiedIssues: [],
      informationGaps: [
        {
          title: 'Q3 2026 Tax Certificate Pending Update',
          detail: 'Company has not yet attached the Q3 tax compliance filing.',
        },
      ],
      aiAnalysis: [
        {
          title: 'Positive Cashflow Trend',
          detail: 'AI analysis observes a 14% improvement in expense management consistency year-over-year.',
        },
      ],
    },
  },

  {
    id: 'c2',
    name: 'BuildRight Construction Co., Ltd.',
    registration_no: '0105555000000',
    industry: 'Civil Engineering & Construction',
    founded_date: '2012-08-20',
    country: 'Thailand',
    isClaimed: true,
    logo: '🏗️',
    overview: 'BuildRight Construction specializes in commercial property construction, infrastructure projects, and industrial facility developments across Southeast Asia.',
    reputationScore: 675,
    reputationLevel: 'Good',
    dimensions: {
      paymentReliability: {
        score: 660,
        label: 'Good',
        explanation: 'Payment records show occasional 15-30 day supplier invoice extensions typical of project milestones.',
        source: 'Verified Transaction History',
        isSufficient: true,
      },
      businessReliability: {
        score: 720,
        label: 'Strong',
        explanation: 'Based on verified public tenders & project completion attestations.',
        source: 'Public Record & Counterparty Attestations',
        isSufficient: true,
      },
      financialStability: {
        score: 640,
        label: 'Moderate',
        explanation: 'High working capital reliance on project-based milestone disbursements.',
        source: 'Financial Statements',
        isSufficient: true,
      },
      transactionHistory: {
        score: 680,
        label: 'Good',
        explanation: 'Consistent heavy equipment leasing and vendor payment activity recorded.',
        source: 'Banking Data Stream',
        isSufficient: true,
      },
    },
    quickSummary: {
      strengths: [
        'Established 14+ year operational track record in commercial construction',
        'Strong project completion history verified by public tenders',
      ],
      thingsToConsider: [
        'Higher debt utilization ratio during active project procurement cycles',
        'Occasional minor delay in subcontractor invoice settlements',
      ],
      dataStatus: 'Official Claimed Profile (Demo Data)',
    },
    trackRecord: {
      achievements: [
        {
          title: 'Bangkok Commercial Tower Completion',
          description: 'Successfully handed over 32-story mixed-use development on schedule.',
          source: 'Public Source',
        },
      ],
      relationships: [
        {
          partner: 'Metro Infrastructure Partners',
          relationshipType: 'Consortium Partner',
          source: 'Public Source',
        },
      ],
      performance: [
        {
          metric: 'Completed Major Projects',
          value: '48 Projects',
          source: 'Public Source',
        },
      ],
    },
    reputationHistory: [
      {
        year: '2026',
        event: 'Completed major commercial project milestone payout.',
        source: 'Verified Transaction Record',
      },
      {
        year: '2021',
        event: 'Obtained Grade A Public Works Engineering License.',
        source: 'Public Source',
      },
      {
        year: '2012',
        event: 'Company founded.',
        source: 'Public Record',
      },
    ],
    scoreHistory: [
      { date: '2025-01', score: 650 },
      { date: '2025-06', score: 660 },
      { date: '2026-01', score: 675 },
    ],
    currentIssues: {
      verifiedIssues: [
        {
          title: '1 Late Vendor Payment Recorded (35 Days)',
          detail: 'Invoice settlement was delayed pending project milestone inspection in Q1 2026.',
          source: 'Verified Transaction Records',
        },
      ],
      informationGaps: [
        {
          title: 'Subcontractor Agreement Details Not Disclosed',
          detail: 'Detailed subcontractor payment schedules are not provided to FRL.',
        },
      ],
      aiAnalysis: [
        {
          title: 'Seasonal Working Capital Fluctuations',
          detail: 'AI analysis notes cash reserves fluctuate predictably around major procurement quarters.',
        },
      ],
    },
  },

  {
    id: 'c3',
    name: 'Toyota Motor Corporation',
    registration_no: 'JP3633400000',
    industry: 'Automotive & Mobility Manufacturing',
    founded_date: '1937-08-28',
    country: 'Japan',
    isClaimed: false, // Unclaimed Public Profile
    logo: '🚘',
    overview: 'Toyota Motor Corporation is a global automotive leader that designs, manufactures, and distributes passenger cars, commercial vehicles, and advanced hybrid mobility solutions.',
    reputationScore: null, // NO FABRICATED SCORE FOR UNCLAIMED PROFILES
    reputationLevel: null,
    dimensions: {
      paymentReliability: {
        score: null,
        label: 'Insufficient Data',
        explanation: 'No direct payment transaction stream has been linked to FRL.',
        isSufficient: false,
      },
      businessReliability: {
        score: null,
        label: 'Insufficient Data',
        explanation: 'No verified FRL counterparty attestations or trade claims submitted.',
        isSufficient: false,
      },
      financialStability: {
        score: null,
        label: 'Insufficient Data',
        explanation: 'Public corporate filings are not linked to private FRL calculation engine.',
        isSufficient: false,
      },
      transactionHistory: {
        score: null,
        label: 'Insufficient Data',
        explanation: 'No banking transaction history recorded with FRL.',
        isSufficient: false,
      },
    },
    quickSummary: {
      strengths: [
        'Global brand recognition and public market capitalisation',
      ],
      thingsToConsider: [
        'This profile is created from public data and has NOT been claimed by Toyota representatives.',
        'Private financial streams and counterparty attestations are not linked to FRL.',
      ],
      dataStatus: 'Public Data Only (Unclaimed Profile)',
    },
    trackRecord: {
      achievements: [
        {
          title: 'Global Hybrid Vehicle Market Leadership',
          description: 'Over 20 million hybrid electric vehicles produced worldwide.',
          source: 'Public Source',
        },
      ],
      relationships: [
        {
          partner: 'Denso Corporation',
          relationshipType: 'Key Supplier Partner',
          source: 'Public Source',
        },
      ],
      performance: [
        {
          metric: 'Annual Vehicle Sales',
          value: '10.5 Million Units',
          source: 'Public Source',
        },
      ],
    },
    reputationHistory: [
      {
        year: '1937',
        event: 'Toyota Motor Corporation founded in Aichi, Japan.',
        source: 'Public Registration',
      },
    ],
    scoreHistory: [],
    currentIssues: {
      verifiedIssues: [],
      informationGaps: [
        {
          title: 'Unclaimed Profile',
          detail: 'This profile has not been claimed by Toyota officers. Direct private banking streams and verified attestations are not linked.',
        },
      ],
      aiAnalysis: [],
    },
  },

  {
    id: 'c4',
    name: 'Siam Global Logistics Ltd.',
    registration_no: '0105577900000',
    industry: 'Freight & Supply Chain Logistics',
    founded_date: '2023-11-15',
    country: 'Thailand',
    isClaimed: false,
    logo: '📦',
    overview: 'Siam Global Logistics is an emerging regional freight forwarding agency operating out of Laem Chabang port.',
    reputationScore: null, // INSUFFICIENT DATA
    reputationLevel: null,
    dimensions: {
      paymentReliability: {
        score: null,
        label: 'Insufficient Data',
        explanation: 'There is not enough verified payment history available to calculate this dimension.',
        isSufficient: false,
      },
      businessReliability: {
        score: null,
        label: 'Insufficient Data',
        explanation: 'No verified counterparty attestations or trade records have been submitted.',
        isSufficient: false,
      },
      financialStability: {
        score: null,
        label: 'Insufficient Data',
        explanation: 'Financial filings have not been submitted to FRL.',
        isSufficient: false,
      },
      transactionHistory: {
        score: null,
        label: 'Insufficient Data',
        explanation: 'Insufficient transaction activity recorded.',
        isSufficient: false,
      },
    },
    quickSummary: {
      strengths: [
        'Active registration with Department of Business Development',
      ],
      thingsToConsider: [
        'Insufficient verified reputation data available on FRL',
        'Company has not claimed this profile or provided financial streams',
      ],
      dataStatus: 'Public Data Only (Unclaimed Profile)',
    },
    trackRecord: {
      achievements: [],
      relationships: [],
      performance: [],
    },
    reputationHistory: [
      {
        year: '2023',
        event: 'Company registered in Thailand.',
        source: 'Public Record',
      },
    ],
    scoreHistory: [],
    currentIssues: {
      verifiedIssues: [],
      informationGaps: [
        {
          title: 'No Financial Data Provided',
          detail: 'No audited statements or banking transactions have been linked to FRL.',
        },
        {
          title: 'Unclaimed Profile',
          detail: 'Company representative has not verified or claimed this profile.',
        },
      ],
      aiAnalysis: [],
    },
  },
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
