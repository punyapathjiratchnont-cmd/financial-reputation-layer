/**
 * Resolves a company profile by id.
 *
 * ABSOLUTE RULE (FRL): REAL DATA ONLY.
 *
 * A real company profile is produced ONLY when the registry provider returned a
 * record that FRL could read. There is no fallback that invents a company, a
 * registry description, provenance, or a retrieval timestamp. When the provider
 * cannot confirm the company, this service returns `not_found` or an explicit
 * error — never a synthetic company.
 *
 * STRICT PRODUCT RULE: real company identity data does NOT create a reputation
 * score. Every dimension below is `Insufficient Data` with a null score.
 */

import { lookupRegistryCompany, type RegistryClientOptions } from './companyRegistry';
import type { NormalizedRegistryCompany, RegistryErrorCode } from './companyIdentityAdapter';
import { MOCK_COMPANIES } from './mockData';
import type {
  Company,
  CompanySearchResult,
  DimensionDetail,
  HistoryEventItem,
} from './types';

export type CompanyLookupResult =
  | { status: 'found'; company: Company }
  | { status: 'not_found' }
  | { status: 'error'; code: RegistryErrorCode; message: string };

const REGISTRY_SOURCE_LABEL = 'OpenCorporates (public registry)';

function insufficient(explanation: string): DimensionDetail {
  return {
    score: null,
    label: 'Insufficient Data',
    explanation,
    isSufficient: false,
  };
}

/**
 * A display label built only from real registry values.
 * Falls back to the registration number and then the id — never a generated name.
 */
export function registryDisplayName(company: NormalizedRegistryCompany): string {
  if (company.legalName) return company.legalName;
  if (company.registrationNumber) {
    return `${company.registrationNumber} (${company.jurisdictionCode ?? 'jurisdiction not reported'})`;
  }
  return company.id;
}

/** Composes a factual summary. Every clause is conditional on a real field. */
function buildOverview(company: NormalizedRegistryCompany): string | undefined {
  const sentences: string[] = [];

  if (company.legalName && company.registrationNumber) {
    sentences.push(
      `${company.legalName} is recorded in the ${company.jurisdictionCode} jurisdiction with registration number ${company.registrationNumber}.`
    );
  } else if (company.legalName) {
    sentences.push(
      `${company.legalName} is recorded in the ${company.jurisdictionCode} jurisdiction.`
    );
  } else {
    sentences.push(
      `This corporate registry record (${company.id}) does not report a legal name.`
    );
  }

  if (company.companyStatus) {
    sentences.push(`The registry reports the company status as ${company.companyStatus}.`);
  }
  if (company.entityType) {
    sentences.push(`The registry reports the entity type as ${company.entityType}.`);
  }
  if (company.incorporationDate) {
    sentences.push(`The registry reports an incorporation date of ${company.incorporationDate}.`);
  }
  if (company.dissolutionDate) {
    sentences.push(`The registry reports a dissolution date of ${company.dissolutionDate}.`);
  }

  sentences.push(
    'This record was retrieved from a public registry. It has not been verified by FRL.'
  );

  return sentences.join(' ');
}

/** History entries are only ever built from dates the registry reported. */
function buildHistory(company: NormalizedRegistryCompany): HistoryEventItem[] {
  const history: HistoryEventItem[] = [];
  if (company.incorporationDate) {
    history.push({
      year: company.incorporationDate.slice(0, 4) || company.incorporationDate,
      event: `Incorporated on ${company.incorporationDate}, per the public registry record.`,
      source: REGISTRY_SOURCE_LABEL,
    });
  }
  if (company.dissolutionDate) {
    history.push({
      year: company.dissolutionDate.slice(0, 4) || company.dissolutionDate,
      event: `Dissolved on ${company.dissolutionDate}, per the public registry record.`,
      source: REGISTRY_SOURCE_LABEL,
    });
  }
  return history;
}

/**
 * Maps a confirmed registry record onto the profile model.
 *
 * Absent registry values stay `undefined`. Nothing is defaulted, and the
 * reputation fields are always null/insufficient because registry identity is
 * not evidence.
 */
