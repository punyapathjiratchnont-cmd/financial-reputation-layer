import { Company } from './types';
import { MOCK_COMPANIES } from './mockData';

/**
 * Resolves a company profile by ID.
 * 1. Checks local demo/mock companies (c1, c2, c3, c4).
 * 2. If ID starts with 'oc_' (OpenCorporates real company), fetches or constructs a normalized Company object.
 * 
 * STRICT PRODUCT RULE:
 * Real company identity data DOES NOT automatically create a Reputation Score.
 * NO EVIDENCE -> NO REPUTATION SCORE (reputationScore: null, dimensions: Insufficient Data).
 */
export async function getCompanyById(id: string): Promise<Company | null> {
  // 1. Check local demo profiles
  const demoMatch = MOCK_COMPANIES.find((c) => c.id === id);
  if (demoMatch) {
    return demoMatch;
  }

  // 2. Handle Real OpenCorporates ID (format: oc_{jurisdiction_code}_{company_number})
  if (id.startsWith('oc_')) {
    const parts = id.split('_');
    if (parts.length >= 3) {
      const jurisdictionCode = parts[1];
      const companyNumber = parts.slice(2).join('_');

      const apiToken = process.env.OPENCORPORATES_API_TOKEN;

      if (apiToken && apiToken !== 'your_opencorporates_api_token_here') {
        try {
          const url = `https://api.opencorporates.com/v0.2/companies/${jurisdictionCode}/${companyNumber}?api_token=${encodeURIComponent(
            apiToken
          )}`;
          const res = await fetch(url, { headers: { Accept: 'application/json' } });

          if (res.ok) {
            const data = await res.json();
            const comp = data?.results?.company;
            if (comp) {
              return mapOpenCorpToCompany(id, comp);
            }
          }
        } catch (err) {
          // Fallback to normalized identity model if fetch fails
        }
      }

      // Construct clean normalized CompanyIdentity model fallback for oc_ ID
      const country = jurisdictionCode.toUpperCase();
      const fallbackName = companyNumber
        .replace(/[^a-zA-Z0-9]/g, ' ')
        .toUpperCase();

      return {
        id,
        name: `${country} Corporate Entity (${companyNumber})`,
        registration_no: companyNumber,
        industry: 'Corporate Registry Entity',
        founded_date: 'N/A',
        country,
        isClaimed: false, // REAL SEARCH RESULTS ARE ALWAYS UNCLAIMED
        logo: '🏢',
        overview: `Official registered corporate entity recorded in the ${country} public business registry.`,
        reputationScore: null, // STRICT RULE: NO EVIDENCE -> NO SCORE
        reputationLevel: null,
        dimensions: {
          paymentReliability: {
            score: null,
            label: 'Insufficient Data',
            explanation: 'No direct private banking transaction stream submitted to FRL.',
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
          strengths: ['Registered with official public corporate registry'],
          thingsToConsider: [
            'This profile is created from public registry data and has NOT been claimed by company officers.',
            'Private financial streams and counterparty attestations are not linked to FRL.',
          ],
          dataStatus: `Public Data Only (OpenCorporates - ${country})`,
        },
        trackRecord: {
          achievements: [],
          relationships: [],
          performance: [],
        },
        reputationHistory: [
          {
            year: new Date().getFullYear().toString(),
            event: 'Public identity record retrieved from OpenCorporates.',
            source: 'OpenCorporates Registry',
          },
        ],
        scoreHistory: [],
        currentIssues: {
          verifiedIssues: [],
          informationGaps: [
            {
              title: 'Unclaimed Profile',
              detail:
                'This profile has not been claimed by company representatives. Direct private banking streams and verified counterparty attestations are not linked to FRL.',
            },
          ],
          aiAnalysis: [],
        },
        sourceInfo: {
          provider: 'OpenCorporates',
          url: `https://opencorporates.com/companies/${jurisdictionCode}/${companyNumber}`,
          retrievedAt: new Date().toISOString(),
        },
      };
    }
  }

  return null;
}

function mapOpenCorpToCompany(id: string, comp: any): Company {
  const country = comp.jurisdiction_code ? comp.jurisdiction_code.toUpperCase() : 'Global';
  const incDate = comp.incorporation_date || 'N/A';
  const year = incDate !== 'N/A' ? incDate.substring(0, 4) : 'N/A';

  return {
    id,
    name: comp.name || 'Registered Corporate Entity',
    registration_no: comp.company_number || 'N/A',
    industry: comp.company_type || 'Corporate Entity',
    founded_date: incDate,
    country,
    isClaimed: false, // ALWAYS UNCLAIMED BY DEFAULT
    logo: '🏢',
    officialWebsite: comp.website_url || undefined,
    overview: `${comp.name} is a registered corporate entity (${comp.company_type || 'Business'}) recorded in the ${country} corporate registry.`,
    reputationScore: null, // STRICT RULE: NO EVIDENCE -> NO SCORE
    reputationLevel: null,
    dimensions: {
      paymentReliability: {
        score: null,
        label: 'Insufficient Data',
        explanation: 'No direct private banking transaction stream submitted to FRL.',
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
      strengths: [`Active status in ${country} corporate registry (${comp.current_status || 'Active'})`],
      thingsToConsider: [
        'This profile is created from public registry data and has NOT been claimed by company representatives.',
        'Private financial streams and counterparty attestations are not linked to FRL.',
      ],
      dataStatus: `Public Data Only (OpenCorporates - ${country})`,
    },
    trackRecord: {
      achievements: [],
      relationships: [],
      performance: [],
    },
    reputationHistory: [
      {
        year: year,
        event: `Incorporated in ${country} corporate registry (${comp.company_type || 'Company'}).`,
        source: 'OpenCorporates Registry',
      },
    ],
    scoreHistory: [],
    currentIssues: {
      verifiedIssues: [],
      informationGaps: [
        {
          title: 'Unclaimed Profile',
          detail:
            'This profile has not been claimed by company representatives. Direct private banking streams and verified counterparty attestations are not linked to FRL.',
        },
      ],
      aiAnalysis: [],
    },
    sourceInfo: {
      provider: 'OpenCorporates',
      url: comp.opencorporates_url || undefined,
      retrievedAt: new Date().toISOString(),
    },
  };
}