export function toCompanyProfile(company: NormalizedRegistryCompany): Company {
  return {
    id: company.id,
    name: registryDisplayName(company),
    registration_no: company.registrationNumber ?? undefined,
    industry: company.entityType ?? undefined,
    founded_date: company.incorporationDate ?? undefined,
    country: company.country ?? undefined,
    jurisdictionCode: company.jurisdictionCode ?? undefined,
    companyStatus: company.companyStatus ?? undefined,
    incorporationDate: company.incorporationDate ?? undefined,
    dissolutionDate: company.dissolutionDate ?? undefined,
    registeredAddress: company.registeredAddress ?? undefined,
    openCorporatesId: company.openCorporatesId ?? undefined,
    officialWebsite: company.officialWebsite ?? undefined,
    // A registry record is never an FRL-claimed profile.
    isClaimed: false,
    sourceInfo: company.source,
    overview: buildOverview(company),
    // STRICT RULE: NO EVIDENCE -> NO REPUTATION SCORE
    reputationScore: null,
    reputationLevel: null,
    dimensions: {
      paymentReliability: insufficient(
        'No verified business payment records have been submitted to FRL for this company.'
      ),
      businessReliability: insufficient(
        'No verified counterparty attestations or business trade claims have been submitted to FRL.'
      ),
      financialStability: insufficient(
        'No verified financial filings have been linked to this FRL profile.'
      ),
      transactionHistory: insufficient(
        'No banking transaction history has been recorded with FRL.'
      ),
    },
    quickSummary: {
      strengths: [],
      thingsToConsider: [
        'This profile is built from a public registry record and has not been claimed by company officers.',
        'Retrieving a registry record is not an FRL verification, and registry identity data is not reputation evidence.',
      ],
      dataStatus: `Public registry record (${company.source.provider}) — not verified by FRL`,
    },
    trackRecord: { achievements: [], relationships: [], performance: [] },
    reputationHistory: buildHistory(company),
    scoreHistory: [],
    currentIssues: {
      verifiedIssues: [],
      informationGaps: [
        {
          title: 'Unclaimed profile',
          detail:
            'No company representative has claimed this profile. Verified counterparty attestations and private financial streams are not linked to FRL.',
        },
        {
          title: 'Not verified by FRL',
          detail:
            'The identity data on this page was retrieved from a public registry and has not been independently verified by FRL.',
        },
      ],
      aiAnalysis: [],
    },
  };
}

/**
 * Resolves a company by id.
 *
 * - Demo ids (`c1`..`c4`) resolve from the local development dataset.
 * - Real ids (`oc_<jurisdiction>_<number>`) resolve ONLY when the registry
 *   provider confirms the company.
 * - Anything else, and every provider failure, yields `not_found` or an
 *   explicit error. No fabricated company is ever returned.
 */
export async function getCompanyById(
  id: string,
  options: RegistryClientOptions = {}
): Promise<CompanyLookupResult> {
  const demoMatch = MOCK_COMPANIES.find((company) => company.id === id);
  if (demoMatch) {
    return { status: 'found', company: demoMatch };
  }

  if (!id.startsWith('oc_')) {
    return { status: 'not_found' };
  }

  const lookup = await lookupRegistryCompany(id, options);

  if (!lookup.ok) {
    if (lookup.code === 'REGISTRY_COMPANY_NOT_FOUND') {
      return { status: 'not_found' };
    }
    return { status: 'error', code: lookup.code, message: lookup.message };
  }

  return { status: 'found', company: toCompanyProfile(lookup.company) };
}

/** Maps a confirmed registry record onto a search result. */
export function toSearchResult(company: NormalizedRegistryCompany): CompanySearchResult {
  return {
    id: company.id,
    name: registryDisplayName(company),
    businessType: company.entityType ?? undefined,
    industry: company.entityType ?? undefined,
    // Only set when the registry explicitly reported a country.
    country: company.country ?? undefined,
    jurisdictionCode: company.jurisdictionCode ?? undefined,
    registrationNumber: company.registrationNumber ?? undefined,
    officialWebsite: company.officialWebsite ?? undefined,
    profileStatus: 'unclaimed',
    source: company.source,
  };
}

/**
 * Maps a local development company onto a search result.
 * These are always labelled as internal demo data, never as registry records.
 */
export function demoToSearchResult(company: Company): CompanySearchResult {
  return {
    id: company.id,
    name: company.name,
    businessType: company.industry,
    industry: company.industry,
    country: company.country,
    jurisdictionCode: company.jurisdictionCode,
    registrationNumber: company.registration_no,
    officialWebsite: company.officialWebsite,
    profileStatus: company.isClaimed ? 'claimed' : 'unclaimed',
    reputationScore: company.reputationScore ?? null,
    reputationLevel: company.reputationLevel ?? null,
    source: {
      provider: 'FRL Development Demo Directory',
      sourceType: 'internal_demo',
      verificationStatus: 'unverified',
    },
  };
}
